import { requireAdmin } from "../middleware/adminAuth.js";

export default async function studentsRoutes(fastify) {
  const { prisma } = fastify;
  const adminHook = requireAdmin(prisma);

  // GET /api/students?level=B1&status=active&country=Armenia
  fastify.get("/api/students", { preHandler: adminHook }, async (req) => {
    const { level, status, country } = req.query;
    const where = {};
    if (level)   where.level   = level;
    if (status)  where.status  = status;
    if (country) where.country = country;
    return prisma.student.findMany({
      where,
      orderBy: { id: "asc" },
      select: {
        id: true, name: true, email: true, phone: true,
        country: true, documentType: true, documentNumber: true,
        gender: true, level: true, avatar: true, status: true, createdAt: true,
      },
    });
  });

  // GET /api/students/:id
  fastify.get("/api/students/:id", { preHandler: adminHook }, async (req, reply) => {
    const s = await prisma.student.findUnique({
      where: { id: Number(req.params.id) },
      include: { results: true },
    });
    if (!s) return reply.code(404).send({ error: "Not found" });
    return s;
  });

  // POST /api/students
  fastify.post("/api/students", { preHandler: adminHook }, async (req, reply) => {
    const { name, email } = req.body ?? {};
    if (!name || !email) {
      return reply.code(400).send({ error: "name and email are required" });
    }
    const s = await prisma.student.create({ data: sanitize(req.body) });
    return reply.code(201).send(s);
  });

  // PUT /api/students/:id
  fastify.put("/api/students/:id", { preHandler: adminHook }, async (req, reply) => {
    const s = await prisma.student.update({
      where: { id: Number(req.params.id) },
      data: sanitize(req.body),
    });
    return s;
  });

  // DELETE /api/students/:id
  fastify.delete("/api/students/:id", { preHandler: adminHook }, async (req, reply) => {
    await prisma.student.delete({ where: { id: Number(req.params.id) } });
    return reply.code(204).send();
  });
}

function sanitize(body) {
  const allowed = ["name","email","phone","country","documentType","documentNumber","gender","level","avatar","status"];
  return Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );
}
