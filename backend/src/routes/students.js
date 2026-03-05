export default async function studentsRoutes(fastify) {
  const { prisma } = fastify;

  // GET /api/students?group=Խ-101&level=B1&status=active
  fastify.get("/api/students", async (req) => {
    const { group, level, status } = req.query;
    const where = {};
    if (group)  where.group  = group;
    if (level)  where.level  = level;
    if (status) where.status = status;
    return prisma.student.findMany({ where, orderBy: { id: "asc" } });
  });

  // GET /api/students/:id
  fastify.get("/api/students/:id", async (req, reply) => {
    const s = await prisma.student.findUnique({
      where: { id: Number(req.params.id) },
      include: { results: true },
    });
    if (!s) return reply.code(404).send({ error: "Not found" });
    return s;
  });

  // POST /api/students
  fastify.post("/api/students", async (req, reply) => {
    const s = await prisma.student.create({ data: sanitize(req.body) });
    return reply.code(201).send(s);
  });

  // PUT /api/students/:id
  fastify.put("/api/students/:id", async (req, reply) => {
    const s = await prisma.student.update({
      where: { id: Number(req.params.id) },
      data: sanitize(req.body),
    });
    return s;
  });

  // DELETE /api/students/:id
  fastify.delete("/api/students/:id", async (req, reply) => {
    await prisma.student.delete({ where: { id: Number(req.params.id) } });
    return reply.code(204).send();
  });
}

function sanitize(body) {
  const allowed = ["name","email","phone","group","level","status","avatar"];
  return Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );
}
