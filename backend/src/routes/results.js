import { requireAdmin } from "../middleware/adminAuth.js";

export default async function resultsRoutes(fastify) {
  const { prisma } = fastify;
  const adminHook = requireAdmin(prisma);

  // GET /api/results?examId=1&studentId=2
  fastify.get("/api/results", { preHandler: adminHook }, async (req) => {
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
  fastify.get("/api/results/:id", { preHandler: adminHook }, async (req, reply) => {
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

  // POST /api/terminal/result — submit result from exam terminal (uses PIN auth, no student token)
  fastify.post("/api/terminal/result", async (req, reply) => {
    const { pin, examId, studentId, score, totalPoints, pct, passed, placementLevel, answers } = req.body ?? {};
    if (!pin || examId == null || score == null || totalPoints == null || pct == null) {
      return reply.code(400).send({ error: "pin, examId, score, totalPoints, pct are required" });
    }

    // Verify PIN belongs to this student + exam
    const assignment = await prisma.examAssignment.findUnique({
      where: { pin: String(pin).toUpperCase() },
    });
    if (!assignment) return reply.code(403).send({ error: "Invalid PIN" });
    if (assignment.examId !== Number(examId) || assignment.studentId !== Number(studentId)) {
      return reply.code(403).send({ error: "PIN mismatch" });
    }

    // Upsert — prevent duplicate results if terminal retries
    const existing = await prisma.result.findFirst({
      where: { examId: Number(examId), studentId: Number(studentId) },
    });
    if (existing) return reply.code(200).send(existing);

    const result = await prisma.result.create({
      data: {
        examId:        Number(examId),
        studentId:     Number(studentId),
        score:         Number(score),
        totalPoints:   Number(totalPoints),
        pct:           Number(pct),
        passed:        Boolean(passed),
        answers:       answers ?? {},
        detectedLevel: placementLevel ?? null,
      },
    });

    // Update student level for placement exams
    if (placementLevel) {
      await prisma.student.update({
        where: { id: Number(studentId) },
        data: { level: placementLevel },
      });
    }

    return reply.code(201).send(result);
  });

  // POST /api/results  — requires student Bearer token
  fastify.post("/api/results", async (req, reply) => {
    const token = req.headers.authorization?.replace("Bearer ", "").trim();
    if (!token) return reply.code(401).send({ error: "Требуется авторизация" });

    const student = await prisma.student.findUnique({ where: { sessionToken: token } });
    if (!student) return reply.code(401).send({ error: "Недействительный токен" });

    const { examId, score, totalPoints, pct, passed, answers, detectedLevel, levelStats } = req.body ?? {};
    if (examId == null || score == null || totalPoints == null || pct == null) {
      return reply.code(400).send({ error: "examId, score, totalPoints, pct are required" });
    }

    // Verify student is assigned to this exam
    const assignment = await prisma.examAssignment.findFirst({
      where: { examId: Number(examId), studentId: student.id },
    });
    if (!assignment) return reply.code(403).send({ error: "Студент не назначен на этот экзамен" });

    const result = await prisma.result.create({
      data: { examId: Number(examId), studentId: student.id, score, totalPoints, pct, passed, answers, detectedLevel, levelStats },
    });
    if (detectedLevel) {
      await prisma.student.update({ where: { id: student.id }, data: { level: detectedLevel } });
    }
    return reply.code(201).send(result);
  });

  // ── Analytics ────────────────────────────────────────────────────────────────

  // GET /api/analytics/summary
  fastify.get("/api/analytics/summary", { preHandler: adminHook }, async () => {
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
  fastify.get("/api/analytics/by-city", { preHandler: adminHook }, async () => {
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
  fastify.get("/api/analytics/by-center/:id", { preHandler: adminHook }, async (req, reply) => {
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
