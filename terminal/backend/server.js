/**
 * ArmExam Terminal Backend  v2.0
 * PIN lookup from main API → session management → results
 * PIN is the 8-char code from ExamAssignment table (no JWT needed)
 */
import express from 'express';
import cors from 'cors';
import { randomUUID, createHash } from 'crypto';
import { readFileSync, existsSync, mkdirSync, writeFileSync, renameSync,
         createReadStream, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

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
const upload = multer({ dest: recDir, limits: { fileSize: 50 * 1024 * 1024 } });

// ── Media cache (pre-downloaded audio/video for offline playback) ──────────────
const mediaDir = join(DATA_DIR, 'media');
if (!existsSync(mediaDir)) mkdirSync(mediaDir, { recursive: true });

// ── In-memory heartbeat store (survives only while process is alive) ───────────
// Durable snapshots are written to session.answers in sessions.json on each heartbeat.
// Key: sessionId → { answers, savedAt }
const heartbeatCache = new Map();

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

// Canonical level order used for sorting and ladder algorithm
const LEVEL_ORDER = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

// Maps section name → category
const SECTION_CATEGORY = {
  Reading:    'READING',
  Listening:  'LISTENING',
  Speaking:   'SPEAKING',
  Writing:    'WRITING',
  Grammar:    'READING',
  Vocabulary: 'READING',
};
function sectionCategory(name) {
  return SECTION_CATEGORY[name] ?? 'READING';
}

// Section meta shown on intro screen
const SECTION_META = {
  READING:   { icon: '📖', instruction: 'Read each text carefully. You can navigate freely and change your answers.' },
  LISTENING: { icon: '🎧', instruction: 'Audio plays automatically. You cannot go back within this section.' },
  SPEAKING:  { icon: '🎙', instruction: 'You will have preparation time before each recording starts automatically.' },
  WRITING:   { icon: '✍',  instruction: 'Write your responses. Copy-paste is disabled in this section.' },
};

/**
 * buildExam(exam, questionBank)
 * Returns { sections, questions }
 *
 * sections[]:
 *   { id, category, icon, label, instruction, questionCount, startIndex }
 *
 * questions[]: flat array, each question has .sectionId, .category, .orderIndex
 */
function buildExam(exam, questionBank) {
  const byLevelSection = (level, section) =>
    questionBank.filter(q => q.level === level && q.section === section);

  if (exam.examType === 'placement') {
    // Step 1: collect per section
    const bySection = {};
    for (const row of exam.placementTemplate || []) {
      for (const sp of row.subpools || []) {
        const pool = byLevelSection(row.level, sp.section);
        if (pool.length < sp.count)
          throw new Error(`Not enough questions: ${row.level}/${sp.section} — need ${sp.count}, have ${pool.length}`);
        if (!bySection[sp.section]) bySection[sp.section] = [];
        shuffle(pool).slice(0, sp.count).forEach(q =>
          bySection[sp.section].push({ ...q, points: row.pointsEach })
        );
      }
    }

    // Step 2: sort each section A1 → C2
    for (const sec of Object.keys(bySection)) {
      bySection[sec].sort((a, b) =>
        (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99)
      );
    }

    // Step 3: canonical section order from template
    const sectionOrder = [];
    for (const row of exam.placementTemplate || [])
      for (const sp of row.subpools || [])
        if (!sectionOrder.includes(sp.section)) sectionOrder.push(sp.section);
    for (const sec of Object.keys(bySection))
      if (!sectionOrder.includes(sec)) sectionOrder.push(sec);

    // Step 4: build flat array + sections manifest
    const flatQuestions = [];
    const sections = [];
    for (const secName of sectionOrder) {
      const qs = bySection[secName] ?? [];
      if (qs.length === 0) continue;
      const cat  = sectionCategory(secName);
      const meta = SECTION_META[cat];
      sections.push({
        id:            secName,
        category:      cat,
        icon:          meta.icon,
        label:         secName,
        instruction:   meta.instruction,
        questionCount: qs.length,
        startIndex:    flatQuestions.length,
      });
      qs.forEach(q => flatQuestions.push({ ...q, sectionId: secName, category: cat }));
    }

    // Step 5: stamp orderIndex
    flatQuestions.forEach((q, i) => { q.orderIndex = i + 1; });
    return { sections, questions: flatQuestions };
  }

  // ── Fixed exam ────────────────────────────────────────────────────────────
  const result = [];
  for (const sp of exam.subpools || []) {
    const pool = byLevelSection(exam.level, sp.section);
    if (pool.length < sp.count)
      throw new Error(`Not enough questions: ${exam.level}/${sp.section} — need ${sp.count}, have ${pool.length}`);
    shuffle(pool).slice(0, sp.count).forEach(q =>
      result.push({ ...q, sectionId: sp.section, category: sectionCategory(sp.section) })
    );
  }
  const flat = exam.shuffle ? shuffle(result) : result;
  flat.forEach((q, i) => { q.orderIndex = i + 1; });
  const sections = [{
    id:            exam.level ?? 'Exam',
    category:      'READING',
    icon:          '📝',
    label:         exam.title ?? 'Exam',
    instruction:   'Answer all questions. You can navigate freely.',
    questionCount: flat.length,
    startIndex:    0,
  }];
  return { sections, questions: flat };
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
    const LEVELS = Object.keys(LEVEL_ORDER); // ['A1','A2','B1','B2','C1','C2']

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

    // ── Ladder algorithm ("лестница") ──────────────────────────────────────
    // Walk levels in order. Advance only if threshold is met.
    // Stop immediately on first failure — scores above that level are ignored.
    // This prevents "B1 by luck" when A2 was failed.
    let placementLevel = null;          // null  → below minimum (Pre-A1)
    for (const lvl of LEVELS) {
      if (!levelResults[lvl]) continue; // level not in this exam's template
      if (levelResults[lvl].passed) {
        placementLevel = lvl;           // passed — climb the ladder
      } else {
        break;                          // failed — stop here, ignore higher levels
      }
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
  if (existing) {
    // Merge in-memory heartbeat cache (more current than disk) before returning
    const cached = heartbeatCache.get(existing.sessionId);
    if (cached) {
      for (const [qid, val] of Object.entries(cached.answers)) {
        existing.answers[String(qid)] = val;
      }
    }
    console.log(`[resume] Session ${existing.sessionId} resumed with ${Object.keys(existing.answers).length} saved answers`);
    return res.json({ ...existing, resumed: true, resumedAt: new Date().toISOString() });
  }

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

  let examData;
  try {
    examData = buildExam(exam, allQuestions);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
  const { sections, questions } = examData;

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
    // Sections manifest (for ExamScreen section-aware UI)
    sections,
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

// ── Heartbeat / autosave ─────────────────────────────────────────────────────
/**
 * POST /api/session/heartbeat
 * Body: { sessionId, answers: { "42": "A", "43": "Some text..." } }
 * Called every 10-15s by the terminal. Saves full answers snapshot.
 * On PIN resume, this snapshot is returned so the student continues where they left off.
 */
app.post('/api/session/heartbeat', (req, res) => {
  const { sessionId, answers } = req.body;
  if (!sessionId || typeof answers !== 'object') {
    return res.status(400).json({ error: 'sessionId and answers required' });
  }
  const s = db.data.sessions.find(s => s.sessionId === sessionId && s.status === 'active');
  if (!s) return res.status(404).json({ error: 'Session not found' });

  const now = new Date().toISOString();

  // Merge incoming answers (never overwrite with undefined)
  for (const [qid, val] of Object.entries(answers)) {
    if (val !== undefined && val !== null) s.answers[String(qid)] = val;
  }
  s.lastHeartbeat = now;

  // In-memory cache for instant resume
  heartbeatCache.set(sessionId, { answers: { ...s.answers }, savedAt: now });

  // Persist to disk (debounced by Node's event loop — fast enough)
  saveDB();

  return res.json({ ok: true, savedAt: now, answersCount: Object.keys(s.answers).length });
});

/** POST /api/session/answer — single answer save (still supported) */
app.post('/api/session/answer', (req, res) => {
  const { sessionId, questionId, answer } = req.body;
  const s = db.data.sessions.find(s => s.sessionId === sessionId && s.status === 'active');
  if (!s) return res.status(404).json({ error: 'Session not found' });
  s.answers[String(questionId)] = answer;
  s.lastHeartbeat = new Date().toISOString();
  heartbeatCache.set(sessionId, { answers: { ...s.answers }, savedAt: s.lastHeartbeat });
  saveDB();
  return res.json({ ok: true });
});

/** POST /api/session/voice — upload voice recording with integrity check */
app.post('/api/session/voice', upload.single('audio'), async (req, res) => {
  const { sessionId, questionId, sha256 } = req.body;
  if (!sessionId || !req.file) {
    return res.status(400).json({ error: 'sessionId and audio file required' });
  }

  const s = db.data.sessions.find(s => s.sessionId === sessionId && s.status === 'active');
  if (!s) return res.status(404).json({ error: 'Session not found' });

  // ── Integrity check (optional but recommended) ─────────────────────────────
  // Client sends SHA-256 hex of the blob before upload.
  // We verify the stored file matches to catch corrupt transfers.
  if (sha256) {
    const fileData = readFileSync(req.file.path);
    const actual   = createHash('sha256').update(fileData).digest('hex');
    if (actual !== sha256.toLowerCase()) {
      const { unlinkSync } = await import('fs');
      try { unlinkSync(req.file.path); } catch {}
      console.warn(`[voice] Integrity mismatch for session ${sessionId} q${questionId}`);
      return res.status(422).json({ error: 'File integrity check failed — please re-record' });
    }
  }

  // ── Save with .webm extension ──────────────────────────────────────────────
  const filename = req.file.filename + '.webm';
  const dest     = join(recDir, filename);
  renameSync(req.file.path, dest);

  // ── File size sanity check ────────────────────────────────────────────────
  const stats = statSync(dest);
  if (stats.size < 1024) {
    // < 1 KB is almost certainly an empty/corrupt recording
    console.warn(`[voice] Suspiciously small file (${stats.size}B) for session ${sessionId} q${questionId}`);
  }

  s.voiceRecordings[String(questionId)] = filename;
  s.answers[String(questionId)] = 'recorded_' + questionId; // mark as answered
  heartbeatCache.set(sessionId, { answers: { ...s.answers }, savedAt: new Date().toISOString() });
  saveDB();

  console.log(`[voice] Saved ${filename} (${(stats.size/1024).toFixed(1)} KB) for q${questionId}`);
  return res.json({ ok: true, filename, sizeBytes: stats.size });
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

// ── Media prefetch & local cache ──────────────────────────────────────────────
/**
 * POST /api/media/prefetch
 * Body: { urls: ["https://cdn.example.com/audio1.mp3", ...] }
 * Downloads each URL into the local media cache.
 * Called when a session starts — terminal preloads all media before exam begins.
 * Returns { cached: [...], failed: [...] }
 */
app.post('/api/media/prefetch', async (req, res) => {
  const { urls } = req.body;
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls array required' });
  }

  const cached  = [];
  const failed  = [];

  await Promise.allSettled(
    urls.map(async (url) => {
      try {
        // Use URL hash as local filename to avoid collisions
        const key      = createHash('md5').update(url).digest('hex');
        const ext      = url.split('?')[0].split('.').pop().slice(0, 6) || 'bin';
        const filename = `${key}.${ext}`;
        const dest     = join(mediaDir, filename);

        // Skip if already cached
        if (existsSync(dest)) {
          cached.push({ url, filename, fromCache: true });
          return;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const writer = createWriteStream(dest);
        await pipeline(response.body, writer);

        const size = statSync(dest).size;
        cached.push({ url, filename, fromCache: false, sizeBytes: size });
        console.log(`[prefetch] Cached ${filename} (${(size/1024).toFixed(1)} KB)`);
      } catch (e) {
        failed.push({ url, error: e.message });
        console.warn(`[prefetch] Failed ${url}: ${e.message}`);
      }
    })
  );

  return res.json({ cached, failed, total: urls.length });
});

/**
 * GET /api/media/status
 * Returns list of cached files with sizes — for admin diagnostics.
 */
app.get('/api/media/status', async (req, res) => {
  try {
    const { readdirSync } = await import('fs');
    const files = readdirSync(mediaDir).map(f => {
      const s = statSync(join(mediaDir, f));
      return { filename: f, sizeBytes: s.size, mtime: s.mtime };
    });
    return res.json({ count: files.length, totalBytes: files.reduce((a, f) => a + f.sizeBytes, 0), files });
  } catch {
    return res.json({ count: 0, totalBytes: 0, files: [] });
  }
});

/**
 * GET /api/media/:hash.:ext — serve cached media file
 * Terminal replaces remote URLs with local ones after prefetch.
 */
app.get('/api/media/:filename', (req, res) => {
  const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, '');
  const filePath = join(mediaDir, safeName);
  if (!existsSync(filePath)) return res.status(404).json({ error: 'Not cached' });

  // Detect MIME from extension
  const ext  = safeName.split('.').pop().toLowerCase();
  const mime = { mp3:'audio/mpeg', webm:'audio/webm', mp4:'video/mp4',
                 ogg:'audio/ogg', wav:'audio/wav', jpg:'image/jpeg',
                 jpeg:'image/jpeg', png:'image/png', gif:'image/gif' }[ext] || 'application/octet-stream';

  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  createReadStream(filePath).pipe(res);
});

app.get('/api/session/:id', (req, res) => {
  const s = db.data.sessions.find(s => s.sessionId === req.params.id);
  return s ? res.json(s) : res.status(404).json({ error: 'Not found' });
});

app.get('/api/sessions', (req, res) => {
  return res.json(db.data.sessions.map(({ questions, answers, voiceRecordings, pin, ...s }) => s));
});

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
