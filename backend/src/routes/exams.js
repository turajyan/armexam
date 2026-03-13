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
  fastify.get("/api/exams/:id/questions", { preHandler: adminHook }, async (req, reply) => {
    const exam = await prisma.exam.findUnique({ where: { id: Number(req.params.id) } });
    if (!exam) return reply.code(404).send({ error: "Not found" });

    const preview = req.query.preview === "true";
    try {
      const questions = await buildExamQuestions(prisma, exam, preview);
      return questions;
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

// Fallback order used only if DB is unreachable
const SECTION_ORDER_FALLBACK = ["READING", "LISTENING", "WRITING", "SPEAKING"];

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
    "title", "examType", "level", "duration", "passingScore",
    "shuffle", "showResults", "showQuestionLevel", "showQuestionPoints",
    "subpools", "placementTemplate", "placementThresholds", "showPlacementThreshold",
    "status", "isOpen",
    "startDate", "endDate", "startTime",
    "examCenterId",
  ];
  const out = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );
  // Coerce date strings -> ISO or null
  for (const f of ["startDate", "endDate"]) {
    if (out[f] === "" || out[f] === undefined) out[f] = null;
    else if (typeof out[f] === "string" && out[f] && !out[f].includes("T"))
      out[f] = new Date(out[f]).toISOString();
  }
  if (out.startTime === "") out.startTime = null;
  return out;
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

async function buildExamQuestions(prisma, exam, preview = false) {
  // Fetch section order from DB (sortOrder asc), fall back to hardcoded list
  const dbSections = await prisma.section.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  const sectionOrder = dbSections.length
    ? dbSections.map(s => s.name)
    : SECTION_ORDER_FALLBACK;

  if (exam.examType === "placement") {
    const template = exam.placementTemplate || [];
    const result = [];
    for (const row of template) {
      // Sort subpools within each level row by section order
      const sortedSubpools = [...(row.subpools || [])].sort(
        (a, b) => sectionOrder.indexOf(a.section) - sectionOrder.indexOf(b.section)
      );
      for (const sp of sortedSubpools) {
        const pool = await prisma.question.findMany({
          where: { level: row.level, section: { name: sp.section }, status: "published" },
          include: { section: { select: { name: true } } },
        });
        if (!preview && pool.length < sp.count) {
          throw new Error(`Not enough questions for ${row.level}/${sp.section}`);
        }
        const picked = pick(pool, Math.min(sp.count, pool.length)).map((q) => ({
          ...q, points: row.pointsEach, section: q.section?.name || sp.section,
        }));
        result.push(...picked);
      }
    }
    return result;
  }

  // Fixed — new subpool format: { section, level, count, pointsEach }
  // Group subpools by section, emit in DB-defined sortOrder
  const bySection = {};
  for (const sp of exam.subpools || []) {
    const lvl = sp.level || exam.level;
    const pool = await prisma.question.findMany({
      where: { level: lvl, section: { name: sp.section }, status: "published" },
      include: { section: { select: { name: true } } },
    });
    if (!preview && pool.length < sp.count) {
      throw new Error(`Not enough questions for ${lvl}/${sp.section}`);
    }
    const pts = sp.pointsEach || 1;
    const picked = pick(pool, Math.min(sp.count, pool.length)).map(q => ({
      ...q, points: pts, section: q.section?.name || sp.section,
    }));
    const secName = sp.section;
    if (!bySection[secName]) bySection[secName] = [];
    bySection[secName].push(...(exam.shuffle ? pick(picked, picked.length) : picked));
  }

  // Emit in DB sortOrder
  const result = [];
  for (const sec of sectionOrder) {
    if (bySection[sec]) result.push(...bySection[sec]);
  }
  // Any section not yet emitted (not in DB list) appended last
  for (const sec of Object.keys(bySection)) {
    if (!sectionOrder.includes(sec)) result.push(...bySection[sec]);
  }
  return result;
}
