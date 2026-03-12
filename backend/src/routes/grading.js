import { requireAdmin } from "../middleware/adminAuth.js";

/**
 * Anonymise a result object for examiners.
 * - Replaces student name/email with a stable candidate code derived from student.id
 * - Strips examCenterId so the examiner cannot determine which centre the candidate attended
 *
 * The code is deterministic: student 4821 is always "Candidate #4821" for every examiner,
 * making cross-reference by coordinators possible while keeping identity hidden from examiners.
 */
function anonymize(result, role) {
  if (role !== "examiner") return result;

  const studentId = result.student?.id ?? result.studentId;
  // Pad to 4 digits minimum, prefix with exam id for extra separation
  const code = String(studentId).padStart(4, "0");

  const anon = {
    ...result,
    student: { id: studentId, candidateCode: `Candidate #${code}` },
  };

  // Strip centre info
  if (anon.exam) {
    const { examCenterId, ...examWithoutCenter } = anon.exam;
    anon.exam = examWithoutCenter;
  }

  return anon;
}


const MANUAL_TYPES = ["WRITING_INDEPENDENT","WRITING_INTEGRATED","SPEAKING_INDEPENDENT","SPEAKING_INTEGRATED"];

async function enrichResults(prisma, results) {
  return Promise.all(results.map(async (r) => {
    const answerIds = Object.keys(r.answers ?? {}).map(Number).filter(Boolean);
    const manualQs = answerIds.length
      ? await prisma.question.findMany({
          where: { id: { in: answerIds }, type: { in: MANUAL_TYPES } },
          include: { section: { select: { name: true, category: true } } },
        })
      : [];
    const grades = r.manualGrades ?? {};
    const gradedCount  = manualQs.filter(q => grades[q.id]?.rawScore != null).length;
    const pendingCount = manualQs.length - gradedCount;
    return {
      ...r,
      manualQuestions: manualQs.map(q => ({
        id: q.id, type: q.type, level: q.level, points: q.points,
        section: q.section.name, category: q.section.category,
        isGraded: grades[q.id]?.rawScore != null,
      })),
      gradedCount,
      pendingCount,
    };
  }));
}

export default async function gradingRoutes(fastify) {
  const { prisma } = fastify;
  const adminHook = requireAdmin(prisma);

  // GET /api/grading/pending  — results awaiting manual grading
  fastify.get("/api/grading/pending", { preHandler: adminHook }, async (req) => {
    const { centerId } = req.query;
    const where = { gradingStatus: "pending" };
    if (centerId) {
      where.exam = { examCenterId: Number(centerId) };
    } else if (req.admin.role === "center_admin" && req.admin.centerId) {
      where.exam = { examCenterId: req.admin.centerId };
    }
    const results = await prisma.result.findMany({
      where,
      orderBy: { submittedAt: "asc" },
      include: {
        exam:    { select: { id: true, title: true, examType: true, examCenterId: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
    return results.map(r => anonymize(r, req.admin.role));
  });

  // GET /api/grading/graded  — recently graded results (manual grading completed)
  fastify.get("/api/grading/graded", { preHandler: adminHook }, async (req) => {
    const { centerId, take } = req.query;
    const where = { gradingStatus: "graded" };
    if (centerId) {
      where.exam = { examCenterId: Number(centerId) };
    } else if (req.admin.role === "center_admin" && req.admin.centerId) {
      where.exam = { examCenterId: req.admin.centerId };
    }
    const graded = await prisma.result.findMany({
      where,
      orderBy: [{ gradedAt: "desc" }, { submittedAt: "desc" }],
      take: Math.min(Number(take ?? 200) || 200, 500),
      include: {
        exam:    { select: { id: true, title: true, examType: true, examCenterId: true, level: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
    const enriched = await enrichResults(prisma, graded);
    return enriched.map(r => anonymize(r, req.admin.role));
  });

  // GET /api/grading/auto  — auto-graded results (no manual grading needed)
  fastify.get("/api/grading/auto", { preHandler: adminHook }, async (req) => {
    const { centerId, take } = req.query;
    const where = { gradingStatus: "auto" };
    if (centerId) {
      where.exam = { examCenterId: Number(centerId) };
    } else if (req.admin.role === "center_admin" && req.admin.centerId) {
      where.exam = { examCenterId: req.admin.centerId };
    }
    const autoRes = await prisma.result.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      take: Math.min(Number(take ?? 200) || 200, 500),
      include: {
        exam:    { select: { id: true, title: true, examType: true, examCenterId: true, level: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
    const enriched = await enrichResults(prisma, autoRes);
    return enriched.map(r => anonymize(r, req.admin.role));
  });

  // GET /api/grading/:resultId moved to results.js (correct schema types + rubrics)


  // GET /api/grading/stats  — examiner stats overview
  fastify.get("/api/grading/stats", { preHandler: adminHook }, async (req) => {
    const centerId = req.admin.role === "center_admin" ? req.admin.centerId : undefined;
    const examWhere = centerId ? { examCenterId: centerId } : {};

    const [pending, graded, auto] = await Promise.all([
      prisma.result.count({ where: { gradingStatus: "pending", exam: examWhere } }),
      prisma.result.count({ where: { gradingStatus: "graded",  exam: examWhere } }),
      prisma.result.count({ where: { gradingStatus: "auto",    exam: examWhere } }),
    ]);
    return { pending, graded, auto, total: pending + graded + auto };
  });
}
