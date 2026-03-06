import crypto from "crypto";

function hashPassword(password, email) {
  return crypto.createHash("sha256").update(password + email.toLowerCase()).digest("hex");
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export default async function authRoutes(fastify) {
  const { prisma } = fastify;

  // POST /api/auth/register
  fastify.post("/api/auth/register", async (req, reply) => {
    const { name, email, password, phone, country, documentType, documentNumber, gender } = req.body ?? {};

    if (!name || !email || !password || !country || !documentType || !documentNumber) {
      return reply.code(400).send({ error: "Все обязательные поля должны быть заполнены" });
    }
    if (!email.includes("@")) {
      return reply.code(400).send({ error: "Некорректный email" });
    }
    if (password.length < 6) {
      return reply.code(400).send({ error: "Пароль должен содержать минимум 6 символов" });
    }

    const existing = await prisma.student.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return reply.code(409).send({ error: "Пользователь с таким email уже зарегистрирован" });
    }

    const passwordHash = hashPassword(password, email);
    const sessionToken = generateToken();

    const student = await prisma.student.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        phone: phone?.trim() || null,
        country: country.trim(),
        documentType,
        documentNumber: documentNumber.trim(),
        gender: gender || "",
        sessionToken,
      },
    });

    return reply.code(201).send({
      token: sessionToken,
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        country: student.country,
        documentType: student.documentType,
        documentNumber: student.documentNumber,
        level: student.level,
      },
    });
  });

  // POST /api/auth/login
  fastify.post("/api/auth/login", async (req, reply) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return reply.code(400).send({ error: "Email и пароль обязательны" });
    }

    const student = await prisma.student.findUnique({ where: { email: email.toLowerCase() } });
    if (!student) {
      return reply.code(401).send({ error: "Неверный email или пароль" });
    }

    const hash = hashPassword(password, email);
    if (hash !== student.passwordHash) {
      return reply.code(401).send({ error: "Неверный email или пароль" });
    }

    const sessionToken = generateToken();
    await prisma.student.update({
      where: { id: student.id },
      data: { sessionToken },
    });

    return {
      token: sessionToken,
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        country: student.country,
        documentType: student.documentType,
        documentNumber: student.documentNumber,
        level: student.level,
      },
    };
  });

  // GET /api/auth/me — requires Authorization: Bearer <token>
  fastify.get("/api/auth/me", async (req, reply) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return reply.code(401).send({ error: "Требуется авторизация" });

    const student = await prisma.student.findUnique({
      where: { sessionToken: token },
      include: {
        exams: {
          include: {
            exam: {
              select: {
                id: true, title: true, examType: true, level: true,
                duration: true, startDate: true, endDate: true,
                examCenter: { select: { id: true, name: true, city: { select: { id: true, name: true } } } },
              },
            },
          },
        },
      },
    });
    if (!student) return reply.code(401).send({ error: "Недействительный токен" });

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      country: student.country,
      documentType: student.documentType,
      documentNumber: student.documentNumber,
      level: student.level,
      registeredExams: student.exams.map(a => ({
        pin: a.pin,
        registeredAt: a.createdAt,
        exam: a.exam,
      })),
    };
  });

  // POST /api/auth/logout
  fastify.post("/api/auth/logout", async (req, reply) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      await prisma.student.updateMany({
        where: { sessionToken: token },
        data: { sessionToken: null },
      });
    }
    return reply.code(204).send();
  });
}
