export default async function questionsRoutes(fastify) {
  const { prisma } = fastify;

  // Flatten: replace sectionId + section relation with section name string
  function fmt(q) {
    const { sectionId, section, ...rest } = q;
    return { ...rest, section: section?.name ?? String(sectionId) };
  }

  // Resolve section name → id
  async function resolveSectionId(name, reply) {
    const sec = await prisma.section.findUnique({ where: { name } });
    if (!sec) { reply.code(400).send({ error: `Section '${name}' not found` }); return null; }
    return sec.id;
  }

  // GET /api/questions?level=B1&section=Reading&type=single_choice
  fastify.get("/api/questions", async (req) => {
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
    const questions = await prisma.question.findMany({
      where,
      include: { section: true },
      orderBy: { id: "asc" },
    });
    return questions.map(fmt);
  });

  // GET /api/questions/:id
  fastify.get("/api/questions/:id", async (req, reply) => {
    const q = await prisma.question.findUnique({
      where: { id: Number(req.params.id) },
      include: { section: true },
    });
    if (!q) return reply.code(404).send({ error: "Not found" });
    return fmt(q);
  });

  // POST /api/questions
  fastify.post("/api/questions", async (req, reply) => {
    const { type, level, section, text } = req.body ?? {};
    if (!type || !level || !section || !text) {
      return reply.code(400).send({ error: "type, level, section, text are required" });
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
  fastify.put("/api/questions/:id", async (req, reply) => {
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
  fastify.delete("/api/questions/:id", async (req, reply) => {
    await prisma.question.delete({ where: { id: Number(req.params.id) } });
    return reply.code(204).send();
  });
}

function sanitize(body) {
  const allowed = [
    "type","level","points","text",
    "options","correct","answer",
    "segments","wordBank",
    "audioSrc","videoSrc","maxPlays","pauseSeconds",
    "maxSeconds","minSeconds","maxAttempts",
    "minWords","maxWords","status",
  ];
  return Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );
}
