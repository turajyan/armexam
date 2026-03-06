import { requireAdmin } from "../middleware/adminAuth.js";

export default async function examsRoutes(fastify) {
  const { prisma } = fastify;
  const adminHook = requireAdmin(prisma);

  // GET /api/exams?status=active&level=B1
  fastify.get("/api/exams", { preHandler: adminHook }, async (req) => {
    const { status, level, examType } = req.query;
    const where = {};
    if (status)   where.status   = status;
    if (level)    where.level    = level;
    if (examType) where.examType = examType;

    const exams = await prisma.exam.findMany({
      where,
      include: { assignedStudents: { select: { studentId: true, pin: true } } },
      orderBy: { id: "asc" },
    });

    return exams.map(flattenExam);
  });

  // GET /api/exams/:id
  fastify.get("/api/exams/:id", { preHandler: adminHook }, async (req, reply) => {
    const exam = await prisma.exam.findUnique({
      where: { id: Number(req.params.id) },
      include: { assignedStudents: { select: { studentId: true, pin: true } } },
    });
    if (!exam) return reply.code(404).send({ error: "Not found" });
    return flattenExam(exam);
  });

  // POST /api/exams
  fastify.post("/api/exams", { preHandler: adminHook }, async (req, reply) => {
    const { assignedTo, ...rest } = req.body;

    let assignedStudentsData = {};
    if (assignedTo?.length) {
      const assignments = [];
      for (const sid of assignedTo) {
        const pin = await generateUniquePin(prisma);
        assignments.push({ studentId: sid, pin });
      }
      assignedStudentsData = { assignedStudents: { create: assignments } };
    }

    const exam = await prisma.exam.create({
      data: { ...sanitize(rest), ...assignedStudentsData },
      include: { assignedStudents: { select: { studentId: true, pin: true } } },
    });
    return reply.code(201).send(flattenExam(exam));
  });

  // PUT /api/exams/:id
  fastify.put("/api/exams/:id", { preHandler: adminHook }, async (req, reply) => {
    const id = Number(req.params.id);
    const { assignedTo, ...rest } = req.body;

    await prisma.exam.update({ where: { id }, data: sanitize(rest) });

    if (assignedTo !== undefined) {
      // Keep existing assignments (preserve PINs), only add/remove
      const existing = await prisma.examAssignment.findMany({
        where: { examId: id },
        select: { studentId: true, pin: true },
      });
      const existingIds = existing.map((a) => a.studentId);
      const newIds = assignedTo;

      // Remove students no longer assigned
      const toRemove = existingIds.filter((sid) => !newIds.includes(sid));
      if (toRemove.length) {
        await prisma.examAssignment.deleteMany({
          where: { examId: id, studentId: { in: toRemove } },
        });
      }

      // Add newly assigned students with fresh PINs
      const toAdd = newIds.filter((sid) => !existingIds.includes(sid));
      for (const sid of toAdd) {
        const pin = await generateUniquePin(prisma);
        await prisma.examAssignment.create({ data: { examId: id, studentId: sid, pin } });
      }
    }

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { assignedStudents: { select: { studentId: true, pin: true } } },
    });
    return flattenExam(exam);
  });

  // DELETE /api/exams/:id
  fastify.delete("/api/exams/:id", { preHandler: adminHook }, async (req, reply) => {
    await prisma.exam.delete({ where: { id: Number(req.params.id) } });
    return reply.code(204).send();
  });

  // GET /api/exams/:id/assignments — returns students with their PINs
  fastify.get("/api/exams/:id/assignments", { preHandler: adminHook }, async (req, reply) => {
    const id = Number(req.params.id);
    const assignments = await prisma.examAssignment.findMany({
      where: { examId: id },
      include: {
        student: { select: { id: true, name: true, email: true, phone: true, level: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return assignments.map((a) => ({
      studentId: a.studentId,
      pin: a.pin,
      name: a.student.name,
      email: a.student.email,
      phone: a.student.phone,
      level: a.student.level,
      registeredAt: a.createdAt,
    }));
  });

  // GET /api/exams/:id/questions  — build question list for taking the exam
  fastify.get("/api/exams/:id/questions", async (req, reply) => {
    const exam = await prisma.exam.findUnique({ where: { id: Number(req.params.id) } });
    if (!exam) return reply.code(404).send({ error: "Not found" });

    try {
      const questions = await buildExamQuestions(prisma, exam);
      return questions;
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function flattenExam(exam) {
  const { assignedStudents, ...rest } = exam;
  return {
    ...rest,
    assignedTo: assignedStudents.map((a) => a.studentId),
    assignments: assignedStudents.map((a) => ({ studentId: a.studentId, pin: a.pin })),
  };
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
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
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
