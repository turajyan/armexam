import { useState, useEffect } from "react";
import { api } from "../api.js";
import { formatDateTime } from "../dateUtils.js";

const STATUS_LABEL = { approved: "Принято", partial: "Частично", declined: "Отклонено" };
const STATUS_COLOR = { approved: "#4cc98a", partial: "#c9a84c", declined: "#c94c6f" };

export default function ExaminerDashboard({ theme: T }) {
  const [stats,    setStats]    = useState(null);
  const [pending,  setPending]  = useState([]);
  const [selected, setSelected] = useState(null); // full result for grading
  const [grades,   setGrades]   = useState({});   // { [questionId]: { earnedPoints, status, notes } }
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [saveOk,   setSaveOk]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([api.getGradingStats(), api.getGradingPending()]);
      setStats(s);
      setPending(p);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openResult = async (r) => {
    setError("");
    setSaveOk(false);
    try {
      const full = await api.getGradingResult(r.id);
      setSelected(full);
      // Pre-fill with existing grades if any
      const init = {};
      for (const q of full.gradableQuestions) {
        const prev = full.manualGrades?.[q.id];
        init[q.id] = {
          earnedPoints: prev?.earnedPoints ?? q.points,
          status:       prev?.status       ?? "approved",
          notes:        prev?.notes        ?? "",
        };
      }
      setGrades(init);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSubmit = async () => {
    setSaving(true); setSaveOk(false); setError("");
    try {
      await api.submitGrades(selected.id, grades);
      setSaveOk(true);
      setSelected(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const setGrade = (qId, field, value) => {
    setGrades(prev => ({ ...prev, [qId]: { ...prev[qId], [field]: value } }));
  };

  if (loading) return <Pad T={T}>Загрузка...</Pad>;

  // ── Result detail view ──────────────────────────────────────────────────────
  if (selected) {
    const questions = selected.gradableQuestions ?? [];
    const answers   = selected.answers ?? {};
    return (
      <div style={{ padding: 24, overflow: "auto", height: "100%", fontFamily: "'DM Sans',sans-serif" }}>
        <button onClick={() => setSelected(null)} style={backBtn(T)}>← Назад</button>

        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, color: T.text, fontWeight: 600 }}>
            {selected.exam?.title}
          </h2>
          <p style={{ fontSize: 13, color: T.muted }}>
            Студент: {selected.student?.name} ({selected.student?.email})
          </p>
        </div>

        {error && <div style={errorBox(T)}>{error}</div>}

        {questions.length === 0 && (
          <div style={{ color: T.muted, fontSize: 14 }}>Нет ответов, требующих ручной проверки.</div>
        )}

        {questions.map((q, idx) => {
          const answer = answers[q.id];
          const g      = grades[q.id] ?? { earnedPoints: q.points, status: "approved", notes: "" };
          return (
            <div key={q.id} style={{
              background: T.panel, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: 20, marginBottom: 16,
            }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{
                  background: T.gold + "22", color: T.gold,
                  borderRadius: 8, padding: "2px 8px", fontSize: 11, fontWeight: 600, flexShrink: 0,
                }}>
                  #{idx + 1} · {q.type === "voice" ? "Speaking" : "Writing"} · {q.level} · {q.points} балл
                </span>
              </div>
              <p style={{ fontSize: 14, color: T.text, marginBottom: 14, lineHeight: 1.6 }}>{q.text}</p>

              <div style={{
                background: T.card, borderRadius: 10, padding: 14, marginBottom: 16,
                border: `1px solid ${T.border}`, fontSize: 13,
              }}>
                <div style={{ color: T.muted, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
                  ОТВЕТ СТУДЕНТА
                </div>
                {q.type === "voice" ? (
                  answer
                    ? <audio controls src={answer} style={{ width: "100%" }} />
                    : <span style={{ color: T.muted }}>Аудио не записано</span>
                ) : (
                  <p style={{ color: T.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {answer || <span style={{ color: T.muted }}>Ответ отсутствует</span>}
                  </p>
                )}
              </div>

              {/* Grade controls */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={labelSt(T)}>Баллы (макс. {q.points})</label>
                  <input
                    type="number" min={0} max={q.points}
                    value={g.earnedPoints}
                    onChange={e => setGrade(q.id, "earnedPoints", Math.min(q.points, Math.max(0, Number(e.target.value))))}
                    style={inputSt(T)}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label style={labelSt(T)}>Решение</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {Object.entries(STATUS_LABEL).map(([val, lbl]) => (
                      <button
                        key={val}
                        onClick={() => setGrade(q.id, "status", val)}
                        style={{
                          flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          border: `1.5px solid ${g.status === val ? STATUS_COLOR[val] : T.border}`,
                          background: g.status === val ? STATUS_COLOR[val] + "22" : "transparent",
                          color: g.status === val ? STATUS_COLOR[val] : T.muted,
                          cursor: "pointer",
                        }}
                      >{lbl}</button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 2, minWidth: 180 }}>
                  <label style={labelSt(T)}>Комментарий</label>
                  <input
                    type="text"
                    value={g.notes}
                    onChange={e => setGrade(q.id, "notes", e.target.value)}
                    placeholder="Необязательно..."
                    style={inputSt(T)}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {questions.length > 0 && (
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button onClick={() => setSelected(null)} style={secondaryBtn(T)}>Отмена</button>
            <button onClick={handleSubmit} disabled={saving} style={{ ...primaryBtn(T), flex: 1 }}>
              {saving ? "Сохранение..." : "Сохранить оценки"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── List view ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, overflow: "auto", height: "100%", fontFamily: "'DM Sans',sans-serif" }}>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, color: T.text, fontWeight: 600, marginBottom: 12 }}>Кабинет экзаменатора</h2>

        {/* Stats */}
        {stats && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { label: "Ожидают проверки", value: stats.pending, color: T.gold },
              { label: "Проверено",         value: stats.graded,  color: "#4cc98a" },
              { label: "Автопроверка",      value: stats.auto,    color: T.muted },
            ].map(s => (
              <div key={s.label} style={{
                background: T.panel, border: `1px solid ${T.border}`,
                borderRadius: 12, padding: "14px 20px", flex: 1, minWidth: 140,
              }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div style={errorBox(T)}>{error}</div>}
      {saveOk && <div style={{ ...errorBox(T), background: "#4cc98a18", borderColor: "#4cc98a44", color: "#4cc98a" }}>Оценки сохранены</div>}

      <h3 style={{ fontSize: 15, color: T.text, fontWeight: 600, marginBottom: 14 }}>
        Требуют проверки ({pending.length})
      </h3>

      {pending.length === 0 && (
        <div style={{ color: T.muted, fontSize: 14, padding: "20px 0" }}>Нет работ, ожидающих проверки.</div>
      )}

      {pending.map(r => (
        <div key={r.id} style={{
          background: T.panel, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "16px 20px", marginBottom: 10,
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2 }}>
              {r.exam?.title}
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>
              {r.student?.name} · {r.student?.email}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
              Сдано: {formatDateTime(r.submittedAt)}
            </div>
          </div>
          <button onClick={() => openResult(r)} style={primaryBtn(T)}>
            Проверить →
          </button>
        </div>
      ))}
    </div>
  );
}

function Pad({ T, children }) {
  return <div style={{ padding: 40, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>{children}</div>;
}

function inputSt(T) {
  return {
    width: "100%", background: T.card, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "8px 12px", color: T.text, fontSize: 14,
    outline: "none", fontFamily: "'DM Sans', sans-serif",
  };
}
const labelSt = (T) => ({ display: "block", fontSize: 12, color: T.muted, marginBottom: 5, fontWeight: 500 });
const errorBox = (T) => ({
  background: T.danger + "18", border: `1px solid ${T.danger}44`,
  borderRadius: 8, padding: "8px 12px", color: T.danger, fontSize: 13, marginBottom: 16,
});
function primaryBtn(T) {
  return {
    padding: "9px 18px", borderRadius: 10,
    background: `linear-gradient(135deg,${T.gold},${T.goldDim})`,
    border: "none", color: "white", fontWeight: 600, fontSize: 13,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
  };
}
function secondaryBtn(T) {
  return {
    padding: "9px 18px", borderRadius: 10,
    background: T.card, border: `1px solid ${T.border}`,
    color: T.text, fontWeight: 500, fontSize: 13,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  };
}
function backBtn(T) {
  return {
    background: "none", border: "none", color: T.gold,
    fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
    fontWeight: 600, padding: 0, marginBottom: 20,
  };
}
