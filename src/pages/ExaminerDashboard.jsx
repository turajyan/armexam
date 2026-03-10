import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { api } from "../api.js";
import { formatDateTime } from "../dateUtils.js";

const STATUS_COLOR = { approved: "#4cc98a", partial: "#c9a84c", declined: "#c94c6f" };

export default function ExaminerDashboard({ theme: T }) {
  const { t } = useTranslation();
  const STATUS_LABEL = {
    approved: t("adm.e.approved"),
    partial: t("adm.e.partial"),
    declined: t("adm.e.declined"),
  };

  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("pending"); // pending | graded | auto
  const [pending, setPending] = useState([]);
  const [graded, setGraded] = useState([]);
  const [auto, setAuto] = useState([]);
  const [centers, setCenters] = useState([]);
  const [centerFilter, setCenterFilter] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedMode, setSelectedMode] = useState("grade"); // grade | view
  const [activeQIdx, setActiveQIdx] = useState(0);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveOk, setSaveOk] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, p, c] = await Promise.all([api.getGradingStats(), api.getGradingPending(), api.getAllCenters()]);
      setStats(s);
      setPending(p);
      setCenters(c || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (tab === "graded") {
      api.getGradingGraded({ take: 200, centerId: centerFilter })
        .then(setGraded)
        .catch(e => setError(e.message));
    } else if (tab === "auto") {
      api.getGradingAuto({ take: 200, centerId: centerFilter })
        .then(setAuto)
        .catch(e => setError(e.message));
    }
  }, [tab, centerFilter]);

  // Persist grading drafts locally so examiner doesn't lose work on refresh/close
  useEffect(() => {
    if (!selected) return;
    const key = `armexam_grades_${selected.id}`;
    try {
      localStorage.setItem(key, JSON.stringify(grades));
    } catch {
      // ignore storage errors
    }
  }, [grades, selected]);

  const openResult = async (r, mode = "grade") => {
    setError("");
    setSaveOk(false);
    try {
      const full = await api.getGradingResult(r.id);
      setSelected(full);
      setSelectedMode(mode);
      setActiveQIdx(0);

      // Only hydrate grades from existing manualGrades or local drafts.
      // Вопросы без ручной оценки остаются пустыми, чтобы их нужно было заполнить явно.
      let merged = {};
      for (const q of full.gradableQuestions ?? []) {
        const prev = full.manualGrades?.[q.id];
        if (prev) {
          merged[q.id] = {
            earnedPoints: prev.earnedPoints,
            status: prev.status,
            notes: prev.notes ?? "",
          };
        }
      }

      // Try to restore local draft if it exists
      try {
        const raw = localStorage.getItem(`armexam_grades_${full.id}`);
        if (raw) {
          const draft = JSON.parse(raw);
          if (draft && typeof draft === "object") {
            merged = { ...merged, ...draft };
          }
        }
      } catch {
        // ignore draft errors
      }

      setGrades(merged);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSubmit = async () => {
    if (!selected) return;

    // Frontend validation: все вопросы должны иметь выставленные баллы и статус
    const questions = selected.gradableQuestions ?? [];
    const missing = [];
    for (const q of questions) {
      const g = grades[q.id];
      const hasStatus = g && ["approved", "partial", "declined"].includes(g.status);
      const hasPoints = g && typeof g.earnedPoints === "number" && !Number.isNaN(g.earnedPoints);
      if (!hasStatus || !hasPoints) {
        missing.push(q.id);
      }
    }
    if (missing.length > 0) {
      setError(t("adm.e.must_grade_all") || "Пожалуйста, оцените все вопросы перед завершением.");
      return;
    }

    setSaving(true); setSaveOk(false); setError("");
    try {
      await api.submitGrades(selected.id, grades);
      setSaveOk(true);
      try { localStorage.removeItem(`armexam_grades_${selected.id}`); } catch {}
      setSelected(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const setGrade = (qId, field, value) => {
    // При любом изменении оценки очищаем предыдущую ошибку,
    // чтобы не висело сообщение после исправления.
    setError("");
    setGrades(prev => ({ ...prev, [qId]: { ...prev[qId], [field]: value } }));
  };

  const progress = useMemo(() => {
    if (!selected) return 0;
    const total = selected.gradableQuestions?.length || 0;
    if (!total) return 0;
    let graded = 0;
    for (const q of selected.gradableQuestions ?? []) {
      const g = grades[q.id];
      if (!g) continue;
      const hasStatus = ["approved", "partial", "declined"].includes(g.status);
      const hasPoints = typeof g.earnedPoints === "number" && !Number.isNaN(g.earnedPoints);
      if (hasStatus && hasPoints) graded += 1;
    }
    return Math.round((graded / total) * 100);
  }, [grades, selected]);

  if (loading) return <Pad T={T}>{t("adm.loading")}</Pad>;

  // ── Result detail view (Focus Mode) ─────────────────────────────────────────
  if (selected) {
    const questions = selected.gradableQuestions ?? [];
    const currentQ = questions[activeQIdx] ?? null;
    const answer = currentQ ? selected.answers?.[currentQ.id] : null;
    const rawGrade = currentQ ? grades[currentQ.id] : null;
    const g = currentQ
      ? (rawGrade || { earnedPoints: "", status: undefined, notes: "" })
      : {};
    const readOnly = selectedMode === "view";

    return (
      <>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "'DM Sans',sans-serif" }}>
        {/* Header with progress */}
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => setSelected(null)} style={backBtn(T)}>← {t("adm.back")}</button>
          <div style={{ flex: 1, marginLeft: 16 }}>
            <div style={{ fontSize: 14, color: T.text, fontWeight: 600 }}>
              {selected.exam?.title}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
              {t("adm.e.student")}: {selected.student?.name} ({selected.student?.email})
            </div>
          </div>
          <div style={{ textAlign: "right", minWidth: 220 }}>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>
              {t("adm.e.progress_label", { pct: progress })}
            </div>
            <div style={{ width: "100%", height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: T.gold, transition: "width 0.25s ease-out" }} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left: question navigation */}
          <div style={{ width: 280, borderRight: `1px solid ${T.border}`, overflowY: "auto", background: T.panel + "44" }}>
            {questions.map((q, idx) => (
              <div
                key={q.id}
                onClick={() => setActiveQIdx(idx)}
                style={{
                  padding: "14px 18px",
                  cursor: "pointer",
                  borderBottom: `1px solid ${T.border}`,
                  background: activeQIdx === idx ? T.gold + "11" : "transparent",
                  borderLeft: `4px solid ${activeQIdx === idx ? T.gold : "transparent"}`,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 4 }}>
                  {t("adm.e.question_short")} {idx + 1}
                </div>
                <div style={{ fontSize: 13, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {q.text}
                </div>
              </div>
            ))}
          </div>

          {/* Right: active question content */}
          <div style={{ flex: 1, padding: 32, overflowY: "auto" }}>
            {currentQ ? (
              <div style={{ maxWidth: 840, margin: "0 auto" }}>
                <div style={{ marginBottom: 24 }}>
                  <span style={badgeSt(T)}>
                    {currentQ.type === "voice" ? "Speaking" : "Writing"} · {currentQ.level} · max {currentQ.points} {t("adm.e.points_unit")}
                  </span>
                  <h3 style={{ fontSize: 18, color: T.text, marginTop: 12, lineHeight: 1.5 }}>{currentQ.text}</h3>
                </div>

                <div style={answerContainer(T)}>
                  <div style={{ color: T.gold, fontSize: 11, fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>
                    {t("adm.e.student_answer").toUpperCase()}
                  </div>
                  {currentQ.type === "voice" ? (
                    answer
                      ? <audio controls src={answer} style={{ width: "100%" }} />
                      : <p style={{ color: T.muted }}>{t("adm.e.no_audio")}</p>
                  ) : (
                    <p style={{ color: T.text, lineHeight: 1.8, whiteSpace: "pre-wrap", fontSize: 15 }}>
                      {answer || t("adm.e.no_answer")}
                    </p>
                  )}
                </div>

                <div style={{ background: T.panel, padding: 24, borderRadius: 16, border: `1px solid ${T.border}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                    <div>
                      <label style={labelSt(T)}>{t("adm.e.earned_score")}</label>
                      <input
                        type="number"
                        min={0}
                        max={currentQ.points}
                        value={g.earnedPoints}
                        disabled={readOnly}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === "") {
                            setGrade(currentQ.id, "earnedPoints", "");
                          } else {
                            const num = Number(v);
                            const clamped = Math.min(currentQ.points, Math.max(0, Number.isNaN(num) ? 0 : num));
                            setGrade(currentQ.id, "earnedPoints", clamped);
                          }
                        }}
                        style={inputSt(T)}
                      />
                    </div>
                    <div>
                      <label style={labelSt(T)}>{t("adm.e.decision")}</label>
                      <div style={{ display: "flex", gap: 4, background: T.card, padding: 4, borderRadius: 10 }}>
                        {Object.entries(STATUS_LABEL).map(([val, lbl]) => (
                          <button
                            key={val}
                            onClick={readOnly ? undefined : () => setGrade(currentQ.id, "status", val)}
                            style={segmentBtn(val, g.status, T)}
                            disabled={readOnly}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <label style={labelSt(T)}>{t("adm.e.comment")}</label>
                  <textarea
                    rows={3}
                    value={g.notes}
                    disabled={readOnly}
                    onChange={e => setGrade(currentQ.id, "notes", e.target.value)}
                    placeholder={t("adm.e.optional_placeholder")}
                    style={{ ...inputSt(T), resize: "none", minHeight: 80 }}
                  />
                </div>

                <div style={{ marginTop: 28 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <button
                      disabled={activeQIdx === 0}
                      onClick={() => setActiveQIdx(v => Math.max(0, v - 1))}
                      style={secondaryBtn(T)}
                    >
                      ← {t("adm.prev")}
                    </button>

                    {readOnly ? (
                      <button onClick={() => setSelected(null)} style={primaryBtn(T)}>
                        {t("adm.close") || "Close"}
                      </button>
                    ) : activeQIdx === questions.length - 1 ? (
                      <button onClick={handleSubmit} disabled={saving} style={primaryBtn(T)}>
                        {saving ? t("adm.saving") : t("adm.e.complete_grading")}
                      </button>
                    ) : (
                      <button onClick={() => setActiveQIdx(v => Math.min(questions.length - 1, v + 1))} style={primaryBtn(T)}>
                        {t("adm.next")} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: T.muted }}>{t("adm.e.select_question")}</div>
            )}
          </div>
        </div>
      </div>
      {error && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#00000092",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={e => {
            if (e.target === e.currentTarget) setError("");
          }}
        >
          <div
            style={{
              background: T.panel,
              border: `1px solid ${T.border}`,
              borderRadius: 18,
              padding: "18px 20px",
              width: "100%",
              maxWidth: 520,
              boxShadow: "0 32px 80px #000000bb",
              position: "relative",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.danger }}>
                {t("adm.e.error_title") || "Не удалось завершить проверку"}
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                style={{
                  background: "transparent",
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  color: T.muted,
                  fontSize: 16,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: 13, color: T.text }}>
              {error}
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  // ── List view ───────────────────────────────────────────────────────────────
  const list = tab === "pending" ? pending : tab === "graded" ? graded : auto;
  const filtered = list.filter(r => {
    if (centerFilter && r.exam?.examCenterId !== centerFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(r.id).includes(q) ||
      (r.exam?.title || "").toLowerCase().includes(q) ||
      (r.student?.name || "").toLowerCase().includes(q) ||
      (r.student?.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", minWidth: 0, width: "100%", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: T.text, margin: "0 0 4px", fontWeight: 600 }}>
            {t("adm.e.title") || "Examiner Dashboard"}
          </h1>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.muted, margin: 0 }}>
            {t("adm.e.subtitle") || "Manual grading · Writing & Speaking"}
          </p>
        </div>
        <button onClick={load} style={{ background: "transparent", border: `1px solid ${T.border2 || T.border}`, borderRadius: 10, padding: "10px 18px", color: T.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer" }}>
          ↻ {t("adm.refresh") || "Refresh"}
        </button>
      </div>

      {/* Stats - clickable filters */}
      {stats && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <StatCard 
              label={t("adm.e.pending")} 
              value={stats.pending} 
              color={T.gold} 
              T={T}
              active={tab === "pending"}
              onClick={() => setTab("pending")}
            />
            <StatCard 
              label={t("adm.e.graded")} 
              value={stats.graded} 
              color={STATUS_COLOR.approved} 
              T={T}
              active={tab === "graded"}
              onClick={() => setTab("graded")}
            />
            <StatCard 
              label={t("adm.e.auto")} 
              value={stats.auto} 
              color={T.muted} 
              T={T}
              active={tab === "auto"}
              onClick={() => setTab("auto")}
            />
          </div>
        </div>
      )}

      {error && <div style={errorBox(T)}>{error}</div>}
      {saveOk && <div style={successBox(T)}>{t("adm.e.saved_success")}</div>}

      {/* Filters */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t("adm.e.search_placeholder") || "🔍  Search by exam / student / id..."}
          style={{ flex: "1 1 240px", background: T.panel, border: `1.5px solid ${T.border2 || T.border}`, borderRadius: 9, padding: "8px 14px", color: T.text, fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none" }}
        />
        {centers.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
            <Pill
              label="All Centers"
              active={centerFilter === null}
              onClick={() => setCenterFilter(null)}
              color={T.muted}
              T={T}
            />
            {centers.slice(0, 5).map(c => (
              <Pill
                key={c.id}
                label={c.name}
                active={centerFilter === c.id}
                onClick={() => setCenterFilter(c.id)}
                color={T.muted}
                T={T}
              />
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 1fr 140px 130px", gap: 14, padding: "11px 20px", borderBottom: `1px solid ${T.border}`, background: T.panel }}>
          {["#", t("adm.e.exam") || "Exam", t("adm.e.student") || "Student", t("adm.e.submitted_at") || "Submitted", ""].map((h, i) => (
            <span key={i} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.muted }}>
            {t("adm.loading") || "Loading…"}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: T.muted }}>
            {tab === "pending" ? (t("adm.e.no_pending") || "No pending results") : tab === "graded" ? (t("adm.e.no_graded") || "No graded results") : (t("adm.e.no_auto") || "No auto-graded results")}
          </div>
        ) : (
          filtered.map(r => (
            <div
              key={r.id}
              style={{ display: "grid", gridTemplateColumns: "70px 1fr 1fr 140px 130px", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: `1px solid ${T.border}`, transition: "background .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = T.panel; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.muted, fontWeight: 500 }}>#{r.id}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.text, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.exam?.title}
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.muted }}>
                  {r.exam?.examType || ""}
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.student?.name}
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.student?.email}
                </div>
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.muted }}>
                {formatDateTime(r.submittedAt)}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                {tab === "pending" ? (
                  <button onClick={() => openResult(r, "grade")} style={primaryBtn(T)}>
                    {t("adm.e.start_grade") || "Grade"}
                  </button>
                ) : (
                  <button onClick={() => openResult(r, "view")} style={secondaryBtn(T)}>
                    👁 {t("adm.view") || "View"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: T.muted, marginTop: 12, textAlign: "right" }}>
        {filtered.length} / {list.length}
      </div>
    </div>
  );
}

// ── Styled helpers ───────────────────────────────────────────────────────────

function Pad({ T, children }) {
  return <div style={{ padding: 40, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>{children}</div>;
}

function inputSt(T) {
  return {
    width: "100%",
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: "8px 12px",
    color: T.text,
    fontSize: 14,
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
  };
}

const labelSt = (T) => ({
  display: "block",
  fontSize: 12,
  color: T.muted,
  marginBottom: 5,
  fontWeight: 500,
});

const errorBox = (T) => ({
  background: T.danger + "18",
  border: `1px solid ${T.danger}44`,
  borderRadius: 8,
  padding: "8px 12px",
  color: T.danger,
  fontSize: 13,
  marginBottom: 16,
});

const successBox = (T) => ({
  background: "#4cc98a18",
  border: "1px solid #4cc98a44",
  borderRadius: 8,
  padding: "8px 12px",
  color: "#4cc98a",
  fontSize: 13,
  marginBottom: 16,
});

function Pill({ label, active, onClick, color, T }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? (color + "22") : "transparent",
        border: `1px solid ${active ? color : T.border}`,
        borderRadius: 8,
        padding: "5px 14px",
        color: active ? color : T.muted,
        fontFamily: "'DM Sans',sans-serif",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all .15s",
      }}
    >
      {label}
    </button>
  );
}

function primaryBtn(T) {
  return {
    padding: "9px 18px",
    borderRadius: 10,
    background: `linear-gradient(135deg,${T.gold},${T.goldDim})`,
    border: "none",
    color: "white",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
  };
}

function secondaryBtn(T) {
  return {
    padding: "9px 18px",
    borderRadius: 10,
    background: T.card,
    border: `1px solid ${T.border}`,
    color: T.text,
    fontWeight: 500,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  };
}

function backBtn(T) {
  return {
    background: "none",
    border: "none",
    color: T.gold,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "'DM Sans',sans-serif",
    fontWeight: 600,
    padding: 0,
  };
}

const StatCard = ({ label, value, color, T, active, onClick }) => (
  <div 
    onClick={onClick}
    style={{ 
      background: active ? color + "18" : T.panel, 
      border: `1px solid ${active ? color : T.border}`, 
      borderRadius: 16, 
      padding: 20, 
      cursor: onClick ? "pointer" : "default",
      transition: "all .15s",
    }}
  >
    <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, textTransform: "uppercase", marginTop: 4 }}>
      {label}
    </div>
  </div>
);

const badgeSt = (T) => ({
  background: T.gold + "15",
  color: T.gold,
  borderRadius: 6,
  padding: "4px 10px",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
});

const answerContainer = (T) => ({
  background: T.card,
  borderRadius: 16,
  padding: 24,
  marginBottom: 24,
  border: `1px solid ${T.border}`,
  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
});

const segmentBtn = (val, current, T) => {
  const color = STATUS_COLOR[val];
  const active = current === val;
  return {
    flex: 1,
    padding: "8px 0",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    border: `1px solid ${color}66`,
    background: active ? color : T.card,
    color: active ? "#ffffff" : color,
    cursor: "pointer",
    transition: "background 0.15s ease-out, color 0.15s ease-out, transform 0.05s ease-out",
  };
};

const listRow = (T) => ({
  padding: "16px 20px",
  borderBottom: `1px solid ${T.border}`,
  display: "flex",
  alignItems: "center",
  gap: 16,
});
