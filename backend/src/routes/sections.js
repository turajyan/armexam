export default async function sectionsRoutes(fastify) {
  const { prisma } = fastify;

  // GET /api/sections
  fastify.get("/api/sections", async () => {
    return prisma.section.findMany({ orderBy: { name: "asc" } });
  });

  // POST /api/sections
  fastify.post("/api/sections", async (req, reply) => {
    const { name } = req.body ?? {};
    if (!name?.trim()) return reply.code(400).send({ error: "name is required" });
    try {
      const section = await prisma.section.create({ data: { name: name.trim() } });
      return reply.code(201).send(section);
    } catch (e) {
      if (e.code === "P2002") return reply.code(409).send({ error: "Section already exists" });
      throw e;
    }
  });

  // PUT /api/sections/:id  — rename, also patches exam JSON blobs
  fastify.put("/api/sections/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const { name } = req.body ?? {};
    if (!name?.trim()) return reply.code(400).send({ error: "name is required" });
    const newName = name.trim();

    const existing = await prisma.section.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Not found" });

    const oldName = existing.name;
    try {
      const section = await prisma.section.update({ where: { id }, data: { name: newName } });

      // Patch section name inside exam JSON blobs (subpools + placementTemplate)
      if (oldName !== newName) {
        const exams = await prisma.exam.findMany();
        for (const exam of exams) {
          const update = {};
          if (exam.subpools) {
            update.subpools = exam.subpools.map((sp) =>
              sp.section === oldName ? { ...sp, section: newName } : sp
            );
          }
          if (exam.placementTemplate) {
            update.placementTemplate = exam.placementTemplate.map((row) => ({
              ...row,
              subpools: row.subpools?.map((sp) =>
                sp.section === oldName ? { ...sp, section: newName } : sp
              ),
            }));
          }
          if (Object.keys(update).length) {
            await prisma.exam.update({ where: { id: exam.id }, data: update });
          }
        }
      }

      return section;
    } catch (e) {
      if (e.code === "P2002") return reply.code(409).send({ error: "Section name already exists" });
      throw e;
    }
  });

  // DELETE /api/sections/:id
  fastify.delete("/api/sections/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const count = await prisma.question.count({ where: { sectionId: id } });
    if (count > 0) {
      return reply.code(409).send({ error: `Cannot delete: ${count} question(s) use this section` });
    }
    try {
      await prisma.section.delete({ where: { id } });
      return reply.code(204).send();
    } catch (e) {
      if (e.code === "P2025") return reply.code(404).send({ error: "Not found" });
      throw e;
    }
  });
}
