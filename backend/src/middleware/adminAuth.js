// Extracts admin from Bearer token and attaches to req.admin
async function authenticate(req, reply, prisma) {
  const token = req.headers.authorization?.replace("Bearer ", "").trim();
  if (!token) {
    reply.code(401).send({ error: "Требуется авторизация администратора" });
    return null;
  }
  const admin = await prisma.admin.findUnique({
    where: { sessionToken: token },
    include: { center: { select: { id: true, name: true } } },
  });
  if (!admin || admin.status !== "active") {
    reply.code(401).send({ error: "Недействительный или истёкший токен" });
    return null;
  }
  return admin;
}

// Any authenticated admin
export function requireAdmin(prisma) {
  return async (req, reply) => {
    const admin = await authenticate(req, reply, prisma);
    if (!admin) return;
    req.admin = admin;
  };
}

// Only super_admin
export function requireSuperAdmin(prisma) {
  return async (req, reply) => {
    const admin = await authenticate(req, reply, prisma);
    if (!admin) return;
    if (admin.role !== "super_admin") {
      return reply.code(403).send({ error: "Доступ запрещён: требуется роль super_admin" });
    }
    req.admin = admin;
  };
}

// super_admin OR center_admin whose centerId matches
export function requireCenterAccess(prisma) {
  return async (req, reply) => {
    const admin = await authenticate(req, reply, prisma);
    if (!admin) return;
    if (admin.role === "super_admin") { req.admin = admin; return; }
    if (admin.role === "center_admin") {
      const centerId = Number(req.params.centerId ?? req.query.centerId ?? req.body?.examCenterId);
      if (admin.centerId && admin.centerId === centerId) { req.admin = admin; return; }
      return reply.code(403).send({ error: "Нет доступа к этому центру" });
    }
    return reply.code(403).send({ error: "Доступ запрещён" });
  };
}

// Any admin EXCEPT student-only token (covers moderator/examiner too)
export function requireRole(...roles) {
  return (prisma) => async (req, reply) => {
    const admin = await authenticate(req, reply, prisma);
    if (!admin) return;
    if (!roles.includes(admin.role)) {
      return reply.code(403).send({ error: `Доступ запрещён: требуется роль ${roles.join(" или ")}` });
    }
    req.admin = admin;
  };
}
