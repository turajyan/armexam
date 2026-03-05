export default async function registerRoutes(fastify) {
  const { prisma } = fastify;

  // GET /api/register/exams — public list of active exams for registration page
  fastify.get("/api/register/exams", async () => {
    return prisma.exam.findMany({
      where: { status: "active" },
      select: {
        id: true,
        title: true,
        examType: true,
        level: true,
        duration: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { title: "asc" },
    });
  });

  // POST /api/register — student self-registration with exam selection
  // Body: { name, email, phone?, group?, examIds: number[] }
  // Response: { student, assignments: [{ examId, examTitle, pin }] }
  fastify.post("/api/register", async (req, reply) => {
    const { name, email, phone, group, examIds } = req.body ?? {};

    if (!name || !email) {
      return reply.code(400).send({ error: "Имя и email обязательны" });
    }
    if (!Array.isArray(examIds) || examIds.length === 0) {
      return reply.code(400).send({ error: "Выберите хотя бы один экзамен" });
    }

    // Validate that all requested exams are active
    const exams = await prisma.exam.findMany({
      where: { id: { in: examIds }, status: "active" },
      select: { id: true, title: true },
    });

    if (exams.length !== examIds.length) {
      return reply.code(400).send({ error: "Один или несколько выбранных экзаменов недоступны" });
    }

    // Create or find student
    let student;
    try {
      student = await prisma.student.upsert({
        where: { email },
        create: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          group: group || null,
          avatar: name.trim()[0].toUpperCase(),
        },
        update: {
          name: name.trim(),
          phone: phone?.trim() || null,
          group: group || null,
        },
      });
    } catch {
      return reply.code(400).send({ error: "Ошибка создания студента" });
    }

    // Generate unique PINs and create assignments
    const assignments = [];
    for (const exam of exams) {
      // Check if already assigned
      const existing = await prisma.examAssignment.findUnique({
        where: { examId_studentId: { examId: exam.id, studentId: student.id } },
      });

      if (existing) {
        assignments.push({ examId: exam.id, examTitle: exam.title, pin: existing.pin, alreadyRegistered: true });
        continue;
      }

      const pin = await generateUniquePin(prisma);
      await prisma.examAssignment.create({
        data: { examId: exam.id, studentId: student.id, pin },
      });
      assignments.push({ examId: exam.id, examTitle: exam.title, pin });
    }

    return reply.code(201).send({ student, assignments });
  });

  // GET /api/register/pin/:pin — look up assignment by PIN
  fastify.get("/api/register/pin/:pin", async (req, reply) => {
    const assignment = await prisma.examAssignment.findUnique({
      where: { pin: req.params.pin },
      include: {
        student: { select: { id: true, name: true, email: true, phone: true, group: true, level: true } },
        exam: { select: { id: true, title: true, examType: true, level: true, duration: true, startDate: true, endDate: true } },
      },
    });
    if (!assignment) return reply.code(404).send({ error: "PIN не найден" });
    return assignment;
  });
}

async function generateUniquePin(prisma) {
  const MAX_ATTEMPTS = 20;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const pin = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    const exists = await prisma.examAssignment.findUnique({ where: { pin } });
    if (!exists) return pin;
  }
  throw new Error("Не удалось сгенерировать уникальный PIN");
}
