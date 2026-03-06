import crypto from "crypto";
import { requireSuperAdmin } from "../middleware/adminAuth.js";

function hashPassword(password, email) {
  return crypto.createHash("sha256").update(password + email.toLowerCase()).digest("hex");
}

function safeAdmin(a) {
  return {
    id:        a.id,
    name:      a.name,
    email:     a.email,
    role:      a.role,
    centerId:  a.centerId,
    center:    a.center ?? null,
    status:    a.status,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export default async function adminsRoutes(fastify) {
  const { prisma } = fastify;
  const superAdminHook = requireSuperAdmin(prisma);

  // GET /api/admins
  fastify.get("/api/admins", { preHandler: superAdminHook }, async () => {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: "asc" },
      include: { center: { select: { id: true, name: true } } },
    });
    return admins.map(safeAdmin);
  });

  // POST /api/admins
  fastify.post("/api/admins", { preHandler: superAdminHook }, async (req, reply) => {
    const { name, email, password, role, centerId, status } = req.body ?? {};
    if (!name || !email || !password || !role) {
      return reply.code(400).send({ error: "name, email, password, role обязательны" });
    }
    const VALID_ROLES = ["super_admin", "center_admin", "moderator", "examiner"];
    if (!VALID_ROLES.includes(role)) {
      return reply.code(400).send({ error: `Роль должна быть одной из: ${VALID_ROLES.join(", ")}` });
    }
    const existing = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return reply.code(409).send({ error: "Администратор с таким email уже существует" });

    const admin = await prisma.admin.create({
      data: {
        name:         name.trim(),
        email:        email.trim().toLowerCase(),
        passwordHash: hashPassword(password, email),
        role,
        centerId:     centerId ? Number(centerId) : null,
        status:       status ?? "active",
      },
      include: { center: { select: { id: true, name: true } } },
    });
    return reply.code(201).send(safeAdmin(admin));
  });

  // PUT /api/admins/:id
  fastify.put("/api/admins/:id", { preHandler: superAdminHook }, async (req, reply) => {
    const id = Number(req.params.id);
    const { name, email, password, role, centerId, status } = req.body ?? {};

    const existing = await prisma.admin.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Администратор не найден" });

    const data = {};
    if (name)     data.name   = name.trim();
    if (email)    data.email  = email.trim().toLowerCase();
    if (password) data.passwordHash = hashPassword(password, email ?? existing.email);
    if (role)     data.role   = role;
    if (status)   data.status = status;
    if (centerId !== undefined) data.centerId = centerId ? Number(centerId) : null;

    const updated = await prisma.admin.update({
      where: { id },
      data,
      include: { center: { select: { id: true, name: true } } },
    });
    return safeAdmin(updated);
  });

  // DELETE /api/admins/:id
  fastify.delete("/api/admins/:id", { preHandler: superAdminHook }, async (req, reply) => {
    const id = Number(req.params.id);
    // Prevent deleting yourself
    if (req.admin.id === id) {
      return reply.code(400).send({ error: "Нельзя удалить свою учётную запись" });
    }
    const existing = await prisma.admin.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Администратор не найден" });

    await prisma.admin.delete({ where: { id } });
    return reply.code(204).send();
  });
}
