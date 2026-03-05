export default async function examsRoutes(fastify) {
  const { prisma } = fastify;

  // GET /api/exams?status=active&level=B1
  fastify.get("/api/exams", async (req) => {
    const { status, level, examType } = req.query;
    const where = {};
    if (status)   where.status   = status;
    if (level)    where.level    = level;
    if (examType) where.examType = examType;

    const exams = await prisma.exam.findMany({
      where,
      include: { assignedStudents: { select: { studentId: true } } },
      orderBy: { id: "asc" },
    });

    return exams.map(flattenExam);
  });

  // GET /api/exams/:id
  fastify.get("/api/exams/:id", async (req, reply) => {
    const exam = await prisma.exam.findUnique({
      where: { id: Number(req.params.id) },
      include: { assignedStudents: { select: { studentId: true } } },
    });
    if (!exam) return reply.code(404).send({ error: "Not found" });
    return flattenExam(exam);
  });

  // POST /api/exams
  fastify.post("/api/exams", async (req, reply) => {
    const { assignedTo, ...rest } = req.body;
    const exam = await prisma.exam.create({
      data: {
        ...sanitize(rest),
        ...(assignedTo?.length
          ? { assignedStudents: { create: assignedTo.map((id) => ({ studentId: id })) } }
          : {}),
      },
      include: { assignedStudents: { select: { studentId: true } } },
    });
    return reply.code(201).send(flattenExam(exam));
  });

  // PUT /api/exams/:id
  fastify.put("/api/exams/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const { assignedTo, ...rest } = req.body;

    await prisma.exam.update({ where: { id }, data: sanitize(rest) });

    if (assignedTo !== undefined) {
      await prisma.examAssignment.deleteMany({ where: { examId: id } });
      if (assignedTo.length) {
        await prisma.examAssignment.createMany({
          data: assignedTo.map((sid) => ({ examId: id, studentId: sid })),
        });
      }
    }

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { assignedStudents: { select: { studentId: true } } },
    });
    return flattenExam(exam);
  });

  // DELETE /api/exams/:id
  fastify.delete("/api/exams/:id", async (req, reply) => {
    await prisma.exam.delete({ where: { id: Number(req.params.id) } });
    return reply.code(204).send();
  });

  // GET /api/exams/:id/questions  — build question list for taking the exam
  fastify.get("/api/exams/:id/questions", async (req, reply) => {
    const exam = await prisma.exam.findUnique({ where: { id: Number(req.params.id) } });
    if (!exam) return reply.code(404).send({ error: "Not found" });

    const questions = await buildExamQuestions(prisma, exam);
    return questions;
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function flattenExam(exam) {
  const { assignedStudents, ...rest } = exam;
  return { ...rest, assignedTo: assignedStudents.map((a) => a.studentId) };
}

function sanitize(body) {
  const allowed = [
    "title","examType","level","duration","passingScore",
    "shuffle","showResults","showQuestionLevel","showQuestionPoints",
    "subpools","placementTemplate","placementThresholds","showPlacementThreshold",
    "status","startDate","endDate",
  ];
  return Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );
}

function pick(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

async function buildExamQuestions(prisma, exam) {
  if (exam.examType === "placement") {
    const template = exam.placementTemplate || [];
    const result = [];
    for (const row of template) {
      for (const sp of row.subpools || []) {
        const pool = await prisma.question.findMany({
          where: { level: row.level, section: sp.section, status: "published" },
        });
        if (pool.length < sp.count) {
          throw new Error(`Not enough questions for ${row.level}/${sp.section}`);
        }
        const picked = pick(pool, sp.count).map((q) => ({ ...q, points: row.pointsEach }));
        result.push(...picked);
      }
    }
    return result;
  }

  // Fixed
  const result = [];
  for (const sp of exam.subpools || []) {
    const pool = await prisma.question.findMany({
      where: { level: exam.level, section: sp.section, status: "published" },
    });
    if (pool.length < sp.count) {
      throw new Error(`Not enough questions for ${exam.level}/${sp.section}`);
    }
    result.push(...pick(pool, sp.count));
  }
  return exam.shuffle ? pick(result, result.length) : result;
}
