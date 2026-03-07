import { useState, useEffect } from "react";
import { api } from "../api.js";
import { formatDate } from "../dateUtils.js";

// Steps: city → center → exam → pin
export default function ExamRegistrationPage({ theme: T, onBack, onDone }) {
  const [step, setStep]       = useState(1); // 1=city, 2=center, 3=exams, 4=pin
  const [cities, setCities]   = useState([]);
  const [centers, setCenters] = useState([]);
  const [exams, setExams]     = useState([]);
  const [city, setCity]       = useState(null);
  const [center, setCenter]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [pinResult, setPinResult] = useState(null); // { pin, examTitle }

  // Load cities on mount
  useEffect(() => {
    setLoading(true);
    api.getCities()
      .then(data => setCities(data))
      .catch(() => setError("Не удалось загрузить список городов"))
      .finally(() => setLoading(false));
  }, []);

  const selectCity = async (c) => {
    setCity(c);
    setError("");
    setLoading(true);
    try {
      const data = await api.getCenters(c.id);
      setCenters(data);
      setStep(2);
    } catch {
      setError("Не удалось загрузить центры");
    } finally {
      setLoading(false);
    }
  };

  const selectCenter = async (c) => {
    setCenter(c);
    setError("");
    setLoading(true);
    try {
      const data = await api.getCenterExams(c.id);
      setExams(data);
      setStep(3);
    } catch {
      setError("Не удалось загрузить экзамены");
    } finally {
      setLoading(false);
    }
  };

  const registerForExam = async (exam) => {
    setError("");
    setLoading(true);
    try {
      const result = await api.registerForExam(exam.id);
      setPinResult({ ...result, examTitle: result.examTitle || exam.title });
      setStep(4);
    } catch (e) {
      setError(e.message || "Ошибка записи на экзамен");
    } finally {
      setLoading(false);
    }
  };

  const STEPS = ["Город", "Центр", "Экзамен", "PIN"];

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      fontFamily: "'DM Sans', sans-serif", padding: 24,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 600, paddingTop: 24 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button onClick={onBack} style={{
            background: "transparent", border: `1px solid ${T.border}`,
            borderRadius: 8, padding: "6px 12px", color: T.muted,
            fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}>← Назад</button>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: T.text, fontWeight: 700 }}>
            Запись на экзамен
          </h2>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: step > i + 1 ? T.gold : step === i + 1 ? T.gold : T.border,
                  color: step >= i + 1 ? "white" : T.muted,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600, transition: "all .2s",
                }}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 12, color: step === i + 1 ? T.text : T.muted, fontWeight: step === i + 1 ? 500 : 400 }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: step > i + 1 ? T.gold : T.border, margin: "0 8px", transition: "all .3s" }} />
              )}
            </div>
          ))}
        </div>

        {/* Breadcrumb */}
        {step > 1 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {city && <Crumb T={T}>{city.name}</Crumb>}
            {center && step > 2 && <><span style={{ color: T.muted }}>›</span><Crumb T={T}>{center.name}</Crumb></>}
          </div>
        )}

        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>

          {loading && <div style={{ textAlign: "center", color: T.muted, padding: "32px 0" }}>Загрузка...</div>}

          {error && <p style={{ color: T.danger, fontSize: 13, marginBottom: 16 }}>{error}</p>}

          {/* Step 1: Cities */}
          {step === 1 && !loading && (
            <>
              <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Выберите город</h3>
              {cities.length === 0
                ? <Empty T={T} text="Нет доступных городов" />
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {cities.map(c => (
                      <SelectCard key={c.id} T={T} onClick={() => selectCity(c)}>
                        <div style={{ color: T.text, fontWeight: 500, fontSize: 14 }}>{c.name}</div>
                        <div style={{ color: T.muted, fontSize: 12 }}>{c.centers?.length || 0} центров</div>
                      </SelectCard>
                    ))}
                  </div>
                )
              }
            </>
          )}

          {/* Step 2: Centers */}
          {step === 2 && !loading && (
            <>
              <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Выберите экзаменационный центр</h3>
              {centers.length === 0
                ? <Empty T={T} text="В этом городе нет экзаменационных центров" />
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {centers.map(c => (
                      <SelectCard key={c.id} T={T} onClick={() => selectCenter(c)}>
                        <div style={{ color: T.text, fontWeight: 500, fontSize: 14 }}>{c.name}</div>
                        <div style={{ color: T.muted, fontSize: 12 }}>{city.name}</div>
                      </SelectCard>
                    ))}
                  </div>
                )
              }
            </>
          )}

          {/* Step 3: Exams */}
          {step === 3 && !loading && (
            <>
              <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Доступные экзамены</h3>
              {exams.length === 0
                ? <Empty T={T} text="В данный момент нет открытых экзаменов в этом центре" />
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {exams.map(exam => (
                      <div key={exam.id} style={{
                        background: T.card, border: `1px solid ${T.border}`,
                        borderRadius: 12, padding: "16px",
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: T.text, fontWeight: 500, fontSize: 15, marginBottom: 6 }}>{exam.title}</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                              {exam.level && <Tag T={T} color={T.info}>{exam.level}</Tag>}
                              <Tag T={T} color={T.muted}>{exam.examType === "placement" ? "Placement" : "Fixed"}</Tag>
                              <Tag T={T} color={T.muted}>{exam.duration} мин</Tag>
                              {exam.passingScore && <Tag T={T} color={T.success}>Проходной: {exam.passingScore}%</Tag>}
                            </div>
                            {exam.startDate && (
                              <div style={{ color: T.muted, fontSize: 12 }}>
                                {fmtDate(exam.startDate)} — {exam.endDate ? fmtDate(exam.endDate) : "..."}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => registerForExam(exam)}
                            style={{
                              background: `linear-gradient(135deg,${T.gold},${T.goldDim})`,
                              border: "none", borderRadius: 9, padding: "8px 16px",
                              color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer",
                              fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
                            }}
                          >
                            Записаться
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </>
          )}

          {/* Step 4: PIN success */}
          {step === 4 && pinResult && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 20, color: T.text, fontWeight: 700, marginBottom: 8 }}>
                {pinResult.alreadyRegistered ? "Вы уже записаны!" : "Запись подтверждена!"}
              </h2>
              <p style={{ color: T.muted, fontSize: 14, marginBottom: 24 }}>
                {pinResult.examTitle}
              </p>

              <div style={{ marginBottom: 24 }}>
                <div style={{ color: T.muted, fontSize: 12, marginBottom: 10 }}>Ваш PIN-код для экзамена</div>
                <div style={{
                  display: "inline-block",
                  background: `linear-gradient(135deg,${T.gold}22,${T.goldDim}11)`,
                  border: `2px solid ${T.gold}66`,
                  borderRadius: 14, padding: "16px 32px",
                  fontFamily: "monospace", fontSize: 36, fontWeight: 700,
                  color: T.gold, letterSpacing: 6, userSelect: "all",
                }}>
                  {pinResult.pin}
                </div>
              </div>

              <div style={{
                background: T.gold + "11", border: `1px solid ${T.gold}33`,
                borderRadius: 10, padding: "12px 16px",
                fontSize: 13, color: T.textSub, marginBottom: 20, lineHeight: 1.6, textAlign: "left",
              }}>
                Запишите PIN-код. Он потребуется при входе в систему в экзаменационном центре.
              </div>

              <button onClick={onBack} style={{
                width: "100%", padding: "12px 0", borderRadius: 10,
                background: "transparent", border: `1px solid ${T.border}`,
                color: T.textSub, fontWeight: 500, fontSize: 14, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Вернуться в личный кабинет
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SelectCard({ T, onClick, children }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.card, border: `1.5px solid ${T.border}`,
        borderRadius: 12, padding: "14px 16px", cursor: "pointer",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        transition: "border-color .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#b8943f"}
      onMouseLeave={e => e.currentTarget.style.borderColor = ""}
    >
      <div>{children}</div>
      <span style={{ color: "#b8943f", fontSize: 18 }}>›</span>
    </div>
  );
}

function Crumb({ T, children }) {
  return (
    <span style={{
      background: T.gold + "18", color: T.gold,
      borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 500,
    }}>{children}</span>
  );
}

function Tag({ T, color, children }) {
  return (
    <span style={{ fontSize: 11, color, background: color + "22", borderRadius: 5, padding: "2px 7px" }}>{children}</span>
  );
}

function Empty({ T, text }) {
  return (
    <div style={{ textAlign: "center", color: T.muted, padding: "32px 0", fontSize: 14 }}>{text}</div>
  );
}

function fmtDate(d) { return d ? formatDate(d) : ""; }
