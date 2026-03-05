export default async function questionsRoutes(fastify) {
  const { prisma } = fastify;

  // GET /api/questions?level=B1&section=Reading&type=single_choice
  fastify.get("/api/questions", async (req) => {
    const { level, section, type, status } = req.query;
    const where = {};
    if (level)   where.level   = level;
    if (section) where.section = section;
    if (type)    where.type    = type;
    if (status)  where.status  = status;
    return prisma.question.findMany({ where, orderBy: { id: "asc" } });
  });

  // GET /api/questions/:id
  fastify.get("/api/questions/:id", async (req, reply) => {
    const q = await prisma.question.findUnique({ where: { id: Number(req.params.id) } });
    if (!q) return reply.code(404).send({ error: "Not found" });
    return q;
  });

  // POST /api/questions
  fastify.post("/api/questions", async (req, reply) => {
    const q = await prisma.question.create({ data: sanitize(req.body) });
    return reply.code(201).send(q);
  });

  // PUT /api/questions/:id
  fastify.put("/api/questions/:id", async (req, reply) => {
    const q = await prisma.question.update({
      where: { id: Number(req.params.id) },
      data: sanitize(req.body),
    });
    return q;
  });

  // DELETE /api/questions/:id
  fastify.delete("/api/questions/:id", async (req, reply) => {
    await prisma.question.delete({ where: { id: Number(req.params.id) } });
    return reply.code(204).send();
  });
}

function sanitize(body) {
  const allowed = [
    "type","level","section","points","text",
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
