/**
 * ArmExam Terminal Backend  v2.0
 * PIN lookup from main API → session management → results
 * PIN is the 8-char code from ExamAssignment table (no JWT needed)
 */
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT       = 4000;
const MAIN_API   = process.env.MAIN_API_URL || 'http://localhost:3000'; // main armexam backend
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
  const res = await fetch(`${MAIN_API}/api/register/pin/${pin.trim().toUpperCase()}`);
  if (res.status === 404) throw new Error('PIN not found');
  if (!res.ok) throw new Error(`Main API error: ${res.status}`);
  return res.json();
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
  let total = 0, earned = 0;
  for (const q of questions) {
    total += q.points;
    const ans = answers[String(q.id)];
    if (ans === undefined || ans === null || ans === '') continue;
    if (q.type === 'single_choice') {
      if (Number(ans) === q.correct) earned += q.points;
    } else if (q.type === 'multi_choice' || q.type === 'multi_select') {
      const u = new Set((Array.isArray(ans) ? ans : [ans]).map(Number));
      const c = new Set(q.correct);
      if ([...u].every(x => c.has(x)) && u.size === c.size) earned += q.points;
    } else if (q.type === 'fill_blank') {
      const norm = s => String(s).trim().toLowerCase();
      if (norm(ans) === norm(q.answer || q.correctAnswer || '')) earned += q.points;
    }
    // writing / voice → manual grading
  }
  const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
  if (exam.examType === 'placement') {
    const thr = exam.placementThresholds || {};
    let lvl = 'A1';
    for (const l of ['A1','A2','B1','B2','C1','C2']) if (pct >= (thr[l] ?? 60)) lvl = l;
    return { score: pct, earnedPts: earned, totalPts: total, placementLevel: lvl, passed: true };
  }
  return { score: pct, earnedPts: earned, totalPts: total, passed: pct >= (exam.passingScore ?? 70) };
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
    if (e.message === 'PIN not found') return res.status(401).json({ error: 'Invalid PIN code' });
    return res.status(503).json({ error: 'Cannot reach main server: ' + e.message });
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
      allowReview:           exam.allowReview    ?? false,
      showQuestionLevel:     exam.showQuestionLevel  ?? true,
      showQuestionPoints:    exam.showQuestionPoints ?? true,
      showPlacementThreshold: exam.showPlacementThreshold ?? false,
      maxAudioReplays:       exam.maxAudioReplays ?? 2,
      maxVideoReplays:       exam.maxVideoReplays ?? 1,
      startDate:             exam.startDate,
      endDate:               exam.endDate,
      startTime:             exam.startTime,
      endTime:               exam.endTime,
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
    { examType: s.examType, subpools: [], placementThresholds: s.examConfig?.placementThresholds, passingScore: s.examConfig?.passingScore },
    s.questions, s.answers
  );
  s.result = result;
  s.status = 'finished';
  s.finishedAt = new Date().toISOString();
  saveDB();

  // Optionally push result to main backend
  fetch(`${MAIN_API}/api/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      examId: s.examId, studentId: s.studentId,
      score: result.earnedPts, totalPoints: result.totalPts,
      pct: result.score, passed: result.passed,
      placementLevel: result.placementLevel,
      answers: s.answers, source: 'terminal',
    }),
  }).catch(() => {}); // non-blocking

  return res.json({ result, finishedAt: s.finishedAt });
});

app.get('/api/session/:id', (req, res) => {
  const s = db.data.sessions.find(s => s.sessionId === req.params.id);
  return s ? res.json(s) : res.status(404).json({ error: 'Not found' });
});

app.get('/api/sessions', (req, res) => {
  return res.json(db.data.sessions.map(({ questions, answers, voiceRecordings, pin, ...s }) => s));
});

app.get('/api/health', (_, res) => res.json({ ok: true, mainApi: MAIN_API, sessions: db.data.sessions.length }));

app.listen(PORT, () => console.log(`✓ ArmExam Terminal Backend  http://localhost:${PORT}\n  Main API: ${MAIN_API}`));
