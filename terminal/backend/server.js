/**
 * ArmExam Terminal Backend  v2.0
 * PIN lookup from main API → session management → results
 * PIN is the 8-char code from ExamAssignment table (no JWT needed)
 */
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync, createReadStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT       = 4000;
const MAIN_API   = process.env.MAIN_API_URL || 'http://localhost:3001'; // main armexam backend
const DATA_DIR   = join(__dirname, 'data');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// ── Simple JSON storage ───────────────────────────────────────────────────────
const DB_FILE = join(DATA_DIR, 'sessions.json');
const db = { data: existsSync(DB_FILE) ? JSON.parse(readFileSync(DB_FILE, 'utf8')) : { sessions: [] } };
const saveDB = () => writeFileSync(DB_FILE, JSON.stringify(db.data, null, 2));

// ── Voice recordings ──────────────────────────────────────────────────────────
const recDir = join(DATA_DIR, 'recordings');
if (!existsSync(recDir)) mkdirSync(recDir, { recursive: true });
const upload = multer({ dest: recDir, limits: { fileSize: 25 * 1024 * 1024 } });

// ── Helpers ───────────────────────────────────────────────────────────────────
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

// Fetch full assignment data from main backend using PIN
async function fetchPinData(pin) {
  const url = `${MAIN_API}/api/register/pin/${pin.trim().toUpperCase()}`;
  console.log(`[PIN] Fetching: ${url}`);
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    console.error(`[PIN] Network error: ${e.message}`);
    throw new Error(`Network error connecting to main API (${MAIN_API}): ${e.message}`);
  }
  console.log(`[PIN] Response status: ${res.status}`);
  if (res.status === 404) throw new Error('PIN not found');
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[PIN] Error body: ${body}`);
    throw new Error(`Main API error: ${res.status} ${body}`);
  }
  const data = await res.json();
  console.log(`[PIN] Got assignment for student: ${data.student?.name}, exam: ${data.exam?.title}`);
  return data;
}

// Load questions from main API (questions bank)
async function fetchQuestions() {
  const res = await fetch(`${MAIN_API}/api/questions?limit=9999`);
  if (!res.ok) throw new Error('Failed to load questions from main API');
  const data = await res.json();
  // Support both { questions: [...] } and plain array
  return Array.isArray(data) ? data : (data.questions || data.items || []);
}

function buildQuestions(exam, questions) {
  const byLevelSection = (level, section) =>
    questions.filter(q => q.level === level && q.section === section);

  if (exam.examType === 'placement') {
    const result = [];
    for (const row of exam.placementTemplate || []) {
      for (const sp of row.subpools || []) {
        const pool = byLevelSection(row.level, sp.section);
        if (pool.length < sp.count)
          throw new Error(`Not enough questions: ${row.level}/${sp.section} — need ${sp.count}, have ${pool.length}`);
        shuffle(pool).slice(0, sp.count).forEach(q => result.push({ ...q, points: row.pointsEach }));
      }
    }
    return result;
  }
  // Fixed
  const result = [];
  for (const sp of exam.subpools || []) {
    const pool = byLevelSection(exam.level, sp.section);
    if (pool.length < sp.count)
      throw new Error(`Not enough questions: ${exam.level}/${sp.section} — need ${sp.count}, have ${pool.length}`);
    shuffle(pool).slice(0, sp.count).forEach(q => result.push({ ...q }));
  }
  return exam.shuffle ? shuffle(result) : result;
}

function calcResult(exam, questions, answers) {
  // ── Score individual question using new content structure ─────────────────
  function scoreQuestion(q) {
    const ans = answers[String(q.id)];
    if (ans === undefined || ans === null || ans === '') return 0;

    const c = q.content || {};

    switch (q.type) {
      case 'SINGLE_CHOICE': {
        return Number(ans) === c.correct ? q.points : 0;
      }
      case 'MULTIPLE_CHOICE': {
        const given   = new Set((Array.isArray(ans) ? ans : [ans]).map(Number));
        const correct = new Set(Array.isArray(c.correct) ? c.correct : [c.correct]);
        return (given.size === correct.size && [...given].every(x => correct.has(x))) ? q.points : 0;
      }
      case 'FILL_IN_THE_BLANKS': {
        // ans: { [blankId]: "typed text" }
        if (typeof ans !== 'object') return 0;
        const norm    = s => String(s).trim().toLowerCase();
        const blanks  = (c.segments || []).filter(s => s.type === 'blank');
        if (blanks.length === 0) return 0;
        const allCorrect = blanks.every(b => norm(ans[b.id] ?? '') === norm(b.answer ?? ''));
        return allCorrect ? q.points : 0;
      }
      case 'DRAG_TO_TEXT': {
        // ans: { slot_1: "word", slot_2: "word" }
        if (typeof ans !== 'object') return 0;
        const norm = s => String(s).trim().toLowerCase();
        const slots = c.slots || {};
        const allCorrect = Object.entries(slots).every(
          ([slot, expected]) => norm(ans[slot] ?? '') === norm(expected)
        );
        return allCorrect ? q.points : 0;
      }
      case 'DRAG_AND_DROP_TABLE': {
        // ans: { item_1: "col_1", item_2: "col_2", ... }
        if (typeof ans !== 'object') return 0;
        const correct = c.correct || {};
        const allCorrect = Object.entries(correct).every(
          ([itemId, colId]) => ans[itemId] === colId
        );
        return allCorrect ? q.points : 0;
      }
      case 'TEXT_INSERTION': {
        // ans: { [markerId]: sentenceIndex }
        if (typeof ans !== 'object') return 0;
        const markers = c.markers || [];
        const allCorrect = markers.every(m => Number(ans[m.id] ?? -1) === m.correct);
        return allCorrect ? q.points : 0;
      }
      case 'IMAGE_CLICK': {
        // ans: { x: 45.2, y: 32.1 }  — check if inside correct hotspot
        if (typeof ans !== 'object') return 0;
        const { x, y } = ans;
        const hit = (c.hotspots || []).find(h =>
          h.correct &&
          x >= h.x && x <= h.x + (h.width || 10) &&
          y >= h.y && y <= h.y + (h.height || 10)
        );
        return hit ? q.points : 0;
      }
      case 'DRAG_AND_DROP_IMAGE': {
        // ans: { [hotspotId]: labelIndex }
        if (typeof ans !== 'object') return 0;
        const hotspots = c.hotspots || [];
        const allCorrect = hotspots.every(h => Number(ans[h.id] ?? -1) === h.correct);
        return allCorrect ? q.points : 0;
      }
      // Manual grading types → 0 until examiner scores
      case 'WRITING_INDEPENDENT':
      case 'WRITING_INTEGRATED':
      case 'SPEAKING_INDEPENDENT':
      case 'SPEAKING_INTEGRATED':
        return 0;
      default:
        return 0;
    }
  }

  if (exam.examType === 'placement') {
    // ── Per-level scoring ────────────────────────────────────────────────────
    const thr = exam.placementThresholds || { A1:60, A2:60, B1:60, B2:60, C1:60, C2:60 };
    const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    // Group questions by level
    const byLevel = {};
    for (const q of questions) {
      if (!byLevel[q.level]) byLevel[q.level] = [];
      byLevel[q.level].push(q);
    }

    // Score each level
    const levelResults = {};
    let totalEarned = 0, totalPts = 0;
    for (const lvl of LEVELS) {
      const qs = byLevel[lvl] || [];
      if (qs.length === 0) continue;
      const maxPts  = qs.reduce((s, q) => s + q.points, 0);
      const earnedPts = qs.reduce((s, q) => s + scoreQuestion(q), 0);
      const pct = maxPts > 0 ? Math.round((earnedPts / maxPts) * 100) : 0;
      levelResults[lvl] = { earnedPts, maxPts, pct, passed: pct >= (thr[lvl] ?? 60) };
      totalEarned += earnedPts;
      totalPts    += maxPts;
    }

    // Highest level where threshold is met
    let placementLevel = null;
    for (const lvl of LEVELS) {
      if (levelResults[lvl]?.passed) placementLevel = lvl;
    }

    const overallPct = totalPts > 0 ? Math.round((totalEarned / totalPts) * 100) : 0;

    return {
      score:          overallPct,
      earnedPts:      totalEarned,
      totalPts,
      placementLevel,                          // null = below minimum
      passed:         placementLevel !== null,
      belowMinimum:   placementLevel === null,
      levelResults,                            // per-level breakdown for display
    };
  }

  // ── Fixed exam: simple pass/fail ──────────────────────────────────────────
  let totalPts = 0, earned = 0;
  for (const q of questions) {
    totalPts += q.points;
    earned   += scoreQuestion(q);
  }
  const pct = totalPts > 0 ? Math.round((earned / totalPts) * 100) : 0;
  const passingScore = exam.passingScore ?? 70;
  return { score: pct, earnedPts: earned, totalPts, passed: pct >= passingScore, passingScore };
}

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use('/recordings', express.static(recDir));

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/session/start
 * Body: { pin }  — 8-char PIN from ExamAssignment
 * Returns full session with student info, exam config, questions
 */
app.post('/api/session/start', async (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN required' });

  // Resume existing active session for this PIN
  const existing = db.data.sessions.find(s => s.pin === pin.trim().toUpperCase() && s.status === 'active');
  if (existing) return res.json({ ...existing, resumed: true });

  // Fetch from main backend
  let assignment;
  try {
    assignment = await fetchPinData(pin);
  } catch (e) {
    console.error('[session/start] fetchPinData failed:', e.message);
    if (e.message === 'PIN not found') return res.status(401).json({ error: 'Invalid PIN code' });
    if (e.message.startsWith('Network error')) {
      return res.status(503).json({ error: `Main API unavailable. Is the server running on ${MAIN_API}? (${e.message})` });
    }
    return res.status(503).json({ error: e.message });
  }

  const { student, exam } = assignment;

  // Load questions from main backend
  let allQuestions;
  try {
    allQuestions = await fetchQuestions();
  } catch {
    // Fallback to local questions.json if main API unavailable
    try {
      allQuestions = JSON.parse(readFileSync(join(__dirname, 'questions.json'), 'utf8'));
    } catch {
      return res.status(503).json({ error: 'Cannot load questions' });
    }
  }

  let questions;
  try {
    questions = buildQuestions(exam, allQuestions);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  const session = {
    sessionId: randomUUID(),
    pin: pin.trim().toUpperCase(),
    // Student info
    studentId: student.id,
    studentName: student.name,
    studentEmail: student.email,
    studentLevel: student.level,
    studentDoc: student.documentNumber,
    // Exam info
    examId: exam.id,
    examTitle: exam.title,
    examType: exam.examType,
    examLevel: exam.level,
    center: exam.examCenter ? {
      id: exam.examCenter.id,
      name: exam.examCenter.name,
      city: exam.examCenter.city?.name,
    } : null,
    // Exam config (from admin settings)
    examConfig: {
      duration:              exam.duration       ?? 60,
      passingScore:          exam.passingScore   ?? null,
      shuffle:               exam.shuffle        ?? true,
      showResults:           exam.showResults    ?? true,
      allowReview:           false,
      showQuestionLevel:     exam.showQuestionLevel  ?? true,
      showQuestionPoints:    exam.showQuestionPoints ?? true,
      showPlacementThreshold: exam.showPlacementThreshold ?? false,
      maxAudioReplays:       2,
      maxVideoReplays:       1,
      startDate:             exam.startDate,
      endDate:               exam.endDate,
      placementThresholds:   exam.placementThresholds,
    },
    questions,
    answers: {},
    voiceRecordings: {},
    startedAt: new Date().toISOString(),
    finishedAt: null,
    status: 'active',
    result: null,
  };

  db.data.sessions.push(session);
  saveDB();
  return res.json({ ...session, resumed: false });
});

/** POST /api/session/answer */
app.post('/api/session/answer', (req, res) => {
  const { sessionId, questionId, answer } = req.body;
  const s = db.data.sessions.find(s => s.sessionId === sessionId && s.status === 'active');
  if (!s) return res.status(404).json({ error: 'Session not found' });
  s.answers[String(questionId)] = answer;
  saveDB();
  return res.json({ ok: true });
});

/** POST /api/session/voice — upload voice recording */
app.post('/api/session/voice', upload.single('audio'), (req, res) => {
  const { sessionId, questionId } = req.body;
  if (!sessionId || !req.file) return res.status(400).json({ error: 'sessionId and audio required' });
  const s = db.data.sessions.find(s => s.sessionId === sessionId && s.status === 'active');
  if (!s) return res.status(404).json({ error: 'Session not found' });
  const dest = req.file.path + '.webm';
  renameSync(req.file.path, dest);
  s.voiceRecordings[String(questionId)] = req.file.filename + '.webm';
  saveDB();
  return res.json({ ok: true, filename: req.file.filename + '.webm' });
});

/** POST /api/session/finish */
app.post('/api/session/finish', (req, res) => {
  const { sessionId } = req.body;
  const s = db.data.sessions.find(s => s.sessionId === sessionId);
  if (!s) return res.status(404).json({ error: 'Session not found' });
  const result = calcResult(
    {
      examType:           s.examType,
      passingScore:       s.examConfig?.passingScore,
      placementThresholds: s.examConfig?.placementThresholds,
    },
    s.questions,
    s.answers
  );
  s.result = result;
  s.status = 'finished';
  s.finishedAt = new Date().toISOString();
  saveDB();

  // Merge voice recording paths into answers for main API
  const answersWithVoice = { ...s.answers };
  for (const [qid, filename] of Object.entries(s.voiceRecordings || {})) {
    answersWithVoice[qid] = `/voice/${filename}`; // relative URL served by terminal backend
  }

  // Determine if manual grading is needed
  const MANUAL_TYPES = new Set(['WRITING_INDEPENDENT','WRITING_INTEGRATED','SPEAKING_INDEPENDENT','SPEAKING_INTEGRATED']);
  const hasManual = s.questions.some(q => MANUAL_TYPES.has(q.type));

  // Push result to main backend using PIN-authenticated endpoint
  fetch(`${MAIN_API}/api/terminal/result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pin:           s.pin,
      examId:        s.examId,
      studentId:     s.studentId,
      score:         result.earnedPts,
      totalPoints:   result.totalPts,
      pct:           result.score,
      passed:        result.passed,
      placementLevel: result.placementLevel ?? null,
      levelResults:   result.levelResults  ?? null,
      belowMinimum:   result.belowMinimum  ?? false,
      answers:        answersWithVoice,
      gradingStatus:  hasManual ? 'pending' : 'auto',
    }),
  }).then(async r => {
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      console.error(`[finish] Failed to push result: ${r.status} ${body}`);
    } else {
      console.log(`[finish] Result pushed to main API for student ${s.studentId}`);
    }
  }).catch(e => console.error(`[finish] Push error: ${e.message}`));

  return res.json({ result, finishedAt: s.finishedAt });
});

/** GET /voice/:filename — serve recorded voice files (for examiner playback) */
app.get('/voice/:filename', (req, res) => {
  const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, '');
  const filePath = join(recDir, safeName);
  if (!existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.setHeader('Content-Type', 'audio/webm');
  res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
  createReadStream(filePath).pipe(res);
});

app.get('/api/session/:id', (req, res) => {
  const s = db.data.sessions.find(s => s.sessionId === req.params.id);
  return s ? res.json(s) : res.status(404).json({ error: 'Not found' });
});

app.get('/api/sessions', (req, res) => {
  return res.json(db.data.sessions.map(({ questions, answers, voiceRecordings, pin, ...s }) => s));
});

app.get('/', (_, res) => res.redirect('/api/health'));
app.get('/api/health', (_, res) => res.json({ ok: true, mainApi: MAIN_API, sessions: db.data.sessions.length }));

app.get('/', (_, res) => {
  const sessions = db.data.sessions;
  const active   = sessions.filter(s => s.status === 'active').length;
  const finished = sessions.filter(s => s.status === 'finished').length;
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>ArmExam Terminal Backend</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0a0c12;color:#e2e8f0;font-family:'DM Sans',system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
  .card{background:#161925;border:1px solid #ffffff18;border-radius:20px;padding:40px 48px;max-width:480px;width:100%}
  .logo{font-size:13px;color:#8891aa;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
  h1{font-size:28px;font-weight:700;color:#f0f0f5;margin-bottom:4px}
  .sub{font-size:13px;color:#8891aa;margin-bottom:32px}
  .row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #ffffff0e}
  .row:last-child{border-bottom:none}
  .label{font-size:12px;color:#8891aa}
  .val{font-size:13px;font-weight:600;color:#f0f0f5;font-family:monospace}
  .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#4ade80;margin-right:6px}
  .stat{display:inline-block;background:#c8a96e18;color:#c8a96e;border:1px solid #c8a96e33;border-radius:6px;padding:2px 10px;font-size:12px;font-weight:700}
</style></head><body><div class="card">
  <div class="logo">🎓 ArmExam</div>
  <h1>Terminal Backend</h1>
  <div class="sub">Exam Kiosk API Server · v2.0</div>
  <div class="row"><span class="label">Status</span><span class="val"><span class="dot"></span>Running</span></div>
  <div class="row"><span class="label">Port</span><span class="val">${PORT}</span></div>
  <div class="row"><span class="label">Main API</span><span class="val">${MAIN_API}</span></div>
  <div class="row"><span class="label">Active sessions</span><span class="stat">${active}</span></div>
  <div class="row"><span class="label">Finished sessions</span><span class="stat">${finished}</span></div>
  <div class="row"><span class="label">API health</span><span class="val"><a href="/api/health" style="color:#60a5fa">/api/health</a></span></div>
  <div class="row"><span class="label">Sessions list</span><span class="val"><a href="/api/sessions" style="color:#60a5fa">/api/sessions</a></span></div>
</div></body></html>`);
});

app.listen(PORT, () => console.log(`✓ ArmExam Terminal Backend  http://localhost:${PORT}\n  Main API: ${MAIN_API}`));
