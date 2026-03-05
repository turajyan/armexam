import { api } from "../api.js";

const DOC_LABELS = { passport: "Паспорт", id_card: "ID карта" };

const LEVEL_COLORS = {
  A1: "#4ade80", A2: "#86efac", B1: "#60a5fa",
  B2: "#93c5fd", C1: "#f59e0b", C2: "#fbbf24",
};

export default function UserDashboard({ theme: T, user, onRegisterExam, onLogout }) {
  const initials = user.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const handleLogout = async () => {
    try { await api.logout(); } catch {}
    localStorage.removeItem("armexam_token");
    onLogout();
  };

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      fontFamily: "'DM Sans', sans-serif", padding: "0 0 40px",
    }}>

      {/* Top bar */}
      <div style={{
        background: T.topbarBg, backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
        padding: "14px 24px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `linear-gradient(135deg,${T.gold},${T.goldDim})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 20, color: "white",
        }}>Հ</div>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: T.text, fontWeight: 600 }}>
          ArmExam
        </span>
        <div style={{ flex: 1 }} />
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: `linear-gradient(135deg,${T.gold}44,${T.goldDim}44)`,
          border: `1.5px solid ${T.gold}66`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: T.gold,
        }}>{initials}</div>
        <button onClick={handleLogout} style={{
          background: "transparent", border: `1px solid ${T.border}`,
          borderRadius: 8, padding: "6px 14px", color: T.muted,
          fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}>Выйти</button>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>

        {/* Greeting */}
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: T.text, fontWeight: 700, marginBottom: 6 }}>
          Добро пожаловать, {user.name?.split(" ")[0]}
        </h2>
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 28 }}>Ваш личный кабинет</p>

        {/* Personal info card */}
        <div style={{
          background: T.panel, border: `1px solid ${T.border}`,
          borderRadius: 16, padding: 24, marginBottom: 24,
        }}>
          <div style={{ color: T.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>
            Личная информация
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
            <InfoRow label="Имя" value={user.name} T={T} />
            <InfoRow label="Email" value={user.email} T={T} />
            {user.phone && <InfoRow label="Телефон" value={user.phone} T={T} />}
            <InfoRow label="Страна" value={user.country} T={T} />
            <InfoRow label="Документ" value={`${DOC_LABELS[user.documentType] || user.documentType}: ${user.documentNumber}`} T={T} />
            {user.level && (
              <div>
                <div style={{ color: T.muted, fontSize: 12, marginBottom: 3 }}>Уровень языка</div>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: LEVEL_COLORS[user.level] || T.text,
                  background: (LEVEL_COLORS[user.level] || T.gold) + "22",
                  borderRadius: 6, padding: "2px 10px",
                }}>{user.level}</span>
              </div>
            )}
          </div>
        </div>

        {/* Register for exam CTA */}
        <div style={{
          background: `linear-gradient(135deg,${T.gold}18,${T.goldDim}10)`,
          border: `1.5px solid ${T.gold}44`,
          borderRadius: 16, padding: 24, marginBottom: 24,
          display: "flex", alignItems: "center", gap: 20,
        }}>
          <div style={{ fontSize: 36 }}>📝</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: T.text, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
              Записаться на экзамен
            </div>
            <div style={{ color: T.muted, fontSize: 13 }}>
              Выберите город, экзаменационный центр и удобное время
            </div>
          </div>
          <button onClick={onRegisterExam} style={{
            background: `linear-gradient(135deg,${T.gold},${T.goldDim})`,
            border: "none", borderRadius: 10, padding: "10px 20px",
            color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
          }}>
            Записаться →
          </button>
        </div>

        {/* Registered exams */}
        {user.registeredExams && user.registeredExams.length > 0 && (
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
            <div style={{ color: T.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>
              Мои записи на экзамены
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {user.registeredExams.map(r => (
                <div key={r.pin} style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 12, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 16,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: T.text, fontWeight: 500, fontSize: 14, marginBottom: 3 }}>
                      {r.exam.title}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {r.exam.level && <Tag color={T.info}>{r.exam.level}</Tag>}
                      <Tag color={T.muted}>{r.exam.duration} мин</Tag>
                      {r.exam.examCenter && (
                        <Tag color={T.muted}>
                          {r.exam.examCenter.city?.name} — {r.exam.examCenter.name}
                        </Tag>
                      )}
                      {r.exam.startDate && (
                        <Tag color={T.warning}>{fmtDate(r.exam.startDate)}</Tag>
                      )}
                    </div>
                  </div>
                  <div style={{
                    background: `linear-gradient(135deg,${T.gold}22,${T.goldDim}11)`,
                    border: `1.5px solid ${T.gold}55`,
                    borderRadius: 10, padding: "8px 16px",
                    fontFamily: "monospace", fontSize: 20, fontWeight: 700,
                    color: T.gold, letterSpacing: 3, userSelect: "all", flexShrink: 0,
                  }}>
                    {r.pin}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ color: T.muted, fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
              PIN-код предъявляется на экзаменационном центре для входа в систему.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, T }) {
  return (
    <div>
      <div style={{ color: T.muted, fontSize: 12, marginBottom: 2 }}>{label}</div>
      <div style={{ color: T.text, fontSize: 14 }}>{value || "—"}</div>
    </div>
  );
}

function Tag({ color, children }) {
  return (
    <span style={{ fontSize: 11, color, background: color + "22", borderRadius: 5, padding: "2px 7px" }}>
      {children}
    </span>
  );
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}
