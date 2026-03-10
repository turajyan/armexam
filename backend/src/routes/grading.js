import { requireAdmin } from "../middleware/adminAuth.js";

const MANUAL_TYPES = new Set(["writing", "voice"]);

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
    return prisma.result.findMany({
      where,
      orderBy: { submittedAt: "asc" },
      include: {
        exam:    { select: { id: true, title: true, examType: true, examCenterId: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
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
    return prisma.result.findMany({
      where,
      orderBy: [{ gradedAt: "desc" }, { submittedAt: "desc" }],
      take: Math.min(Number(take ?? 200) || 200, 500),
      select: {
        id: true, score: true, pct: true, passed: true, totalPoints: true, detectedLevel: true, submittedAt: true, gradedAt: true,
        exam:    { select: { id: true, title: true, examType: true, examCenterId: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
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
    return prisma.result.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      take: Math.min(Number(take ?? 200) || 200, 500),
      select: {
        id: true, score: true, pct: true, passed: true, totalPoints: true, detectedLevel: true, submittedAt: true,
        exam:    { select: { id: true, title: true, examType: true, examCenterId: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
  });

  // GET /api/grading/:resultId  — full result with question details for grading
  fastify.get("/api/grading/:resultId", { preHandler: adminHook }, async (req, reply) => {
    const resultId = Number(req.params.resultId);
    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: {
        exam:    { select: { id: true, title: true, examType: true, subpools: true, placementTemplate: true, examCenterId: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
    if (!result) return reply.code(404).send({ error: "Результат не найден" });

    if (req.admin.role === "center_admin" && result.exam.examCenterId !== req.admin.centerId) {
      return reply.code(403).send({ error: "Нет доступа к результатам этого центра" });
    }

    // Gather question IDs from answers that are manual types
    const answers = result.answers ?? {};
    const questionIds = Object.keys(answers).map(Number).filter(Boolean);
    const questions = questionIds.length
      ? await prisma.question.findMany({
          where: { id: { in: questionIds }, type: { in: ["writing", "voice"] } },
          select: { id: true, type: true, text: true, points: true, level: true, minWords: true, maxWords: true, minSeconds: true, maxSeconds: true },
        })
      : [];

    return { ...result, gradableQuestions: questions };
  });

  // POST /api/grading/:resultId  — submit grades for manual questions
  fastify.post("/api/grading/:resultId", { preHandler: adminHook }, async (req, reply) => {
    const resultId = Number(req.params.resultId);
    const { grades } = req.body ?? {};
    // grades: { [questionId]: { earnedPoints, status: "approved"|"partial"|"declined", notes } }

    if (!grades || typeof grades !== "object") {
      return reply.code(400).send({ error: "grades объект обязателен" });
    }

    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: { exam: { select: { passingScore: true, examCenterId: true } } },
    });
    if (!result) return reply.code(404).send({ error: "Результат не найден" });

    if (req.admin.role === "center_admin" && result.exam.examCenterId !== req.admin.centerId) {
      return reply.code(403).send({ error: "Нет доступа к результатам этого центра" });
    }

    // Fetch questions to validate points
    const questionIds = Object.keys(grades).map(Number);
    const questions   = await prisma.question.findMany({ where: { id: { in: questionIds } } });
    const qMap        = Object.fromEntries(questions.map(q => [q.id, q]));

    const manualGrades = {};
    let manualEarned   = 0;
    let manualTotal    = 0;

    for (const [qIdStr, g] of Object.entries(grades)) {
      const qId = Number(qIdStr);
      const q   = qMap[qId];
      if (!q) continue;
      const maxPts     = q.points;
      const earned     = Math.max(0, Math.min(maxPts, Number(g.earnedPoints ?? 0)));
      const status     = ["approved","partial","declined"].includes(g.status) ? g.status : "partial";
      manualGrades[qId] = { earnedPoints: earned, maxPoints: maxPts, status, notes: g.notes ?? "" };
      manualEarned += earned;
      manualTotal  += maxPts;
    }

    // Recalculate total score: existing auto score + manual score
    // Auto score = result.score - (previous manual earned, if any)
    const prevManual     = result.manualGrades ?? {};
    const prevManualEarned = Object.values(prevManual).reduce((s, g) => s + (g.earnedPoints ?? 0), 0);
    const autoScore      = result.score - prevManualEarned;
    const newScore       = autoScore + manualEarned;
    const newPct         = result.totalPoints > 0 ? Math.round((newScore / result.totalPoints) * 100) : 0;

    const updated = await prisma.result.update({
      where: { id: resultId },
      data:  {
        manualGrades,
        gradingStatus: "graded",
        gradedById:    req.admin.id,
        gradedAt:      new Date(),
        score:         newScore,
        pct:           newPct,
        passed:        result.totalPoints > 0
          ? newPct >= (result.exam.passingScore ?? 0)
          : result.passed,
      },
      include: {
        exam:    { select: { id: true, title: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
    return updated;
  });

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
