import { useState, useEffect, useMemo } from "react";
import { formatDateTime } from "../dateUtils.js";

const LEVEL_COLOR  = { A1:"#4ade80", A2:"#86efac", B1:"#60a5fa", B2:"#93c5fd", C1:"#f59e0b", C2:"#fbbf24" };
const STATUS_COLOR = { pending:"#f59e0b", grading:"#60a5fa", completed:"#4ade80", auto:"#94a3b8" };
const CAT_ICON     = { SPEAKING:"🎙️", WRITING:"✍️" };

// ─────────────────────────────────────────────────────────────────────────────
export default function ExaminerDashboard({ theme: T }) {
  const [queue,    setQueue]    = useState([]);
  const [tab,      setTab]      = useState("pending");
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState(null);
  const [activeIdx,setActiveIdx]= useState(0);
  const [drafts,   setDrafts]   = useState({});   // { [qId]: { [rubricId]: number } }
  const [fbDrafts, setFbDrafts] = useState({});   // { [qId]: string }
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState(null);
  const [loading,  setLoading]  = useState(true);

  const loadQueue = async (status) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/grading/queue?gradingStatus=${status}`);
      setQueue(data);
    } catch (e) { showMsg(false, e.message); }
    finally     { setLoading(false); }
  };

  useEffect(() => { loadQueue(tab); }, [tab]);

  const openResult = async (r) => {
    setMsg(null);
    try {
      const full = await apiFetch(`/api/grading/${r.id}`);
      setSelected(full);
      setActiveIdx(0);
      const d = {}, f = {};
      for (const q of full.manualQuestions ?? []) {
        const g = full.manualGrades?.[q.id];
        d[q.id] = g?.rubrics ? { ...g.rubrics } : initRubrics(q.content?.rubrics);
        f[q.id] = g?.feedback ?? "";
      }
      setDrafts(d);
      setFbDrafts(f);
    } catch (e) { showMsg(false, e.message); }
  };

  const saveQuestion = async (qId) => {
    if (!selected) return;
    setSaving(true); setMsg(null);
    try {
      const res = await apiFetch(
        `/api/grading/${selected.id}/question/${qId}`, "PATCH",
        { rubrics: drafts[qId] ?? {}, feedback: fbDrafts[qId] ?? "" }
      );
      showMsg(true, res.allGraded ? "All done — result finalized!" : "Saved ✓");
      if (res.allGraded) { setSelected(null); loadQueue(tab); }
      else {
        const full = await apiFetch(`/api/grading/${selected.id}`);
        setSelected(full);
        const next = (full.manualQuestions ?? []).findIndex(q => !full.manualGrades?.[q.id]?.rawScore);
        if (next !== -1) setActiveIdx(next);
      }
    } catch (e) { showMsg(false, e.message); }
    finally     { setSaving(false); }
  };

  const showMsg = (ok, text) => {
    setMsg({ ok, text });
    if (ok) setTimeout(() => setMsg(null), 3000);
  };

  const setRubric  = (qId, rId, val) =>
    setDrafts(p => ({ ...p, [qId]: { ...(p[qId]??{}), [rId]: val } }));
  const setFb      = (qId, val) =>
    setFbDrafts(p => ({ ...p, [qId]: val }));

  // ─── Detail view ───────────────────────────────────────────────────────────
  if (selected) {
    const qs       = selected.manualQuestions ?? [];
    const grades   = selected.manualGrades ?? {};
    const readOnly = selected.gradingStatus === "completed";
    const cq       = qs[activeIdx] ?? null;

    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:"'DM Sans',sans-serif" }}>

        {/* Top bar */}
        <div style={{ padding:"14px 24px", borderBottom:`1px solid ${T.border}`,
          display:"flex", alignItems:"center", gap:16 }}>
          <button onClick={() => setSelected(null)} style={backBtn(T)}>← Back</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{selected.exam?.title}</div>
            <div style={{ fontSize:12, color:T.muted }}>{selected.student?.name} · {selected.student?.email}</div>
          </div>
          <GradingRing qs={qs} grades={grades} T={T} />
          {readOnly && <StatusBadge status="completed" T={T} />}
        </div>

        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
          {/* Sidebar */}
          <div style={{ width:256, borderRight:`1px solid ${T.border}`,
            overflowY:"auto", background:T.panel+"44" }}>
            {qs.map((q, i) => {
              const graded = grades[q.id]?.rawScore != null;
              return (
                <div key={q.id} onClick={() => setActiveIdx(i)} style={{
                  padding:"12px 14px", cursor:"pointer",
                  borderBottom:`1px solid ${T.border}`,
                  background: activeIdx===i ? T.gold+"11" : "transparent",
                  borderLeft:`4px solid ${activeIdx===i ? T.gold : "transparent"}`,
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:T.muted }}>Q{i+1}</span>
                    <span style={{ fontSize:10, color: graded ? "#4ade80" : T.muted }}>
                      {graded ? `✓ ${grades[q.id].scaledScore}/${q.points}` : "○ ungraded"}
                    </span>
                  </div>
                  <div style={{ fontSize:10, color:T.muted, marginBottom:3 }}>
                    {CAT_ICON[q.category]} {q.section} · {q.level} · {q.points}pt
                  </div>
                  <div style={{ fontSize:11, color:T.text,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {q.prompt}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grading panel */}
          <div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
            {cq ? (
              <QuestionPanel
                q={cq}
                answer={selected.answers?.[cq.id]}
                existingGrade={grades[cq.id] ?? null}
                rubrics={drafts[cq.id] ?? initRubrics(cq.content?.rubrics)}
                feedback={fbDrafts[cq.id] ?? ""}
                onRubric={(rId, v) => setRubric(cq.id, rId, v)}
                onFeedback={v => setFb(cq.id, v)}
                onSave={() => saveQuestion(cq.id)}
                saving={saving}
                readOnly={readOnly}
                T={T}
              />
            ) : (
              <div style={{ color:T.muted, textAlign:"center", paddingTop:60 }}>
                Select a question
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"space-between", marginTop:28 }}>
              <button disabled={activeIdx===0}
                onClick={() => setActiveIdx(v => Math.max(0,v-1))}
                style={secondaryBtn(T)}>← Prev</button>
              <button disabled={activeIdx===qs.length-1}
                onClick={() => setActiveIdx(v => Math.min(qs.length-1,v+1))}
                style={secondaryBtn(T)}>Next →</button>
            </div>
          </div>
        </div>

        {msg && <Toast msg={msg} />}
      </div>
    );
  }

  // ─── Queue list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return queue.filter(r =>
      !q ||
      r.student?.name?.toLowerCase().includes(q) ||
      r.student?.email?.toLowerCase().includes(q) ||
      r.exam?.title?.toLowerCase().includes(q) ||
      String(r.id).includes(q)
    );
  }, [queue, search]);

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"32px 40px",
      fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32,
            color:T.text, margin:"0 0 4px", fontWeight:600 }}>
            Examiner Dashboard
          </h1>
          <p style={{ fontSize:13, color:T.muted, margin:0 }}>
            Manual grading · Writing & Speaking · Rubric scoring
          </p>
        </div>
        <button onClick={() => loadQueue(tab)} style={secondaryBtn(T)}>↻ Refresh</button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {[
          { key:"pending",   label:"⏳ Pending"     },
          { key:"grading",   label:"✏️ In Progress"  },
          { key:"completed", label:"✓ Completed"    },
        ].map(({ key, label }) => {
          const color = STATUS_COLOR[key];
          return (
            <button key={key} onClick={() => setTab(key)} style={{
              padding:"8px 18px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
              background: tab===key ? color+"22" : T.panel,
              border:`1.5px solid ${tab===key ? color : T.border}`,
              color: tab===key ? color : T.muted,
            }}>
              {label}
            </button>
          );
        })}
      </div>

      {msg && (
        <div style={{ marginBottom:14, padding:"9px 14px", borderRadius:10, fontSize:13,
          background: msg.ok ? "#4ade8018" : "#ef444418",
          border:`1px solid ${msg.ok ? "#4ade8044" : "#ef444444"}`,
          color: msg.ok ? "#4ade80" : "#ef4444" }}>
          {msg.text}
        </div>
      )}

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍  Search by student / exam / id…"
        style={{ width:"100%", boxSizing:"border-box", marginBottom:16,
          background:T.panel, border:`1.5px solid ${T.border}`, borderRadius:10,
          padding:"9px 16px", color:T.text, fontSize:13, outline:"none" }} />

      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
        {/* Header row */}
        <div style={row({ T, header:true })}>
          {["#","Student","Exam","Submitted","To grade","Status",""].map((h,i)=>(
            <span key={i} style={{ fontSize:10, color:T.muted, fontWeight:700,
              textTransform:"uppercase", letterSpacing:.8 }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding:48, textAlign:"center", color:T.muted }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:48, textAlign:"center", color:T.muted }}>
            No {tab} results
          </div>
        ) : filtered.map(r => (
          <div key={r.id} style={row({ T })}
            onMouseEnter={e => e.currentTarget.style.background = T.panel}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize:12, color:T.muted }}>#{r.id}</span>
            <div>
              <div style={{ fontSize:13, color:T.text, fontWeight:500 }}>{r.student?.name}</div>
              <div style={{ fontSize:11, color:T.muted }}>{r.student?.email}</div>
            </div>
            <div>
              <div style={{ fontSize:13, color:T.text }}>{r.exam?.title}</div>
              <div style={{ fontSize:11, color:T.muted }}>{r.exam?.examType}</div>
            </div>
            <div style={{ fontSize:12, color:T.muted }}>{formatDateTime(r.submittedAt)}</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {(r.manualQuestions ?? []).map(q => (
                <span key={q.id} style={{
                  fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:5,
                  background: q.isGraded ? "#4ade8018" : T.gold+"18",
                  color: q.isGraded ? "#4ade80" : T.gold,
                  border:`1px solid ${q.isGraded ? "#4ade8044" : T.gold+"44"}`,
                }}>
                  {CAT_ICON[q.category]} {q.level}{q.isGraded ? " ✓" : ""}
                </span>
              ))}
              {r.pendingCount > 0 && (
                <div style={{ fontSize:10, color:T.muted, width:"100%", marginTop:2 }}>
                  {r.pendingCount} remaining
                </div>
              )}
            </div>
            <StatusBadge status={r.gradingStatus} T={T} />
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button onClick={() => openResult(r)} style={primaryBtn(T)}>
                {r.gradingStatus === "completed" ? "👁 View" : "Grade →"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:12, color:T.muted, marginTop:10, textAlign:"right" }}>
        {filtered.length} result{filtered.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QuestionPanel
// ─────────────────────────────────────────────────────────────────────────────
function QuestionPanel({ q, answer, existingGrade, rubrics, feedback,
  onRubric, onFeedback, onSave, saving, readOnly, T }) {

  const defs     = q.content?.rubrics ?? [];
  const maxRaw   = defs.reduce((s, r) => s + r.maxScore, 0);
  const curRaw   = defs.reduce((s, r) => s + (Number(rubrics[r.id] ?? 0)), 0);
  const scaled   = maxRaw > 0 ? Math.round((curRaw / maxRaw) * q.points) : 0;
  const pct      = maxRaw > 0 ? Math.round((curRaw / maxRaw) * 100) : 0;
  const isVoice  = q.type?.startsWith("SPEAKING");

  return (
    <div style={{ maxWidth:820, margin:"0 auto" }}>
      {/* Question meta */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <span style={{ fontSize:12, fontWeight:700, color:T.gold,
          background:T.gold+"15", borderRadius:6, padding:"3px 10px" }}>
          {CAT_ICON[q.category]} {q.type?.replace(/_/g," ")}
        </span>
        <span style={{ fontSize:12, fontWeight:700,
          color:LEVEL_COLOR[q.level]||T.muted,
          background:(LEVEL_COLOR[q.level]||T.muted)+"15",
          borderRadius:6, padding:"3px 10px" }}>
          {q.level}
        </span>
        <span style={{ fontSize:12, color:T.muted }}>max {q.points} pts</span>
        {existingGrade && (
          <span style={{ fontSize:11, color:"#4ade80", background:"#4ade8015",
            borderRadius:6, padding:"3px 10px" }}>
            Previously: {existingGrade.scaledScore}/{q.points}
          </span>
        )}
      </div>

      {/* Context */}
      {q.contextText && (
        <div style={{ background:T.panel, border:`1px solid ${T.border}`,
          borderLeft:`4px solid ${T.gold}44`,
          borderRadius:12, padding:"12px 16px", marginBottom:14,
          fontSize:13, color:T.text, lineHeight:1.7 }}>
          <div style={{ fontSize:10, color:T.muted, fontWeight:700, letterSpacing:1,
            textTransform:"uppercase", marginBottom:6 }}>Context</div>
          {q.contextText}
        </div>
      )}

      {/* Media */}
      {(q.media ?? []).map((m, i) => <MediaBlock key={i} m={m} T={T} />)}

      {/* Prompt */}
      <div style={{ fontSize:16, color:T.text, fontWeight:500, lineHeight:1.6, marginBottom:20 }}>
        {q.prompt}
      </div>

      {/* Answer */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`,
        borderRadius:14, padding:20, marginBottom:24 }}>
        <div style={{ fontSize:10, color:T.gold, fontWeight:700,
          letterSpacing:1.2, textTransform:"uppercase", marginBottom:10 }}>
          Student Answer
        </div>
        {isVoice ? (
          answer
            ? <audio controls
                src={answer.startsWith("/voice/") ? `http://localhost:4000${answer}` : answer}
                style={{ width:"100%", borderRadius:8 }} />
            : <div style={{ color:T.muted, fontSize:13 }}>No recording submitted</div>
        ) : (
          <div style={{ color:T.text, fontSize:14, lineHeight:1.8,
            whiteSpace:"pre-wrap", minHeight:60 }}>
            {answer || <span style={{ color:T.muted }}>No answer submitted</span>}
          </div>
        )}
        {!isVoice && answer && (
          <div style={{ marginTop:8, fontSize:11, color:T.muted }}>
            {answer.trim().split(/\s+/).filter(Boolean).length} words
            {q.content?.minWords && ` · min ${q.content.minWords}`}
            {q.content?.maxWords && ` · max ${q.content.maxWords}`}
          </div>
        )}
      </div>

      {/* Rubric sliders */}
      <div style={{ background:T.panel, border:`1px solid ${T.border}`,
        borderRadius:14, padding:24, marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:22 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.muted,
            textTransform:"uppercase", letterSpacing:1 }}>Rubric Scores</div>
          {/* Score summary */}
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:T.muted }}>Raw</div>
              <div style={{ fontSize:18, fontWeight:800, color:T.text,
                fontFamily:"'DM Mono',monospace" }}>
                {curRaw}<span style={{ fontSize:11, color:T.muted }}>/{maxRaw}</span>
              </div>
            </div>
            <div style={{ width:1, height:30, background:T.border }} />
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:T.muted }}>Scaled</div>
              <div style={{ fontSize:18, fontWeight:800,
                color: pct>=70?"#4ade80":pct>=50?T.gold:"#f87171",
                fontFamily:"'DM Mono',monospace" }}>
                {scaled}<span style={{ fontSize:11, color:T.muted }}>/{q.points}</span>
              </div>
            </div>
            <ScoreRing pct={pct} T={T} />
          </div>
        </div>

        {defs.length === 0 ? (
          <div style={{ color:T.muted, fontSize:13 }}>No rubrics defined for this question.</div>
        ) : defs.map(r => {
          const val    = Number(rubrics[r.id] ?? 0);
          const rPct   = r.maxScore > 0 ? val/r.maxScore : 0;
          const trackC = rPct>=.7?"#4ade80":rPct>=.5?T.gold:"#f87171";
          return (
            <div key={r.id} style={{ marginBottom:22 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <label style={{ fontSize:13, color:T.text, fontWeight:500 }}>{r.label}</label>
                <span style={{ fontSize:13, fontWeight:800, color:trackC,
                  fontFamily:"'DM Mono',monospace" }}>{val} / {r.maxScore}</span>
              </div>
              {/* Tick marks */}
              <div style={{ display:"flex", justifyContent:"space-between",
                marginBottom:3, paddingInline:1 }}>
                {Array.from({ length: r.maxScore+1 }, (_,i) => (
                  <span key={i} style={{ fontSize:9, textAlign:"center", minWidth:14,
                    color: i===val ? trackC : T.muted,
                    fontWeight: i===val ? 800 : 400 }}>{i}</span>
                ))}
              </div>
              <input type="range" min={0} max={r.maxScore} step={1} value={val}
                disabled={readOnly}
                onChange={e => onRubric(r.id, Number(e.target.value))}
                style={{ width:"100%", accentColor:trackC, height:6,
                  cursor: readOnly ? "not-allowed" : "pointer" }} />
              <div style={{ display:"flex", justifyContent:"space-between",
                marginTop:3, paddingInline:1 }}>
                <span style={{ fontSize:9, color:T.muted }}>Poor</span>
                <span style={{ fontSize:9, color:T.muted }}>Excellent</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      <div style={{ marginBottom:24 }}>
        <label style={{ display:"block", fontSize:12, color:T.muted, fontWeight:600,
          textTransform:"uppercase", letterSpacing:.8, marginBottom:8 }}>
          Feedback <span style={{ fontWeight:400 }}>(optional)</span>
        </label>
        <textarea rows={4} value={feedback} disabled={readOnly}
          onChange={e => onFeedback(e.target.value)}
          placeholder="Write feedback for the student…"
          style={{ width:"100%", boxSizing:"border-box",
            background:T.card, border:`1.5px solid ${T.border}`,
            borderRadius:12, padding:"12px 14px", color:T.text,
            fontSize:13, lineHeight:1.6, resize:"vertical",
            outline:"none", fontFamily:"'DM Sans',sans-serif",
            opacity: readOnly ? .6 : 1 }} />
      </div>

      {!readOnly && (
        <button onClick={onSave} disabled={saving || defs.length===0}
          style={{ ...primaryBtn(T), width:"100%", padding:"13px 0", fontSize:14,
            opacity: saving ? .7 : 1 }}>
          {saving ? "Saving…" : `Save Grade  —  ${scaled} / ${q.points} pts`}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small components
// ─────────────────────────────────────────────────────────────────────────────

function GradingRing({ qs, grades, T }) {
  const total  = qs.length;
  const graded = qs.filter(q => grades[q.id]?.rawScore != null).length;
  const pct    = total > 0 ? Math.round((graded/total)*100) : 0;
  const r = 20, circ = 2*Math.PI*r;
  const color = pct===100 ? "#4ade80" : T.gold;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <svg width={52} height={52} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={26} cy={26} r={r} fill="none" stroke={T.border} strokeWidth={4} />
        <circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
          strokeLinecap="round" style={{ transition:"stroke-dashoffset .3s" }} />
      </svg>
      <div>
        <div style={{ fontSize:16, fontWeight:800, color:T.text,
          fontFamily:"'DM Mono',monospace", lineHeight:1 }}>{graded}/{total}</div>
        <div style={{ fontSize:10, color:T.muted }}>graded</div>
      </div>
    </div>
  );
}

function ScoreRing({ pct, T }) {
  const r = 16, circ = 2*Math.PI*r;
  const color = pct>=70?"#4ade80":pct>=50?"#f59e0b":"#f87171";
  return (
    <div style={{ position:"relative", width:40, height:40 }}>
      <svg width={40} height={40} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={20} cy={20} r={r} fill="none" stroke={T.border} strokeWidth={3.5} />
        <circle cx={20} cy={20} r={r} fill="none" stroke={color} strokeWidth={3.5}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
          strokeLinecap="round" style={{ transition:"stroke-dashoffset .2s" }} />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex",
        alignItems:"center", justifyContent:"center",
        fontSize:9, fontWeight:800, color,
        fontFamily:"'DM Mono',monospace" }}>{pct}%</div>
    </div>
  );
}

function StatusBadge({ status, T }) {
  const color = STATUS_COLOR[status] ?? T.muted;
  return (
    <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:8,
      color, background:color+"18", border:`1px solid ${color}44` }}>
      {status}
    </span>
  );
}

function MediaBlock({ m, T }) {
  if (m.type==="audio") return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:10, color:T.muted, fontWeight:700,
        textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Audio</div>
      <audio controls src={m.url} style={{ width:"100%", borderRadius:8 }} />
      {m.maxPlays && <div style={{ fontSize:10, color:T.muted, marginTop:4 }}>Max plays: {m.maxPlays}</div>}
    </div>
  );
  if (m.type==="video") return (
    <video controls src={m.url}
      style={{ width:"100%", borderRadius:8, maxHeight:240, marginBottom:12 }} />
  );
  if (m.type==="image") return (
    <img src={m.url} alt="" style={{ maxWidth:"100%", borderRadius:8, marginBottom:12 }} />
  );
  return null;
}

function Toast({ msg }) {
  return (
    <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background: msg.ok ? "#4ade8022" : "#ef444422",
      border:`1px solid ${msg.ok?"#4ade80":"#ef4444"}`,
      color: msg.ok?"#4ade80":"#ef4444",
      borderRadius:12, padding:"10px 22px", fontSize:13, fontWeight:600,
      backdropFilter:"blur(8px)", zIndex:1000 }}>
      {msg.ok?"✓ ":"✕ "}{msg.text}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function initRubrics(defs = []) {
  return Object.fromEntries(defs.map(r => [r.id, 0]));
}

async function apiFetch(path, method="GET", body=undefined) {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`http://localhost:3001${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization:`Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function row({ T, header=false }) {
  return {
    display:"grid",
    gridTemplateColumns:"56px 1fr 1fr 110px 160px 100px 80px",
    gap:14, alignItems:"center",
    padding:"12px 20px",
    borderBottom:`1px solid ${T.border}`,
    background: header ? T.panel : "transparent",
    transition:"background .15s",
  };
}

function primaryBtn(T) {
  return { padding:"9px 18px", borderRadius:10,
    background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,
    border:"none", color:"#fff", fontWeight:600, fontSize:13,
    cursor:"pointer", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" };
}
function secondaryBtn(T) {
  return { padding:"9px 18px", borderRadius:10,
    background:T.card, border:`1px solid ${T.border}`,
    color:T.text, fontWeight:500, fontSize:13,
    cursor:"pointer", fontFamily:"'DM Sans',sans-serif" };
}
function backBtn(T) {
  return { background:"none", border:"none", color:T.gold,
    fontSize:14, cursor:"pointer",
    fontFamily:"'DM Sans',sans-serif", fontWeight:600, padding:0 };
}
