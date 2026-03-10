import crypto from "crypto";

function hashPassword(password, email) {
  return crypto.createHash("sha256").update(password + email.toLowerCase()).digest("hex");
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function safeAdmin(admin) {
  return {
    id:        admin.id,
    name:      admin.name,
    email:     admin.email,
    role:      admin.role,
    centerId:  admin.centerId,
    center:    admin.center ?? null,
    status:    admin.status,
    createdAt: admin.createdAt,
  };
}

export default async function adminAuthRoutes(fastify) {
  const { prisma } = fastify;

  // POST /api/admin/login
  fastify.post("/api/admin/login", async (req, reply) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return reply.code(400).send({ error: "Email и пароль обязательны" });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
      include: { center: { select: { id: true, name: true } } },
    });
    if (!admin || admin.status !== "active") {
      return reply.code(401).send({ error: "Неверный email или пароль" });
    }

    const hash = hashPassword(password, email);
    if (hash !== admin.passwordHash) {
      return reply.code(401).send({ error: "Неверный email или пароль" });
    }

    const sessionToken = generateToken();
    await prisma.admin.update({ where: { id: admin.id }, data: { sessionToken } });

    return { token: sessionToken, admin: safeAdmin({ ...admin, sessionToken }) };
  });

  // GET /api/admin/me
  fastify.get("/api/admin/me", async (req, reply) => {
    const token = req.headers.authorization?.replace("Bearer ", "").trim();
    if (!token) return reply.code(401).send({ error: "Требуется авторизация" });

    const admin = await prisma.admin.findUnique({
      where: { sessionToken: token },
      include: { center: { select: { id: true, name: true } } },
    });
    if (!admin || admin.status !== "active") {
      return reply.code(401).send({ error: "Недействительный токен" });
    }

    return safeAdmin(admin);
  });

  // POST /api/admin/logout
  fastify.post("/api/admin/logout", async (req, reply) => {
    const token = req.headers.authorization?.replace("Bearer ", "").trim();
    if (token) {
      await prisma.admin.updateMany({ where: { sessionToken: token }, data: { sessionToken: null } });
    }
    return reply.code(204).send();
  });
}
