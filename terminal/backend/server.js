/**
 * ArmExam Terminal Backend  v1.0
 * PIN validation · session management · results
 */
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { readFileSync, existsSync, mkdirSync, renameSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT      = 4000;
const SECRET    = process.env.JWT_SECRET || 'armexam-terminal-secret-2025';
const DATA_DIR  = join(__dirname, 'data');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// Simple JSON file storage
const DB_FILE = join(DATA_DIR, 'sessions.json');
const db = { data: existsSync(DB_FILE) ? JSON.parse(readFileSync(DB_FILE, 'utf8')) : { sessions: [] } };
const saveDB = () => { writeFileSync(DB_FILE, JSON.stringify(db.data, null, 2)); return Promise.resolve(); };

const recDir = join(DATA_DIR, 'recordings');
if (!existsSync(recDir)) mkdirSync(recDir, { recursive: true });
const upload = multer({ dest: recDir, limits: { fileSize: 25 * 1024 * 1024 } });

const QUESTIONS = JSON.parse(readFileSync(join(__dirname, 'questions.json'), 'utf8'));
const EXAMS     = JSON.parse(readFileSync(join(__dirname, 'exams.json'), 'utf8'));

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

function decodePIN(pin) { return jwt.verify(pin.trim(), SECRET); }

function buildQuestions(exam) {
  if (exam.examType === 'placement') {
    const result = [];
    for (const row of exam.placementTemplate || []) {
      for (const sp of row.subpools || []) {
        const pool = QUESTIONS.filter(q => q.level === row.level && q.section === sp.section);
        if (pool.length < sp.count)
          throw new Error(`Not enough: ${row.level}/${sp.section} need ${sp.count}, have ${pool.length}`);
        shuffle(pool).slice(0, sp.count).forEach(q => result.push({ ...q, points: row.pointsEach }));
      }
    }
    return result;
  }
  const result = [];
  for (const sp of exam.subpools || []) {
    const pool = QUESTIONS.filter(q => q.level === exam.level && q.section === sp.section);
    if (pool.length < sp.count)
      throw new Error(`Not enough: ${exam.level}/${sp.section} need ${sp.count}, have ${pool.length}`);
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
      if (norm(ans) === norm(q.answer)) earned += q.points;
    }
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

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use('/recordings', express.static(recDir));

// Generate PIN (called from admin)
app.post('/api/pin/generate', (req, res) => {
  const { studentId, studentName, examId, expiresIn = '30d' } = req.body;
  if (!studentId || !examId) return res.status(400).json({ error: 'studentId and examId required' });
  const pin = jwt.sign({ studentId, studentName: studentName || `Student ${studentId}`, examId }, SECRET, { expiresIn });
  return res.json({ pin });
});

// Start / resume session
app.post('/api/session/start', async (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN required' });
  let payload;
  try { payload = decodePIN(pin); }
  catch { return res.status(401).json({ error: 'Invalid or expired PIN' }); }

  const existing = db.data.sessions.find(s => s.pin === pin && s.status === 'active');
  if (existing) return res.json({ ...existing, resumed: true });

  const exam = EXAMS.find(e => e.id === payload.examId);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  let questions;
  try { questions = buildQuestions(exam); }
  catch (e) { return res.status(500).json({ error: e.message }); }

  const session = {
    sessionId: randomUUID(),
    pin,
    studentId: payload.studentId,
    studentName: payload.studentName || `Student ${payload.studentId}`,
    examId: exam.id,
    examTitle: exam.title,
    examType: exam.examType,
    examConfig: {
      duration: exam.duration,
      passingScore: exam.passingScore,
      showQuestionLevel: exam.showQuestionLevel ?? true,
      showQuestionPoints: exam.showQuestionPoints ?? true,
      allowReview: exam.allowReview ?? false,
      maxAudioReplays: exam.maxAudioReplays ?? 2,
      maxVideoReplays: exam.maxVideoReplays ?? 1,
    },
    level: exam.level || null,
    questions,
    answers: {},
    voiceRecordings: {},
    startedAt: new Date().toISOString(),
    finishedAt: null,
    status: 'active',
    result: null,
    resumed: false,
  };

  db.data.sessions.push(session);
  await saveDB();
  return res.json(session);
});

// Save answer
app.post('/api/session/answer', async (req, res) => {
  const { sessionId, questionId, answer } = req.body;
  const s = db.data.sessions.find(s => s.sessionId === sessionId && s.status === 'active');
  if (!s) return res.status(404).json({ error: 'Session not found' });
  s.answers[String(questionId)] = answer;
  await saveDB();
  return res.json({ ok: true });
});

// Upload voice
app.post('/api/session/voice', upload.single('audio'), async (req, res) => {
  const { sessionId, questionId } = req.body;
  if (!sessionId || !req.file) return res.status(400).json({ error: 'sessionId and audio required' });
  const s = db.data.sessions.find(s => s.sessionId === sessionId && s.status === 'active');
  if (!s) return res.status(404).json({ error: 'Session not found' });
  const dest = req.file.path + '.webm';
  renameSync(req.file.path, dest);
  s.voiceRecordings[String(questionId)] = req.file.filename + '.webm';
  await saveDB();
  return res.json({ ok: true, filename: req.file.filename + '.webm' });
});

// Finish exam
app.post('/api/session/finish', async (req, res) => {
  const { sessionId } = req.body;
  const s = db.data.sessions.find(s => s.sessionId === sessionId);
  if (!s) return res.status(404).json({ error: 'Session not found' });
  const exam = EXAMS.find(e => e.id === s.examId);
  s.result = calcResult(exam, s.questions, s.answers);
  s.status = 'finished';
  s.finishedAt = new Date().toISOString();
  await saveDB();
  return res.json({ result: s.result, finishedAt: s.finishedAt });
});

app.get('/api/session/:id', (req, res) => {
  const s = db.data.sessions.find(s => s.sessionId === req.params.id);
  return s ? res.json(s) : res.status(404).json({ error: 'Not found' });
});

app.get('/api/sessions', (req, res) => {
  return res.json(db.data.sessions.map(({ pin, questions, answers, voiceRecordings, ...s }) => s));
});

app.get('/api/health', (_, res) => res.json({ ok: true, sessions: db.data.sessions.length }));

app.listen(PORT, () => console.log(`✓ ArmExam Terminal Backend  http://localhost:${PORT}`));
