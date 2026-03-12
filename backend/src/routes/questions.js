import { requireAdmin, requireRole } from "../middleware/adminAuth.js";

export default async function questionsRoutes(fastify) {
  const { prisma } = fastify;
  const adminHook     = requireAdmin(prisma);
  const moderatorHook = requireRole("super_admin", "center_admin", "moderator")(prisma);

  // Format: replace sectionId/section relation → flat { section, category }
  function fmt(q) {
    const { sectionId, section, ...rest } = q;
    return {
      ...rest,
      section:  section?.name     ?? String(sectionId),
      category: section?.category ?? "READING",
    };
  }

  async function resolveSectionId(name, reply) {
    const sec = await prisma.section.findUnique({ where: { name } });
    if (!sec) { reply.code(400).send({ error: `Section '${name}' not found` }); return null; }
    return sec.id;
  }

  // GET /api/questions?level=B1&section=Reading&type=SINGLE_CHOICE&status=published
  fastify.get("/api/questions", { preHandler: adminHook }, async (req) => {
    const { level, section, type, status } = req.query;
    const where = {};
    if (level)  where.level  = level;
    if (type)   where.type   = type;
    if (status) where.status = status;
    if (section) {
      const sec = await prisma.section.findUnique({ where: { name: section } });
      if (!sec) return [];
      where.sectionId = sec.id;
    }
    const qs = await prisma.question.findMany({
      where,
      include: { section: true },
      orderBy: [{ level: "asc" }, { id: "asc" }],
    });
    return qs.map(fmt);
  });

  // GET /api/questions/:id
  fastify.get("/api/questions/:id", { preHandler: adminHook }, async (req, reply) => {
    const q = await prisma.question.findUnique({
      where: { id: Number(req.params.id) },
      include: { section: true },
    });
    if (!q) return reply.code(404).send({ error: "Not found" });
    return fmt(q);
  });

  // POST /api/questions
  // Required: type, level, section, prompt
  fastify.post("/api/questions", { preHandler: moderatorHook }, async (req, reply) => {
    const { type, level, section, prompt } = req.body ?? {};
    if (!type || !level || !section || !prompt) {
      return reply.code(400).send({ error: "type, level, section, prompt are required" });
    }
    const sectionId = await resolveSectionId(section, reply);
    if (sectionId === null) return;
    const q = await prisma.question.create({
      data: { ...sanitize(req.body), sectionId },
      include: { section: true },
    });
    return reply.code(201).send(fmt(q));
  });

  // PUT /api/questions/:id
  fastify.put("/api/questions/:id", { preHandler: moderatorHook }, async (req, reply) => {
    const data = sanitize(req.body);
    if (req.body.section) {
      const sectionId = await resolveSectionId(req.body.section, reply);
      if (sectionId === null) return;
      data.sectionId = sectionId;
    }
    const q = await prisma.question.update({
      where: { id: Number(req.params.id) },
      data,
      include: { section: true },
    });
    return fmt(q);
  });

  // DELETE /api/questions/:id
  fastify.delete("/api/questions/:id", { preHandler: moderatorHook }, async (req, reply) => {
    await prisma.question.delete({ where: { id: Number(req.params.id) } });
    return reply.code(204).send();
  });


  // ── GET /api/questions/stats ───────────────────────────────────────────────
  // Returns per-question usage statistics aggregated from all Result.answers.
  // For auto-graded types we re-evaluate correctness from content.
  // For manual types (SPEAKING_*, WRITING_*) we use manualGrades.
  //
  // Response: [{
  //   questionId, type, level, section, category, prompt (first 80 chars),
  //   uses,          // number of exams this question appeared in
  //   correct,       // number of fully-correct answers
  //   incorrect,     // number of wrong / incomplete answers
  //   skipped,       // answer was null/empty
  //   correctPct,    // 0-100
  //   avgScore,      // avg earned points (manual types)
  //   lastUsed,      // ISO date of most recent Result
  // }]
  fastify.get("/api/questions/stats", { preHandler: adminHook }, async (req) => {
    const { level, section, type } = req.query;

    // 1. Fetch all submitted results with answers + manualGrades
    const results = await prisma.result.findMany({
      where: { gradingStatus: { not: "pending" } }, // skip ungraded
      select: {
        id: true,
        submittedAt: true,
        answers:      true,  // { questionId: answer }
        manualGrades: true,  // { questionId: { earnedPoints, maxPoints, status } }
      },
    });

    // 2. Collect which question IDs actually appear in results
    const usedIds = new Set();
    for (const r of results) {
      for (const k of Object.keys(r.answers ?? {})) {
        const n = Number(k); if (n) usedIds.add(n);
      }
    }
    if (usedIds.size === 0) return [];

    // 3. Fetch question metadata (filtered if query params given)
    const qWhere = { id: { in: [...usedIds] } };
    if (level)   qWhere.level = level;
    if (type)    qWhere.type  = type;
    if (section) {
      const sec = await prisma.section.findUnique({ where: { name: section } });
      if (sec) qWhere.sectionId = sec.id;
    }
    const questions = await prisma.question.findMany({
      where: qWhere,
      include: { section: true },
    });
    const qMap = Object.fromEntries(questions.map(q => [q.id, q]));

    // 4. Aggregate per question
    const MANUAL = new Set(["SPEAKING_INDEPENDENT","SPEAKING_INTEGRATED","WRITING_INDEPENDENT","WRITING_INTEGRATED"]);

    const agg = {}; // questionId → stats object

    for (const r of results) {
      const answers = r.answers ?? {};
      const manual  = r.manualGrades ?? {};

      for (const [qIdStr, answer] of Object.entries(answers)) {
        const qId = Number(qIdStr);
        const q   = qMap[qId];
        if (!q) continue;

        if (!agg[qId]) {
          agg[qId] = { questionId: qId, uses: 0, correct: 0, incorrect: 0, skipped: 0,
                       totalEarned: 0, totalMax: 0, lastUsed: null };
        }
        const s = agg[qId];
        s.uses++;
        if (r.submittedAt && (!s.lastUsed || r.submittedAt > s.lastUsed))
          s.lastUsed = r.submittedAt;

        // Skipped?
        if (answer === null || answer === undefined || answer === "") {
          s.skipped++; continue;
        }

        if (MANUAL.has(q.type)) {
          const mg = manual[qId] ?? manual[String(qId)];
          if (mg) {
            const earned = mg.earnedPoints ?? 0;
            const max    = mg.maxPoints    ?? q.points ?? 1;
            s.totalEarned += earned;
            s.totalMax    += max;
            if (earned >= max) s.correct++; else s.incorrect++;
          } else {
            // Submitted but not yet graded — count as skipped for stats
            s.skipped++;
          }
          continue;
        }

        // Auto-graded — re-evaluate correctness
        const earned = scoreAnswer(q, answer);
        const max    = q.points ?? 1;
        s.totalEarned += earned;
        s.totalMax    += max;
        if (earned >= max) s.correct++; else s.incorrect++;
      }
    }

    // 5. Build output rows
    const rows = Object.values(agg).map(s => {
      const q        = qMap[s.questionId];
      const answered = s.uses - s.skipped;
      return {
        questionId:  s.questionId,
        type:        q.type,
        level:       q.level,
        section:     q.section?.name     ?? "",
        category:    q.section?.category ?? "READING",
        prompt:      (q.prompt ?? "").slice(0, 100),
        uses:        s.uses,
        correct:     s.correct,
        incorrect:   s.incorrect,
        skipped:     s.skipped,
        correctPct:  answered > 0 ? Math.round((s.correct / answered) * 100) : null,
        avgScore:    s.totalMax > 0 ? Math.round((s.totalEarned / s.uses) * 10) / 10 : null,
        lastUsed:    s.lastUsed,
      };
    });

    // Sort: most used first
    rows.sort((a, b) => b.uses - a.uses);
    return rows;
  });

  // GET /api/sections  — list all sections with category
  fastify.get("/api/sections", { preHandler: adminHook }, async () => {
    return prisma.section.findMany({ orderBy: { name: "asc" } });
  });
}


// Re-evaluate a single answer against question content (mirrors terminal calcResult)
function scoreAnswer(q, ans) {
  const c = q.content || {};
  const max = q.points ?? 1;
  try {
    switch (q.type) {
      case "SINGLE_CHOICE":
        return Number(ans) === c.correct ? max : 0;
      case "MULTIPLE_CHOICE": {
        const given   = new Set((Array.isArray(ans) ? ans : [ans]).map(Number));
        const correct = new Set(Array.isArray(c.correct) ? c.correct : [c.correct]);
        return (given.size === correct.size && [...given].every(x => correct.has(x))) ? max : 0;
      }
      case "FILL_IN_THE_BLANKS": {
        if (typeof ans !== "object") return 0;
        const norm   = s => String(s).trim().toLowerCase();
        const blanks = (c.segments || []).filter(s => s.type === "blank");
        return blanks.length && blanks.every(b => norm(ans[b.id] ?? "") === norm(b.answer ?? "")) ? max : 0;
      }
      case "DRAG_TO_TEXT": {
        if (typeof ans !== "object") return 0;
        const norm = s => String(s).trim().toLowerCase();
        return Object.entries(c.slots || {}).every(([k, v]) => norm(ans[k] ?? "") === norm(v)) ? max : 0;
      }
      case "DRAG_AND_DROP_TABLE": {
        if (typeof ans !== "object") return 0;
        return Object.entries(c.correct || {}).every(([k, v]) => ans[k] === v) ? max : 0;
      }
      case "TEXT_INSERTION": {
        if (typeof ans !== "object") return 0;
        return (c.markers || []).every(m => Number(ans[m.id] ?? -1) === m.correct) ? max : 0;
      }
      case "IMAGE_CLICK": {
        if (typeof ans !== "object") return 0;
        const { x, y } = ans;
        const hit = (c.hotspots || []).find(h => h.correct && x >= h.x && x <= h.x + (h.width||10) && y >= h.y && y <= h.y + (h.height||10));
        return hit ? max : 0;
      }
      case "DRAG_AND_DROP_IMAGE": {
        if (typeof ans !== "object") return 0;
        return (c.hotspots || []).every(h => Number(ans[h.id] ?? -1) === h.correct) ? max : 0;
      }
      default: return 0;
    }
  } catch { return 0; }
}

// Only allow known Question fields through to Prisma
function sanitize(body) {
  const allowed = [
    "type", "level", "points", "status",
    "contextText", "media",
    "prompt",
    "content", "config",
  ];
  return Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );
}
