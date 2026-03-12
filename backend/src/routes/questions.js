import { requireAdmin, requireRole } from "../middleware/adminAuth.js";

export default async function questionsRoutes(fastify) {
  const { prisma } = fastify;
  const adminHook     = requireAdmin(prisma);
  const moderatorHook = requireRole("super_admin", "center_admin", "moderator")(prisma);

  // Format: replace sectionId/section relation → flat { section, category }
  function fmt(q) {
    const { sectionId, section, ...rest } = q;
    return {
      ...rest,
      section:  section?.name     ?? String(sectionId),
      category: section?.category ?? "READING",
    };
  }

  async function resolveSectionId(name, reply) {
    const sec = await prisma.section.findUnique({ where: { name } });
    if (!sec) { reply.code(400).send({ error: `Section '${name}' not found` }); return null; }
    return sec.id;
  }

  // GET /api/questions?level=B1&section=Reading&type=SINGLE_CHOICE&status=published
  fastify.get("/api/questions", { preHandler: adminHook }, async (req) => {
    const { level, section, type, status } = req.query;
    const where = {};
    if (level)  where.level  = level;
    if (type)   where.type   = type;
    if (status) where.status = status;
    if (section) {
      const sec = await prisma.section.findUnique({ where: { name: section } });
      if (!sec) return [];
      where.sectionId = sec.id;
    }
    const qs = await prisma.question.findMany({
      where,
      include: { section: true },
      orderBy: [{ level: "asc" }, { id: "asc" }],
    });
    return qs.map(fmt);
  });

  // GET /api/questions/:id
  fastify.get("/api/questions/:id", { preHandler: adminHook }, async (req, reply) => {
    const q = await prisma.question.findUnique({
      where: { id: Number(req.params.id) },
      include: { section: true },
    });
    if (!q) return reply.code(404).send({ error: "Not found" });
    return fmt(q);
  });

  // POST /api/questions
  // Required: type, level, section, prompt
  fastify.post("/api/questions", { preHandler: moderatorHook }, async (req, reply) => {
    const { type, level, section, prompt } = req.body ?? {};
    if (!type || !level || !section || !prompt) {
      return reply.code(400).send({ error: "type, level, section, prompt are required" });
    }
    const sectionId = await resolveSectionId(section, reply);
    if (sectionId === null) return;
    const q = await prisma.question.create({
      data: { ...sanitize(req.body), sectionId },
      include: { section: true },
    });
    return reply.code(201).send(fmt(q));
  });

  // PUT /api/questions/:id
  fastify.put("/api/questions/:id", { preHandler: moderatorHook }, async (req, reply) => {
    const data = sanitize(req.body);
    if (req.body.section) {
      const sectionId = await resolveSectionId(req.body.section, reply);
      if (sectionId === null) return;
      data.sectionId = sectionId;
    }
    const q = await prisma.question.update({
      where: { id: Number(req.params.id) },
      data,
      include: { section: true },
    });
    return fmt(q);
  });

  // DELETE /api/questions/:id
  fastify.delete("/api/questions/:id", { preHandler: moderatorHook }, async (req, reply) => {
    await prisma.question.delete({ where: { id: Number(req.params.id) } });
    return reply.code(204).send();
  });

  // GET /api/sections  — list all sections with category
  fastify.get("/api/sections", { preHandler: adminHook }, async () => {
    return prisma.section.findMany({ orderBy: { name: "asc" } });
  });
}

// Only allow known Question fields through to Prisma
function sanitize(body) {
  const allowed = [
    "type", "level", "points", "status",
    "contextText", "media",
    "prompt",
    "content", "config",
  ];
  return Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );
}
