export default async function resultsRoutes(fastify) {
  const { prisma } = fastify;

  // GET /api/results?examId=1&studentId=2
  fastify.get("/api/results", async (req) => {
    const { examId, studentId } = req.query;
    const where = {};
    if (examId)    where.examId    = Number(examId);
    if (studentId) where.studentId = Number(studentId);
    return prisma.result.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      include: {
        exam:    { select: { id: true, title: true, examType: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
  });

  // GET /api/results/:id
  fastify.get("/api/results/:id", async (req, reply) => {
    const r = await prisma.result.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        exam:    { select: { id: true, title: true, examType: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
    if (!r) return reply.code(404).send({ error: "Not found" });
    return r;
  });

  // POST /api/results  — submit exam result
  fastify.post("/api/results", async (req, reply) => {
    const { examId, studentId, score, totalPoints, pct, passed, answers, detectedLevel, levelStats } = req.body ?? {};
    if (examId == null || studentId == null || score == null || totalPoints == null || pct == null) {
      return reply.code(400).send({ error: "examId, studentId, score, totalPoints, pct are required" });
    }
    const result = await prisma.result.create({
      data: { examId, studentId, score, totalPoints, pct, passed, answers, detectedLevel, levelStats },
    });

    // Update student's detected level for placement exams
    if (detectedLevel) {
      await prisma.student.update({
        where: { id: studentId },
        data: { level: detectedLevel },
      });
    }

    return reply.code(201).send(result);
  });

  // GET /api/analytics/summary
  fastify.get("/api/analytics/summary", async () => {
    const [totalStudents, totalExams, totalResults, passedResults] = await Promise.all([
      prisma.student.count(),
      prisma.exam.count(),
      prisma.result.count(),
      prisma.result.count({ where: { passed: true } }),
    ]);

    const avgPct = await prisma.result.aggregate({ _avg: { pct: true } });

    const byLevel = await prisma.student.groupBy({
      by: ["level"],
      _count: { id: true },
    });

    return {
      totalStudents,
      totalExams,
      totalResults,
      passRate: totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0,
      avgScore: Math.round(avgPct._avg.pct ?? 0),
      studentsByLevel: Object.fromEntries(byLevel.map((r) => [r.level ?? "Unknown", r._count.id])),
    };
  });
}
