export default async function studentStatsRoutes(fastify) {
  const { prisma } = fastify;

  // ── Auth helper ────────────────────────────────────────────────────────────
  async function authStudent(req, reply) {
    const token = req.headers.authorization?.replace("Bearer ", "").trim();
    if (!token) { reply.code(401).send({ error: "Требуется авторизация" }); return null; }
    const s = await prisma.student.findUnique({ where: { sessionToken: token },
      select: { id: true, level: true, email: true, name: true } });
    if (!s) { reply.code(401).send({ error: "Недействительный токен" }); return null; }
    return s;
  }

  // ── GET /api/student/stats ─────────────────────────────────────────────────
  fastify.get("/api/student/stats", async (req, reply) => {
    const student = await authStudent(req, reply);
    if (!student) return;

    const [totalExams, passedExams, avgAgg, allResults] = await Promise.all([
      prisma.examAssignment.count({ where: { studentId: student.id } }),
      prisma.result.count({ where: { studentId: student.id, passed: true } }),
      prisma.result.aggregate({ where: { studentId: student.id }, _avg: { pct: true } }),
      prisma.result.findMany({
        where:   { studentId: student.id },
        orderBy: { submittedAt: "desc" },
        include: {
          exam: {
            select: { id:true, title:true, level:true, examType:true,
                      subpools:true, placementTemplate:true,
                      examCenter:{ select:{ name:true } } },
          },
        },
      }),
    ]);

    // ── Progress by level ──────────────────────────────────────────────────
    const progressByLevel = { A1:0,A2:0,B1:0,B2:0,C1:0,C2:0 };
    for (const r of allResults) {
      const lvl = r.detectedLevel ?? r.exam?.level;
      if (lvl && progressByLevel[lvl] !== undefined) progressByLevel[lvl]++;
    }

    // ── Skill breakdown (radar chart data) ────────────────────────────────
    // For each completed result, map sections → skill buckets
    // READING + GRAMMAR + VOCABULARY → Reading
    // LISTENING                      → Listening
    // SPEAKING                       → Speaking
    // WRITING                        → Writing
    // We use levelStats (placement) or section-based scores if available.
    // Fallback: use overall pct for all skills.
    const skillTotals  = { Reading:0, Listening:0, Speaking:0, Writing:0 };
    const skillCounts  = { Reading:0, Listening:0, Speaking:0, Writing:0 };

    for (const r of allResults) {
      if (r.pct == null) continue;

      // Try to extract per-section data from levelStats (placement exams only)
      // For simplicity, use overall pct as proxy for all auto-graded skills,
      // and manualGrades scaled scores for Speaking/Writing when available.
      const mg = r.manualGrades ?? {};
      const manualQIds = Object.keys(mg).map(Number);

      if (manualQIds.length > 0) {
        // Fetch question types to map to skills
        const qs = await prisma.question.findMany({
          where:  { id: { in: manualQIds } },
          select: { id:true, type:true },
        });
        for (const q of qs) {
          const grade = mg[q.id];
          if (!grade?.scaledScore && grade?.scaledScore !== 0) continue;
          const pctQ = grade.maxPoints > 0
            ? Math.round((grade.scaledScore / grade.maxPoints) * 100)
            : 0;
          const skill = q.type?.startsWith("SPEAKING") ? "Speaking"
                       : q.type?.startsWith("WRITING")  ? "Writing"
                       : null;
          if (skill) {
            skillTotals[skill] += pctQ;
            skillCounts[skill]++;
          }
        }
      }

      // Auto-scored skills — use exam section pool metadata if present
      const pools = r.exam?.subpools ?? (r.exam?.placementTemplate
        ? r.exam.placementTemplate.flatMap(t => t.subpools ?? [])
        : []);
      const hasReading   = pools.some(p => ["Reading","Grammar","Vocabulary"].includes(p.section));
      const hasListening = pools.some(p => p.section === "Listening");

      if (hasReading)   { skillTotals.Reading   += r.pct; skillCounts.Reading++; }
      if (hasListening) { skillTotals.Listening  += r.pct; skillCounts.Listening++; }
      // fallback for exams with no section metadata
      if (!hasReading && !hasListening && !manualQIds.length) {
        for (const s of ["Reading","Listening","Speaking","Writing"]) {
          skillTotals[s] += r.pct; skillCounts[s]++;
        }
      }
    }

    const skillBreakdown = Object.fromEntries(
      Object.entries(skillTotals).map(([k, v]) => [
        k,
        skillCounts[k] > 0 ? Math.round(v / skillCounts[k]) : 0,
      ])
    );

    // ── Examiner feedback ──────────────────────────────────────────────────
    // Collect all non-empty feedback from manualGrades across all results
    const feedbackList = [];
    for (const r of allResults) {
      if (!r.manualGrades) continue;
      for (const [qIdStr, g] of Object.entries(r.manualGrades)) {
        if (g.feedback?.trim()) {
          feedbackList.push({
            resultId:   r.id,
            examTitle:  r.exam?.title,
            questionId: Number(qIdStr),
            feedback:   g.feedback.trim(),
            gradedAt:   g.gradedAt ?? r.gradedAt ?? r.submittedAt,
          });
        }
      }
    }

    // ── Ranking ────────────────────────────────────────────────────────────
    let ranking = [];
    let rankPosition = null;
    try {
      const raw = await prisma.$queryRaw`
        SELECT s.id, s.name, AVG(r.pct) AS avg_pct, COUNT(*) AS exam_count
        FROM "Student" s
        JOIN "Result" r ON s.id = r."studentId"
        WHERE r."gradingStatus" IN ('auto','graded','completed','published')
        GROUP BY s.id, s.name
        ORDER BY avg_pct DESC
        LIMIT 10
      `;
      ranking = raw.map(r => ({
        id:        r.id,
        name:      r.name,
        avgScore:  Math.round(Number(r.avg_pct)),
        examCount: Number(r.exam_count),
      }));
      const mine = ranking.findIndex(r => r.id === student.id);
      rankPosition = mine !== -1 ? mine + 1 : null;
    } catch {}

    // ── Certificates (passed results) ──────────────────────────────────────
    const certificates = allResults
      .filter(r => r.passed === true && ["auto","graded","completed","published"].includes(r.gradingStatus))
      .map(r => ({
        id:           r.id,
        examTitle:    r.exam.title,
        level:        r.detectedLevel ?? r.exam.level,
        score:        r.pct,
        submittedAt:  r.submittedAt,
        gradingStatus:r.gradingStatus,
        canDownload:  r.gradingStatus === "published" || r.gradingStatus === "completed",
      }));

    // ── Result list (for history tab) ──────────────────────────────────────
    const results = allResults.map(r => ({
      id:            r.id,
      examTitle:     r.exam.title,
      examType:      r.exam.examType,
      level:         r.detectedLevel ?? r.exam.level,
      score:         r.score,
      totalPoints:   r.totalPoints,
      pct:           r.pct,
      passed:        r.passed,
      gradingStatus: r.gradingStatus,
      levelStats:    r.levelStats,
      submittedAt:   r.submittedAt,
      centerName:    r.exam.examCenter?.name,
    }));

    return {
      totalExams,
      passedExams,
      avgScore:      Math.round(avgAgg._avg.pct ?? 0),
      progressByLevel,
      skillBreakdown,
      feedbackList,
      ranking,
      rankPosition,
      certificates,
      results,
    };
  });

  // ── GET /api/student/results  — full result list ───────────────────────────
  fastify.get("/api/student/results", async (req, reply) => {
    const student = await authStudent(req, reply);
    if (!student) return;

    const list = await prisma.result.findMany({
      where:   { studentId: student.id },
      orderBy: { submittedAt: "desc" },
      include: { exam: { select: { id:true, title:true, examType:true, level:true } } },
    });
    return list;
  });
}
