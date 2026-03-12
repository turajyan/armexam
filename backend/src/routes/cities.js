import { requireAdmin, requireSuperAdmin } from "../middleware/adminAuth.js";

export default async function citiesRoutes(fastify) {
  const { prisma } = fastify;
  const adminHook      = requireAdmin(prisma);
  const superAdminHook = requireSuperAdmin(prisma);

  // ── Cities ──────────────────────────────────────────────────────────────────

  // Public — needed for student exam registration flow
  fastify.get("/api/cities", async () => {
    return prisma.city.findMany({
      orderBy: { name: "asc" },
      include: { centers: { orderBy: { name: "asc" } } },
    });
  });

  fastify.post("/api/cities", { preHandler: superAdminHook }, async (req, reply) => {
    const { name } = req.body ?? {};
    if (!name?.trim()) return reply.code(400).send({ error: "Название города обязательно" });
    try {
      const city = await prisma.city.create({ data: { name: name.trim() } });
      return reply.code(201).send(city);
    } catch {
      return reply.code(409).send({ error: "Город с таким названием уже существует" });
    }
  });

  fastify.put("/api/cities/:id", { preHandler: superAdminHook }, async (req, reply) => {
    const { name } = req.body ?? {};
    if (!name?.trim()) return reply.code(400).send({ error: "Название города обязательно" });
    return prisma.city.update({ where: { id: Number(req.params.id) }, data: { name: name.trim() } });
  });

  fastify.delete("/api/cities/:id", { preHandler: superAdminHook }, async (req, reply) => {
    await prisma.city.delete({ where: { id: Number(req.params.id) } });
    return reply.code(204).send();
  });

  fastify.get("/api/cities/:id/centers", async (req, reply) => {
    const cityId = Number(req.params.id);
    if (!cityId || isNaN(cityId)) return reply.code(400).send({ error: "Invalid city ID" });
    const city = await prisma.city.findUnique({
      where: { id: Number(req.params.id) },
      include: { centers: { orderBy: { name: "asc" } } },
    });
    if (!city) return reply.code(404).send({ error: "Город не найден" });
    return city.centers;
  });

  // ── Centers ─────────────────────────────────────────────────────────────────

  fastify.get("/api/centers", { preHandler: adminHook }, async () => {
    return prisma.examCenter.findMany({
      orderBy: { name: "asc" },
      include: {
        city: true,
        exams: { select: { id: true, title: true, status: true, isOpen: true } },
        _count: { select: { exams: true } },
      },
    });
  });

  fastify.get("/api/centers/:id", { preHandler: adminHook }, async (req, reply) => {
    const c = await prisma.examCenter.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        city: true,
        exams: { select: { id: true, title: true, examType: true, status: true, isOpen: true, startDate: true, endDate: true } },
      },
    });
    if (!c) return reply.code(404).send({ error: "Центр не найден" });
    return c;
  });

  fastify.post("/api/centers", { preHandler: superAdminHook }, async (req, reply) => {
    const { name, address, phone, email, cityId } = req.body ?? {};
    if (!name?.trim() || !cityId) return reply.code(400).send({ error: "Название и город обязательны" });
    const center = await prisma.examCenter.create({
      data: { name: name.trim(), address: address?.trim() || "", phone: phone?.trim() || "", email: email?.trim() || "", cityId: Number(cityId) },
      include: { city: true },
    });
    return reply.code(201).send(center);
  });

  fastify.put("/api/centers/:id", { preHandler: superAdminHook }, async (req, reply) => {
    const { name, address, phone, email, cityId } = req.body ?? {};
    if (!name?.trim()) return reply.code(400).send({ error: "Название обязательно" });
    return prisma.examCenter.update({
      where: { id: Number(req.params.id) },
      data: { name: name.trim(), address: address?.trim() || "", phone: phone?.trim() || "", email: email?.trim() || "", ...(cityId ? { cityId: Number(cityId) } : {}) },
      include: { city: true },
    });
  });

  fastify.delete("/api/centers/:id", { preHandler: superAdminHook }, async (req, reply) => {
    await prisma.examCenter.delete({ where: { id: Number(req.params.id) } });
    return reply.code(204).send();
  });

  // GET /api/centers/:id/exams — open exams at center (public)
  fastify.get("/api/centers/:id/exams", async (req, reply) => {
    const center = await prisma.examCenter.findUnique({ where: { id: Number(req.params.id) } });
    if (!center) return reply.code(404).send({ error: "Центр не найден" });
    return prisma.exam.findMany({
      where: { examCenterId: center.id, isOpen: true, status: "active" },
      select: { id: true, title: true, examType: true, level: true, duration: true, startDate: true, endDate: true, startTime: true, endTime: true, passingScore: true,
        examCenter: { select: { id: true, name: true, city: { select: { id: true, name: true } } } } },
      orderBy: { startDate: "asc" },
    });
  });

  // POST /api/user/register-exam — authenticated student self-registers
  fastify.post("/api/user/register-exam", async (req, reply) => {
    const token = req.headers.authorization?.replace("Bearer ", "").trim();
    if (!token) return reply.code(401).send({ error: "Требуется авторизация" });
    const student = await prisma.student.findUnique({ where: { sessionToken: token } });
    if (!student) return reply.code(401).send({ error: "Недействительный токен" });

    const { examId } = req.body ?? {};
    if (!examId) return reply.code(400).send({ error: "Укажите ID экзамена" });

    const exam = await prisma.exam.findUnique({ where: { id: Number(examId) }, select: { id: true, title: true, isOpen: true, status: true, startDate: true, endDate: true } });
    if (!exam) return reply.code(404).send({ error: "Экзамен не найден" });
    if (!exam.isOpen || exam.status !== "active") return reply.code(400).send({ error: "Регистрация на этот экзамен недоступна" });

    const existing = await prisma.examAssignment.findUnique({
      where: { examId_studentId: { examId: exam.id, studentId: student.id } },
    });
    if (existing) return { pin: existing.pin, examTitle: exam.title, startDate: exam.startDate, endDate: exam.endDate, alreadyRegistered: true };

    const pin = await generateUniquePin(prisma);
    await prisma.examAssignment.create({ data: { examId: exam.id, studentId: student.id, pin } });
    return reply.code(201).send({ pin, examTitle: exam.title, startDate: exam.startDate, endDate: exam.endDate });
  });
}

const PIN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const PIN_LENGTH = 8;

function randomPin() {
  return Array.from({ length: PIN_LENGTH }, () =>
    PIN_CHARS[Math.floor(Math.random() * PIN_CHARS.length)]
  ).join("");
}

async function generateUniquePin(prisma) {
  for (let i = 0; i < 20; i++) {
    const pin = randomPin();
    const exists = await prisma.examAssignment.findUnique({ where: { pin } });
    if (!exists) return pin;
  }
  throw new Error("Не удалось сгенерировать уникальный PIN");
}
