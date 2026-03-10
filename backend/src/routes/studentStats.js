
export default async function studentStatsRoutes(fastify) {
  const { prisma } = fastify;

  // GET /api/student/stats
  fastify.get("/api/student/stats", async (req, reply) => {
    const token = req.headers.authorization?.replace("Bearer ", "").trim();
    if (!token) return reply.code(401).send({ error: "Требуется авторизация" });
    
    const student = await prisma.student.findUnique({
      where: { sessionToken: token },
      select: { id: true, level: true, email: true },
    });
    
    if (!student) return reply.code(404).send({ error: "Студент не найден" });

    // Общее количество экзаменов
    const totalExams = await prisma.examAssignment.count({
      where: { studentId: student.id },
    });

    // Количество пройденных экзаменов (passed = true)
    const passedExams = await prisma.result.count({
      where: { studentId: student.id, passed: true },
    });

    // Средний балл
    const avgScoreResult = await prisma.result.aggregate({
      where: { studentId: student.id },
      _avg: { pct: true },
    });
    const avgScore = avgScoreResult._avg.pct || 0;

    // Прогресс по уровням (уровни A1-A2-B1-B2-C1-C2)
    const resultsWithExam = await prisma.result.findMany({
      where: { studentId: student.id },
      include: {
        exam: {
          select: { level: true },
        },
      },
    });
    
    const progressByLevel = {};
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    levels.forEach(level => {
      progressByLevel[level] = resultsWithExam.filter(r => r.exam?.level === level).length;
    });

    // Рейтинг среди других студентов (по среднему баллу)
    let ranking = [];
    let rankPosition = null;
    try {
      const rankingRaw = await prisma.$queryRaw`
        SELECT 
          s.id,
          s.name,
          AVG(r.pct) as avg_pct,
          COUNT(*) as exam_count
        FROM Student s
        JOIN Result r ON s.id = r."studentId"
        GROUP BY s.id, s.name
        ORDER BY avg_pct DESC
        LIMIT 10
      `;
      
      ranking = rankingRaw.map(r => ({
        id: r.id,
        name: r.name,
        avgScore: Math.round(Number(r.avg_pct)),
        examCount: Number(r.exam_count),
      }));
      
      const currentStudentRank = ranking.find(r => r.id === student.id);
      rankPosition = currentStudentRank ? ranking.indexOf(currentStudentRank) + 1 : null;
    } catch (err) {
      // Ranking is optional, ignore errors
    }

    // Список пройденных экзаменов (сертификаты)
    const certificates = await prisma.result.findMany({
      where: { studentId: student.id, passed: true },
      orderBy: { submittedAt: 'desc' },
      include: {
        exam: {
          select: { id: true, title: true, level: true },
        },
      },
    });

    return {
      totalExams,
      passedExams,
      avgScore: Math.round(avgScore),
      progressByLevel,
      ranking,
      rankPosition,
      certificates: certificates.map(c => ({
        id: c.id,
        examTitle: c.exam.title,
        level: c.exam.level,
        score: c.pct,
        submittedAt: c.submittedAt,
      })),
    };
  });
}