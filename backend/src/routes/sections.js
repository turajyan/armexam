import { requireAdmin, requireRole } from "../middleware/adminAuth.js";

export default async function sectionsRoutes(fastify) {
  const { prisma } = fastify;
  const adminHook     = requireAdmin(prisma);
  const moderatorHook = requireRole("super_admin", "center_admin", "moderator")(prisma);

  // GET /api/sections
  fastify.get("/api/sections", { preHandler: adminHook }, async () => {
    return prisma.section.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  });

  // POST /api/sections
  fastify.post("/api/sections", { preHandler: moderatorHook }, async (req, reply) => {
    const { name } = req.body ?? {};
    if (!name?.trim()) return reply.code(400).send({ error: "name is required" });
    try {
      const agg = await prisma.section.aggregate({ _max: { sortOrder: true } });
      const nextOrder = (agg._max.sortOrder ?? -1) + 1;
      const section = await prisma.section.create({ data: { name: name.trim(), sortOrder: nextOrder } });
      return reply.code(201).send(section);
    } catch (e) {
      if (e.code === "P2002") return reply.code(409).send({ error: "Section already exists" });
      throw e;
    }
  });

  // PUT /api/sections/:id  — rename, also patches exam JSON blobs
  fastify.put("/api/sections/:id", { preHandler: moderatorHook }, async (req, reply) => {
    const id = Number(req.params.id);
    const { name } = req.body ?? {};
    if (!name?.trim()) return reply.code(400).send({ error: "name is required" });
    const newName = name.trim();

    const existing = await prisma.section.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Not found" });

    const oldName = existing.name;
    try {
      const { sortOrder } = req.body ?? {};
      const data = { name: newName };
      if (Number.isInteger(sortOrder)) data.sortOrder = sortOrder;
      const section = await prisma.section.update({ where: { id }, data });

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

  // PATCH /api/sections/reorder — [{id, sortOrder}, ...]
  fastify.patch("/api/sections/reorder", { preHandler: moderatorHook }, async (req, reply) => {
    const items = req.body ?? [];
    if (!Array.isArray(items) || items.some(i => !Number.isInteger(i.id))) {
      return reply.code(400).send({ error: "Expected [{id, sortOrder}]" });
    }
    await prisma.$transaction(
      items.map(({ id, sortOrder }) =>
        prisma.section.update({ where: { id }, data: { sortOrder } })
      )
    );
    return prisma.section.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  });

  // DELETE /api/sections/:id
  fastify.delete("/api/sections/:id", { preHandler: moderatorHook }, async (req, reply) => {
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
