import { useState, useEffect } from "react";
import { api } from "../api.js";

const GROUPS = ["Խ-101", "Խ-102", "Խ-103", "Խ-104"];

// Step 1: Student info → Step 2: Choose exams → Step 3: Success + PIN
export default function RegisterPage({ theme: T, onBack }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", group: "" });
  const [exams, setExams] = useState([]);
  const [selectedExams, setSelectedExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { student, assignments }

  // Load active exams when reaching step 2
  useEffect(() => {
    if (step === 2 && exams.length === 0) {
      setLoadingExams(true);
      api.getRegisterExams()
        .then(data => setExams(data))
        .catch(() => setError("Не удалось загрузить список экзаменов"))
        .finally(() => setLoadingExams(false));
    }
  }, [step]);

  const handleField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const goToStep2 = () => {
    setError("");
    if (!form.name.trim()) return setError("Введите имя");
    if (!form.email.trim() || !form.email.includes("@")) return setError("Введите корректный email");
    setStep(2);
  };

  const toggleExam = (id) => {
    setSelectedExams(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const handleSubmit = async () => {
    setError("");
    if (selectedExams.length === 0) return setError("Выберите хотя бы один экзамен");
    setSubmitting(true);
    try {
      const data = await api.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        group: form.group || undefined,
        examIds: selectedExams,
      });
      setResult(data);
      setStep(3);
    } catch (e) {
      setError(e.message || "Ошибка регистрации");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setForm({ name: "", email: "", phone: "", group: "" });
    setSelectedExams([]);
    setResult(null);
    setError("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: `linear-gradient(135deg,${T.gold},${T.goldDim})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 28,
            color: "white", margin: "0 auto 16px",
          }}>Հ</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: T.text, fontWeight: 700, marginBottom: 6 }}>
            ArmExam
          </h1>
          <p style={{ color: T.muted, fontSize: 14 }}>Регистрация на экзамен</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 28 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: step >= s ? T.gold : T.border,
                color: step >= s ? "white" : T.muted,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 600, transition: "all .2s",
              }}>{s === 3 && step === 3 ? "✓" : s}</div>
              {s < 3 && <div style={{ width: 40, height: 2, background: step > s ? T.gold : T.border, transition: "all .3s" }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: T.panel,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 8px 32px rgba(0,0,0,.18)",
        }}>

          {/* ── STEP 1: Student info ── */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 18, color: T.text, fontWeight: 600, marginBottom: 24 }}>
                Ваши данные
              </h2>
              <Field label="Полное имя *" error={error && !form.name.trim() ? error : ""}>
                <input
                  value={form.name}
                  onChange={e => handleField("name", e.target.value)}
                  placeholder="Иван Иванов"
                  style={inputStyle(T)}
                  onKeyDown={e => e.key === "Enter" && goToStep2()}
                />
              </Field>
              <Field label="Email *">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => handleField("email", e.target.value)}
                  placeholder="ivan@example.com"
                  style={inputStyle(T)}
                  onKeyDown={e => e.key === "Enter" && goToStep2()}
                />
              </Field>
              <Field label="Телефон">
                <input
                  value={form.phone}
                  onChange={e => handleField("phone", e.target.value)}
                  placeholder="+7 999 123-45-67"
                  style={inputStyle(T)}
                />
              </Field>
              <Field label="Группа">
                <select value={form.group} onChange={e => handleField("group", e.target.value)} style={inputStyle(T)}>
                  <option value="">— не выбрана —</option>
                  {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>

              {error && <p style={{ color: T.danger, fontSize: 13, marginBottom: 16 }}>{error}</p>}

              <button onClick={goToStep2} style={primaryBtn(T)}>
                Далее — выбор экзаменов →
              </button>
            </>
          )}

          {/* ── STEP 2: Choose exams ── */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: 18, color: T.text, fontWeight: 600, marginBottom: 6 }}>
                Выберите экзамены
              </h2>
              <p style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>
                Отметьте экзамены, в которых хотите участвовать
              </p>

              {loadingExams ? (
                <div style={{ textAlign: "center", color: T.muted, padding: "32px 0" }}>Загрузка...</div>
              ) : exams.length === 0 ? (
                <div style={{ textAlign: "center", color: T.muted, padding: "32px 0", fontSize: 14 }}>
                  Нет доступных экзаменов
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {exams.map(exam => {
                    const selected = selectedExams.includes(exam.id);
                    return (
                      <div
                        key={exam.id}
                        onClick={() => toggleExam(exam.id)}
                        style={{
                          border: `1.5px solid ${selected ? T.gold : T.border}`,
                          borderRadius: 12,
                          padding: "14px 16px",
                          cursor: "pointer",
                          background: selected ? T.gold + "11" : T.card,
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          transition: "all .15s",
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 20, height: 20, borderRadius: 6,
                          border: `2px solid ${selected ? T.gold : T.border2}`,
                          background: selected ? T.gold : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, transition: "all .15s",
                          fontSize: 12, color: "white",
                        }}>
                          {selected ? "✓" : ""}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: T.text, fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
                            {exam.title}
                          </div>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {exam.level && <Tag T={T} color={T.info}>{exam.level}</Tag>}
                            <Tag T={T} color={T.muted}>{exam.examType === "placement" ? "Placement" : "Fixed"}</Tag>
                            <Tag T={T} color={T.muted}>{exam.duration} мин</Tag>
                            {exam.startDate && <Tag T={T} color={T.warning}>{fmtDate(exam.startDate)}</Tag>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {error && <p style={{ color: T.danger, fontSize: 13, marginBottom: 16 }}>{error}</p>}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setStep(1); setError(""); }} style={secondaryBtn(T)}>
                  ← Назад
                </button>
                <button onClick={handleSubmit} disabled={submitting || selectedExams.length === 0} style={primaryBtn(T, submitting || selectedExams.length === 0)}>
                  {submitting ? "Регистрация..." : `Зарегистрироваться (${selectedExams.length})`}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Success + PIN ── */}
          {step === 3 && result && (
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <h2 style={{ fontSize: 20, color: T.text, fontWeight: 700, marginBottom: 6 }}>
                  Регистрация успешна!
                </h2>
                <p style={{ color: T.muted, fontSize: 14 }}>
                  {result.student.name}, сохраните ваши PIN-коды для входа на экзамен
                </p>
              </div>

              {/* Student info */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ color: T.muted, fontSize: 11, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Данные студента</div>
                <Row label="Имя" value={result.student.name} T={T} />
                <Row label="Email" value={result.student.email} T={T} />
                {result.student.phone && <Row label="Телефон" value={result.student.phone} T={T} />}
                {result.student.group && <Row label="Группа" value={result.student.group} T={T} />}
              </div>

              {/* PIN codes per exam */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ color: T.muted, fontSize: 11, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Ваши PIN-коды</div>
                {result.assignments.map(a => (
                  <div key={a.examId} style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}>
                    <div>
                      <div style={{ color: T.text, fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
                        {a.examTitle}
                      </div>
                      {a.alreadyRegistered && (
                        <div style={{ color: T.warning, fontSize: 11 }}>Вы уже были зарегистрированы</div>
                      )}
                    </div>
                    <div style={{
                      background: `linear-gradient(135deg,${T.gold}22,${T.goldDim}11)`,
                      border: `1.5px solid ${T.gold}55`,
                      borderRadius: 10,
                      padding: "8px 16px",
                      fontFamily: "monospace",
                      fontSize: 22,
                      fontWeight: 700,
                      color: T.gold,
                      letterSpacing: 4,
                      userSelect: "all",
                    }}>
                      {a.pin}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: T.gold + "11", border: `1px solid ${T.gold}33`, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: T.textSub, marginBottom: 20, lineHeight: 1.6 }}>
                Запишите или сфотографируйте PIN-коды. Они понадобятся для входа в систему перед экзаменом.
              </div>

              <button onClick={reset} style={secondaryBtn(T)}>
                Зарегистрировать другого студента
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, children, error }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, color: "#7a84a0", marginBottom: 6, fontWeight: 500 }}>{label}</label>
      {children}
      {error && <p style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function Tag({ T, color, children }) {
  return (
    <span style={{ fontSize: 11, color, background: color + "18", borderRadius: 5, padding: "2px 6px" }}>{children}</span>
  );
}

function Row({ label, value, T }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: T.muted, minWidth: 70 }}>{label}:</span>
      <span style={{ color: T.text }}>{value}</span>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

function inputStyle(T) {
  return {
    width: "100%",
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: "10px 14px",
    color: T.text,
    fontSize: 14,
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
  };
}

function primaryBtn(T, disabled = false) {
  return {
    width: "100%",
    padding: "12px 0",
    borderRadius: 10,
    background: disabled ? T.border : `linear-gradient(135deg,${T.gold},${T.goldDim})`,
    border: "none",
    color: "white",
    fontWeight: 600,
    fontSize: 14,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all .15s",
  };
}

function secondaryBtn(T) {
  return {
    width: "100%",
    padding: "12px 0",
    borderRadius: 10,
    background: "transparent",
    border: `1px solid ${T.border}`,
    color: T.textSub,
    fontWeight: 500,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  };
}
