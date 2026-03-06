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

  // POST /api/results
  fastify.post("/api/results", async (req, reply) => {
    const { examId, studentId, score, totalPoints, pct, passed, answers, detectedLevel, levelStats } = req.body ?? {};
    if (examId == null || studentId == null || score == null || totalPoints == null || pct == null) {
      return reply.code(400).send({ error: "examId, studentId, score, totalPoints, pct are required" });
    }
    const result = await prisma.result.create({
      data: { examId, studentId, score, totalPoints, pct, passed, answers, detectedLevel, levelStats },
    });
    if (detectedLevel) {
      await prisma.student.update({ where: { id: studentId }, data: { level: detectedLevel } });
    }
    return reply.code(201).send(result);
  });

  // ── Analytics ────────────────────────────────────────────────────────────────

  // GET /api/analytics/summary
  fastify.get("/api/analytics/summary", async () => {
    const [totalStudents, totalExams, totalResults, passedResults, totalCenters, totalCities] = await Promise.all([
      prisma.student.count(),
      prisma.exam.count(),
      prisma.result.count(),
      prisma.result.count({ where: { passed: true } }),
      prisma.examCenter.count(),
      prisma.city.count(),
    ]);

    const avgPct = await prisma.result.aggregate({ _avg: { pct: true } });

    const byLevel = await prisma.student.groupBy({ by: ["level"], _count: { id: true } });
    const byGender = await prisma.student.groupBy({ by: ["gender"], _count: { id: true } });
    const byCountry = await prisma.student.groupBy({ by: ["country"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 10 });

    return {
      totalStudents,
      totalExams,
      totalResults,
      totalCenters,
      totalCities,
      passRate:        totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0,
      avgScore:        Math.round(avgPct._avg.pct ?? 0),
      studentsByLevel:  Object.fromEntries(byLevel.map(r => [r.level ?? "Unknown", r._count.id])),
      studentsByGender: Object.fromEntries(byGender.map(r => [r.gender || "other", r._count.id])),
      studentsByCountry: Object.fromEntries(byCountry.map(r => [r.country || "Unknown", r._count.id])),
    };
  });

  // GET /api/analytics/by-city  — stats grouped by city → center
  fastify.get("/api/analytics/by-city", async () => {
    const cities = await prisma.city.findMany({
      orderBy: { name: "asc" },
      include: {
        centers: {
          include: {
            exams: {
              include: {
                assignedStudents: {
                  include: { student: { select: { id: true, name: true, gender: true, country: true, level: true } } },
                },
                results: { select: { id: true, pct: true, passed: true, detectedLevel: true } },
              },
            },
          },
        },
      },
    });

    return cities.map(city => {
      const centersStats = city.centers.map(center => {
        let totalStudents = 0, totalExams = 0, totalResults = 0, passedResults = 0, pctSum = 0;
        const studentIds = new Set();

        for (const exam of center.exams) {
          totalExams++;
          for (const a of exam.assignedStudents) studentIds.add(a.studentId);
          for (const r of exam.results) {
            totalResults++;
            if (r.passed) passedResults++;
            pctSum += r.pct;
          }
        }
        totalStudents = studentIds.size;

        return {
          id:           center.id,
          name:         center.name,
          address:      center.address,
          phone:        center.phone,
          email:        center.email,
          totalExams,
          totalStudents,
          totalResults,
          passRate:     totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0,
          avgScore:     totalResults > 0 ? Math.round(pctSum / totalResults) : 0,
        };
      });

      const cityStudents = new Set(centersStats.flatMap(c => []));
      const cityTotalStudents = centersStats.reduce((a, c) => a + c.totalStudents, 0);
      const cityTotalResults  = centersStats.reduce((a, c) => a + c.totalResults,  0);
      const cityPassRate       = cityTotalResults > 0
        ? Math.round(centersStats.reduce((a, c) => a + c.passRate * c.totalResults, 0) / cityTotalResults)
        : 0;

      return {
        id:            city.id,
        name:          city.name,
        totalStudents: cityTotalStudents,
        totalExams:    centersStats.reduce((a, c) => a + c.totalExams, 0),
        totalResults:  cityTotalResults,
        passRate:      cityPassRate,
        centers:       centersStats,
      };
    });
  });

  // GET /api/analytics/by-center/:id  — detailed stats for one center
  fastify.get("/api/analytics/by-center/:id", async (req, reply) => {
    const center = await prisma.examCenter.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        city: true,
        exams: {
          include: {
            assignedStudents: {
              include: { student: { select: { id: true, name: true, gender: true, country: true, level: true } } },
            },
            results: { select: { id: true, pct: true, passed: true, detectedLevel: true, submittedAt: true } },
          },
        },
      },
    });
    if (!center) return reply.code(404).send({ error: "Центр не найден" });

    const studentIds = new Set();
    let totalResults = 0, passedResults = 0, pctSum = 0;
    const genderCount = { male: 0, female: 0, other: 0 };
    const levelCount  = {};
    const countryCount = {};

    for (const exam of center.exams) {
      for (const a of exam.assignedStudents) {
        if (!studentIds.has(a.studentId)) {
          studentIds.add(a.studentId);
          const g = a.student.gender || "other";
          genderCount[g] = (genderCount[g] || 0) + 1;
          if (a.student.country) countryCount[a.student.country] = (countryCount[a.student.country] || 0) + 1;
          if (a.student.level)   levelCount[a.student.level]     = (levelCount[a.student.level]     || 0) + 1;
        }
      }
      for (const r of exam.results) {
        totalResults++;
        if (r.passed) passedResults++;
        pctSum += r.pct;
        if (r.detectedLevel) levelCount[r.detectedLevel] = (levelCount[r.detectedLevel] || 0) + 1;
      }
    }

    return {
      id:            center.id,
      name:          center.name,
      address:       center.address,
      phone:         center.phone,
      email:         center.email,
      city:          center.city,
      totalStudents: studentIds.size,
      totalExams:    center.exams.length,
      totalResults,
      passRate:      totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0,
      avgScore:      totalResults > 0 ? Math.round(pctSum / totalResults) : 0,
      byGender:      genderCount,
      byLevel:       levelCount,
      byCountry:     countryCount,
      exams:         center.exams.map(e => ({
        id:            e.id,
        title:         e.title,
        examType:      e.examType,
        status:        e.status,
        totalStudents: e.assignedStudents.length,
        totalResults:  e.results.length,
        passRate:      e.results.length > 0 ? Math.round(e.results.filter(r => r.passed).length / e.results.length * 100) : 0,
        avgScore:      e.results.length > 0 ? Math.round(e.results.reduce((a, r) => a + r.pct, 0) / e.results.length) : 0,
      })),
    };
  });
}
