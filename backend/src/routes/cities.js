export default async function citiesRoutes(fastify) {
  const { prisma } = fastify;

  // GET /api/cities — all cities
  fastify.get("/api/cities", async () => {
    return prisma.city.findMany({
      orderBy: { name: "asc" },
      include: { centers: { select: { id: true, name: true } } },
    });
  });

  // GET /api/cities/:id/centers — centers in a city
  fastify.get("/api/cities/:id/centers", async (req, reply) => {
    const city = await prisma.city.findUnique({
      where: { id: Number(req.params.id) },
      include: { centers: { orderBy: { name: "asc" } } },
    });
    if (!city) return reply.code(404).send({ error: "Город не найден" });
    return city.centers;
  });

  // GET /api/centers/:id/exams — open exams at a center
  fastify.get("/api/centers/:id/exams", async (req, reply) => {
    const center = await prisma.examCenter.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!center) return reply.code(404).send({ error: "Центр не найден" });

    return prisma.exam.findMany({
      where: { examCenterId: center.id, isOpen: true, status: "active" },
      select: {
        id: true, title: true, examType: true, level: true,
        duration: true, startDate: true, endDate: true, passingScore: true,
      },
      orderBy: { startDate: "asc" },
    });
  });

  // POST /api/user/register-exam — authenticated user registers for an exam
  fastify.post("/api/user/register-exam", async (req, reply) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return reply.code(401).send({ error: "Требуется авторизация" });

    const student = await prisma.student.findUnique({ where: { sessionToken: token } });
    if (!student) return reply.code(401).send({ error: "Недействительный токен" });

    const { examId } = req.body ?? {};
    if (!examId) return reply.code(400).send({ error: "Укажите ID экзамена" });

    const exam = await prisma.exam.findUnique({
      where: { id: Number(examId) },
      select: { id: true, title: true, isOpen: true, status: true },
    });
    if (!exam) return reply.code(404).send({ error: "Экзамен не найден" });
    if (!exam.isOpen || exam.status !== "active") {
      return reply.code(400).send({ error: "Регистрация на этот экзамен недоступна" });
    }

    // Check if already registered
    const existing = await prisma.examAssignment.findUnique({
      where: { examId_studentId: { examId: exam.id, studentId: student.id } },
    });
    if (existing) {
      return { pin: existing.pin, examTitle: exam.title, alreadyRegistered: true };
    }

    const pin = await generateUniquePin(prisma);
    await prisma.examAssignment.create({
      data: { examId: exam.id, studentId: student.id, pin },
    });

    return reply.code(201).send({ pin, examTitle: exam.title });
  });
}

async function generateUniquePin(prisma) {
  const MAX_ATTEMPTS = 20;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const exists = await prisma.examAssignment.findUnique({ where: { pin } });
    if (!exists) return pin;
  }
  throw new Error("Не удалось сгенерировать уникальный PIN");
}
