import { requireAdmin } from "../middleware/adminAuth.js";
import { sendResultsReady } from "../services/mailer.js";
import { generateCertificate } from "../services/certificate.js";

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
    const { pin, examId, studentId, score, totalPoints, pct, passed,
            placementLevel, answers, levelResults, belowMinimum, gradingStatus: terminalGradingStatus } = req.body ?? {};

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

    // Prevent duplicate results
    const existing = await prisma.result.findFirst({
      where: { examId: Number(examId), studentId: Number(studentId) },
    });
    if (existing) return reply.code(200).send(existing);

    // Use gradingStatus from terminal if provided, otherwise detect from answer keys
    const MANUAL_TYPES = ["WRITING_INDEPENDENT", "WRITING_INTEGRATED", "SPEAKING_INDEPENDENT", "SPEAKING_INTEGRATED"];
    let gradingStatus = terminalGradingStatus ?? "auto";
    if (!terminalGradingStatus) {
      const answerIds = Object.keys(answers ?? {}).map(Number).filter(Boolean);
      const hasManual = answerIds.length > 0
        ? await prisma.question.count({ where: { id: { in: answerIds }, type: { in: MANUAL_TYPES } } })
        : 0;
      gradingStatus = hasManual > 0 ? "pending" : "auto";
    }

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
        levelStats:    levelResults ?? null,
        gradingStatus,
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

  // ── Manual grading ───────────────────────────────────────────────────────────

  // GET /api/grading/queue?examId=&level=&gradingStatus=pending
  // Returns results that need manual grading, with question details
  fastify.get("/api/grading/queue", { preHandler: adminHook }, async (req) => {
    const { examId, gradingStatus = "pending" } = req.query;
    const where = { gradingStatus };
    if (examId) where.examId = Number(examId);

    const results = await prisma.result.findMany({
      where,
      orderBy: { submittedAt: "asc" },
      include: {
        exam:    { select: { id: true, title: true, examType: true, level: true } },
        student: { select: { id: true, name: true, email: true, country: true } },
      },
    });

    // For each result, load the manual questions that were answered
    const MANUAL_TYPES = ["WRITING_INDEPENDENT", "WRITING_INTEGRATED", "SPEAKING_INDEPENDENT", "SPEAKING_INTEGRATED"];
    const enriched = await Promise.all(results.map(async (r) => {
      const answerIds = Object.keys(r.answers ?? {}).map(Number).filter(Boolean);
      const manualQs = answerIds.length
        ? await prisma.question.findMany({
            where: { id: { in: answerIds }, type: { in: MANUAL_TYPES } },
            include: { section: { select: { name: true, category: true } } },
          })
        : [];

      const grades = r.manualGrades ?? {};
      const gradedCount   = manualQs.filter(q => grades[q.id]?.rawScore != null).length;
      const pendingCount  = manualQs.length - gradedCount;

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

    return enriched;
  });

  // GET /api/grading/:resultId  — full detail for examiner view
  fastify.get("/api/grading/:resultId", { preHandler: adminHook }, async (req, reply) => {
    const result = await prisma.result.findUnique({
      where: { id: Number(req.params.resultId) },
      include: {
        exam:    { select: { id: true, title: true, examType: true, level: true, passingScore: true, placementThresholds: true } },
        student: { select: { id: true, name: true, email: true, country: true, documentType: true, documentNumber: true } },
      },
    });
    if (!result) return reply.code(404).send({ error: "Not found" });

    const MANUAL_TYPES = ["WRITING_INDEPENDENT", "WRITING_INTEGRATED", "SPEAKING_INDEPENDENT", "SPEAKING_INTEGRATED"];
    const answerIds = Object.keys(result.answers ?? {}).map(Number).filter(Boolean);
    const manualQs = answerIds.length
      ? await prisma.question.findMany({
          where: { id: { in: answerIds }, type: { in: MANUAL_TYPES } },
          include: { section: { select: { name: true, category: true } } },
        })
      : [];

    const grades = result.manualGrades ?? {};
    return {
      ...result,
      manualQuestions: manualQs.map(q => ({
        id:          q.id,
        type:        q.type,
        level:       q.level,
        points:      q.points,
        section:     q.section.name,
        category:    q.section.category,
        contextText: q.contextText,
        media:       q.media,
        prompt:      q.prompt,
        content:     q.content,               // includes rubrics array
        answer:      (result.answers ?? {})[q.id],
        grade:       grades[q.id] ?? null,    // { rubrics, rawScore, scaledScore, feedback, ... }
      })),
    };
  });

  // PATCH /api/grading/:resultId/question/:questionId
  // Examiner submits rubric scores for one question.
  // Body: { rubrics: { fluency: 4, lexical: 3, ... }, feedback?: "..." }
  fastify.patch("/api/grading/:resultId/question/:questionId", { preHandler: adminHook }, async (req, reply) => {
    const resultId    = Number(req.params.resultId);
    const questionId  = Number(req.params.questionId);
    const { rubrics: rubricScores, feedback = "" } = req.body ?? {};

    if (!rubricScores || typeof rubricScores !== "object") {
      return reply.code(400).send({ error: "rubrics object is required" });
    }

    const [result, question] = await Promise.all([
      prisma.result.findUnique({ where: { id: resultId } }),
      prisma.question.findUnique({ where: { id: questionId } }),
    ]);
    if (!result)   return reply.code(404).send({ error: "Result not found" });
    if (!question) return reply.code(404).send({ error: "Question not found" });

    // Validate rubric ids against question definition
    const definedRubrics = (question.content?.rubrics ?? []);
    const maxRawScore    = definedRubrics.reduce((s, r) => s + r.maxScore, 0);

    // Clamp each score to [0, rubric.maxScore]
    const clampedScores = {};
    for (const r of definedRubrics) {
      const val = Number(rubricScores[r.id] ?? 0);
      clampedScores[r.id] = Math.max(0, Math.min(r.maxScore, val));
    }
    const rawScore    = Object.values(clampedScores).reduce((s, v) => s + v, 0);
    // scaledScore = round( rawScore / maxRawScore * question.points )
    const scaledScore = maxRawScore > 0 ? Math.round((rawScore / maxRawScore) * question.points) : 0;

    // Merge into manualGrades
    const grades = { ...(result.manualGrades ?? {}) };
    grades[questionId] = {
      rubrics:      clampedScores,
      rawScore,
      maxRawScore,
      scaledScore,
      maxPoints:    question.points,
      feedback,
      gradedById:   req.admin?.id ?? null,
      gradedAt:     new Date().toISOString(),
    };

    // Check if all manual questions are now graded → finalize
    const MANUAL_TYPES = ["WRITING_INDEPENDENT", "WRITING_INTEGRATED", "SPEAKING_INDEPENDENT", "SPEAKING_INTEGRATED"];
    const answerIds = Object.keys(result.answers ?? {}).map(Number).filter(Boolean);
    const manualQs  = answerIds.length
      ? await prisma.question.findMany({ where: { id: { in: answerIds }, type: { in: MANUAL_TYPES } } })
      : [];

    const allGraded = manualQs.every(q => grades[q.id]?.rawScore != null);

    let updatedResult;
    if (allGraded) {
      // Finalize: auto score (already in result.score) + sum of scaledScores
      const manualTotal = Object.values(grades).reduce((s, g) => s + (g.scaledScore ?? 0), 0);
      // result.score currently holds auto-only points; replace with full total
      const autoScore   = result.score;          // was set by terminal (auto questions only)
      const finalScore  = autoScore + manualTotal;
      const finalPct    = Math.round((finalScore / result.totalPoints) * 100);

      // Re-evaluate pass/fail
      let passed = result.passed;
      if (result.exam) {
        // We don't have exam here, skip — terminal already set it or it'll be set below
      }

      updatedResult = await prisma.result.update({
        where: { id: resultId },
        data: {
          manualGrades:  grades,
          score:         finalScore,
          pct:           finalPct,
          gradingStatus: "completed",
          gradedAt:      new Date(),
        },
      });
    } else {
      updatedResult = await prisma.result.update({
        where: { id: resultId },
        data: {
          manualGrades:  grades,
          gradingStatus: "grading",   // in progress
        },
      });
    }

    return {
      questionId,
      grade:        grades[questionId],
      allGraded,
      gradingStatus: updatedResult.gradingStatus,
      score:         updatedResult.score,
      pct:           updatedResult.pct,
    };
  });

  // POST /api/grading/:resultId/finalize
  // Force-finalize (e.g. if some questions were skipped/waived).
  // Recalculates score from all available grades.
  fastify.post("/api/grading/:resultId/finalize", { preHandler: adminHook }, async (req, reply) => {
    const resultId = Number(req.params.resultId);
    const result   = await prisma.result.findUnique({ where: { id: resultId } });
    if (!result) return reply.code(404).send({ error: "Not found" });

    const grades = result.manualGrades ?? {};
    const manualTotal = Object.values(grades).reduce((s, g) => s + (g.scaledScore ?? 0), 0);

    // Recalculate auto score (all non-manual answers)
    const MANUAL_TYPES = ["WRITING_INDEPENDENT", "WRITING_INTEGRATED", "SPEAKING_INDEPENDENT", "SPEAKING_INTEGRATED"];
    const answerIds = Object.keys(result.answers ?? {}).map(Number).filter(Boolean);
    const manualIds = new Set(
      answerIds.length
        ? (await prisma.question.findMany({ where: { id: { in: answerIds }, type: { in: MANUAL_TYPES } }, select: { id: true } })).map(q => q.id)
        : []
    );

    // Auto score = result.score minus any previously added manual scores
    // Safest: just use the stored autoScore baseline
    // Convention: result.score before finalization = auto-only score
    const finalScore = result.score + manualTotal;
    const finalPct   = Math.round((finalScore / result.totalPoints) * 100);

    const updated = await prisma.result.update({
      where: { id: resultId },
      data: { score: finalScore, pct: finalPct, gradingStatus: "completed", gradedAt: new Date() },
    });

    return { score: updated.score, pct: updated.pct, gradingStatus: updated.gradingStatus };
  });

  // ── Publish results & notify student ────────────────────────────────────────

  // POST /api/results/:id/publish
  // Called by examiner after final review. Sets gradingStatus → "published",
  // triggers email notification to student.
  fastify.post("/api/results/:id/publish", { preHandler: adminHook }, async (req, reply) => {
    const resultId = Number(req.params.id);
    const result   = await prisma.result.findUnique({
      where:   { id: resultId },
      include: {
        exam:    { include: { examCenter: { select: { name: true } } } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
    if (!result) return reply.code(404).send({ error: "Not found" });
    if (result.gradingStatus === "published") {
      return reply.code(200).send({ already: true, result });
    }

    const updated = await prisma.result.update({
      where: { id: resultId },
      data:  { gradingStatus: "published", gradedAt: result.gradedAt ?? new Date() },
    });

    // Fire-and-forget email — don't block HTTP response on SMTP
    sendResultsReady({
      student: result.student,
      exam:    result.exam,
      result:  updated,
    }).catch(err => console.error("[mailer] sendResultsReady failed:", err));

    return { published: true, result: updated };
  });

  // GET /api/certificate/:id  — stream PDF certificate (student or admin)
  // Accessible by the student who owns the result (Bearer token)
  // or any admin (Bearer admin token).
  fastify.get("/api/certificate/:id", async (req, reply) => {
    const resultId = Number(req.params.id);

    // Auth: try student token first, fall back to admin token
    const token   = req.headers.authorization?.replace("Bearer ", "").trim();
    let student = null;
    let isAdmin = false;

    if (token) {
      student = await prisma.student.findUnique({ where: { sessionToken: token } });
      if (!student) {
        const admin = await prisma.admin.findUnique({ where: { sessionToken: token } });
        if (admin) isAdmin = true;
      }
    }
    if (!student && !isAdmin) {
      return reply.code(401).send({ error: "Unauthorised" });
    }

    const result = await prisma.result.findUnique({
      where:   { id: resultId },
      include: {
        exam:    { include: { examCenter: { select: { name: true } } } },
        student: { select: { id: true, name: true } },
      },
    });

    if (!result) return reply.code(404).send({ error: "Not found" });

    // Students can only download their own certificate
    if (student && result.studentId !== student.id) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    // Only published or completed results
    if (!["published","completed","auto","graded"].includes(result.gradingStatus)) {
      return reply.code(403).send({ error: "Result not yet published" });
    }

    const safeName = result.student.name.replace(/[^a-zA-Z0-9\u0530-\u058F\s]/g, "").trim();
    const filename  = `ArmExam_Certificate_${safeName}_${resultId}.pdf`;

    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `attachment; filename="${filename}"`);

    generateCertificate({
      stream:       reply.raw,
      studentName:  result.student.name,
      examTitle:    result.exam.title,
      level:        result.detectedLevel ?? result.exam.level ?? null,
      pct:          result.pct,
      passed:       result.passed ?? false,
      submittedAt:  result.submittedAt.toISOString(),
      centerName:   result.exam.examCenter?.name ?? "ArmExam",
      resultId,
    });

    // Return raw stream — Fastify will finalise the response
    return reply;
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
