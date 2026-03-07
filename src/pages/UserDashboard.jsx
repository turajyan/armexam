import { useState } from "react";
import { api } from "../api.js";
import { formatDate } from "../dateUtils.js";
import { t } from "../translations.js";

const LEVEL_COLORS = {
  A1: "#4ade80", A2: "#86efac", B1: "#60a5fa",
  B2: "#93c5fd", C1: "#f59e0b", C2: "#fbbf24",
};

export default function UserDashboard({ theme: T, user, onRegisterExam, onLogout, onUserUpdate }) {
  const [tab,  setTab]  = useState(0);
  const initials = user.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const TABS = [t("dash.tab.exams"), t("dash.tab.profile"), t("dash.tab.password")];

  const handleLogout = async () => {
    try { await api.logout(); } catch {}
    localStorage.removeItem("armexam_token");
    onLogout();
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans', sans-serif", paddingBottom: 40 }}>

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
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: T.text, fontWeight: 600 }}>ArmExam</span>
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
        }}>{t("dash.logout")}</button>
      </div>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "32px 24px" }}>

        {/* Greeting */}
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: T.text, fontWeight: 700, marginBottom: 6 }}>
          {t("dash.welcome", { name: user.name?.split(" ")[0] })}
        </h2>
        {user.level && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <span style={{ color: T.muted, fontSize: 14 }}>{t("dash.level")}</span>
            <span style={{
              fontSize: 14, fontWeight: 700,
              color: LEVEL_COLORS[user.level] || T.gold,
              background: (LEVEL_COLORS[user.level] || T.gold) + "22",
              borderRadius: 8, padding: "3px 12px",
            }}>{user.level}</span>
          </div>
        )}
        {!user.level && <p style={{ color: T.muted, fontSize: 14, marginBottom: 24 }}>{t("dash.subtitle")}</p>}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: T.card, borderRadius: 12, padding: 4, width: "fit-content" }}>
          {TABS.map((label, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: "7px 16px", borderRadius: 9, border: "none",
              background: tab === i ? T.panel : "transparent",
              color: tab === i ? T.text : T.muted,
              fontSize: 13, fontWeight: tab === i ? 600 : 400,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              boxShadow: tab === i ? `0 1px 4px rgba(0,0,0,.15)` : "none",
              transition: "all .15s",
            }}>{label}</button>
          ))}
        </div>

        {tab === 0 && <ExamsTab T={T} user={user} onRegisterExam={onRegisterExam} />}
        {tab === 1 && <ProfileTab T={T} user={user} onUserUpdate={onUserUpdate} />}
        {tab === 2 && <PasswordTab T={T} />}
      </div>
    </div>
  );
}

// ── Exams tab ──────────────────────────────────────────────────────────────────
function ExamsTab({ T, user, onRegisterExam }) {
  return (
    <>
      {/* Register CTA */}
      <div style={{
        background: `linear-gradient(135deg,${T.gold}18,${T.goldDim}10)`,
        border: `1.5px solid ${T.gold}44`,
        borderRadius: 16, padding: 24, marginBottom: 24,
        display: "flex", alignItems: "center", gap: 20,
      }}>
        <div style={{ fontSize: 36 }}>📝</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: T.text, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{t("dash.register_exam")}</div>
          <div style={{ color: T.muted, fontSize: 13 }}>{t("dash.reg_hint")}</div>
        </div>
        <button onClick={onRegisterExam} style={{
          background: `linear-gradient(135deg,${T.gold},${T.goldDim})`,
          border: "none", borderRadius: 10, padding: "10px 20px",
          color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
        }}>{t("dash.reg_btn")}</button>
      </div>

      {/* Registered exams list */}
      {user.registeredExams && user.registeredExams.length > 0 ? (
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ color: T.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>
            {t("dash.my_regs")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {user.registeredExams.map(r => (
              <div key={r.pin} style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 12, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: T.text, fontWeight: 500, fontSize: 14, marginBottom: 5 }}>{r.exam.title}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {r.exam.level && <Tag color={T.info}>{r.exam.level}</Tag>}
                    <Tag color={T.muted}>{t("dash.min", { n: r.exam.duration })}</Tag>
                    {r.exam.examCenter && (
                      <Tag color={T.muted}>{r.exam.examCenter.city?.name} — {r.exam.examCenter.name}</Tag>
                    )}
                    {r.exam.startDate && <Tag color={T.warning}>{fmtDate(r.exam.startDate)}</Tag>}
                  </div>
                </div>
                <div style={{
                  background: `linear-gradient(135deg,${T.gold}22,${T.goldDim}11)`,
                  border: `1.5px solid ${T.gold}55`,
                  borderRadius: 10, padding: "8px 14px",
                  fontFamily: "monospace", fontSize: 18, fontWeight: 700,
                  color: T.gold, letterSpacing: 3, userSelect: "all", flexShrink: 0,
                }}>{r.pin}</div>
              </div>
            ))}
          </div>
          <p style={{ color: T.muted, fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
            {t("dash.pin_hint")}
          </p>
        </div>
      ) : (
        <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: "20px 0" }}>
          {t("dash.no_exams")}
        </div>
      )}
    </>
  );
}

// ── Profile tab ────────────────────────────────────────────────────────────────
function ProfileTab({ T, user, onUserUpdate }) {
  const [form,    setForm]    = useState({
    name:           user.name           || "",
    phone:          user.phone          || "",
    country:        user.country        || "",
    documentType:   user.documentType   || "passport",
    documentNumber: user.documentNumber || "",
    gender:         user.gender         || "",
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return setError(t("dash.name"));
    setSaving(true); setError(""); setSuccess(false);
    try {
      const updated = await api.updateProfile(form);
      onUserUpdate?.({ ...user, ...updated });
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28 }}>
      <h3 style={{ fontSize: 16, color: T.text, fontWeight: 600, marginBottom: 20 }}>{t("dash.personal")}</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Field label={t("dash.name")} T={T}>
          <input value={form.name} onChange={e => set("name", e.target.value)} style={inputSt(T)} />
        </Field>
        <Field label={t("login.email")} T={T}>
          <input value={user.email} disabled style={{ ...inputSt(T), opacity: .5 }} />
        </Field>
        <Field label={t("dash.phone")} T={T}>
          <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+374..." style={inputSt(T)} />
        </Field>
        <Field label={t("dash.country")} T={T}>
          <input value={form.country} onChange={e => set("country", e.target.value)} style={inputSt(T)} />
        </Field>
        <Field label={t("dash.doc_type")} T={T}>
          <select value={form.documentType} onChange={e => set("documentType", e.target.value)} style={inputSt(T)}>
            <option value="passport">{t("dash.doc_passport")}</option>
            <option value="id_card">{t("dash.doc_id")}</option>
          </select>
        </Field>
        <Field label={t("dash.doc_number")} T={T}>
          <input value={form.documentNumber} onChange={e => set("documentNumber", e.target.value)} style={inputSt(T)} />
        </Field>
        <Field label={t("dash.gender")} T={T}>
          <select value={form.gender} onChange={e => set("gender", e.target.value)} style={inputSt(T)}>
            <option value="">{t("dash.not_set")}</option>
            <option value="male">{t("dash.gender_male")}</option>
            <option value="female">{t("dash.gender_female")}</option>
            <option value="other">{t("dash.gender_other")}</option>
          </select>
        </Field>
        {user.level && (
          <Field label={t("dash.level_label")} T={T}>
            <input value={user.level} disabled style={{ ...inputSt(T), opacity: .5 }} />
          </Field>
        )}
      </div>

      {error   && <div style={errorBox(T)}>{error}</div>}
      {success && <div style={{ ...errorBox(T), background: "#4cc98a18", borderColor: "#4cc98a44", color: "#4cc98a" }}>{t("dash.saved")}</div>}

      <button onClick={handleSave} disabled={saving} style={primaryBtn(T, saving)}>
        {saving ? t("dash.saving") : t("dash.save")}
      </button>
    </div>
  );
}

// ── Password tab ───────────────────────────────────────────────────────────────
function PasswordTab({ T }) {
  const [form,    setForm]    = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.currentPassword || !form.newPassword) return setError(t("reg.error.password"));
    if (form.newPassword !== form.confirm) return setError(t("reg.error.password"));
    if (form.newPassword.length < 6) return setError(t("reg.error.password"));
    setSaving(true); setError(""); setSuccess(false);
    try {
      await api.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: "currentPassword", label: t("dash.pwd_current") },
    { key: "newPassword",     label: t("dash.pwd_new") },
    { key: "confirm",         label: t("dash.pwd_confirm") },
  ];

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, maxWidth: 420 }}>
      <h3 style={{ fontSize: 16, color: T.text, fontWeight: 600, marginBottom: 20 }}>{t("dash.tab.password")}</h3>

      {fields.map(f => (
        <div key={f.key} style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5 }}>{f.label}</label>
          <input
            type="password"
            value={form[f.key]}
            onChange={e => set(f.key, e.target.value)}
            placeholder="••••••"
            style={inputSt(T)}
          />
        </div>
      ))}

      {error   && <div style={errorBox(T)}>{error}</div>}
      {success && <div style={{ ...errorBox(T), background: "#4cc98a18", borderColor: "#4cc98a44", color: "#4cc98a" }}>{t("dash.pwd_changed")}</div>}

      <button onClick={handleSave} disabled={saving} style={primaryBtn(T, saving)}>
        {saving ? t("dash.saving") : t("dash.pwd_submit")}
      </button>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function Field({ label, T, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

function Tag({ color, children }) {
  return (
    <span style={{ fontSize: 11, color, background: color + "22", borderRadius: 5, padding: "2px 7px" }}>{children}</span>
  );
}

function fmtDate(d) { return d ? formatDate(d) : ""; }

function inputSt(T) {
  return {
    width: "100%", background: T.card, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "9px 12px", color: T.text, fontSize: 14,
    outline: "none", fontFamily: "'DM Sans', sans-serif",
  };
}

function errorBox(T) {
  return {
    background: T.danger + "18", border: `1px solid ${T.danger}44`,
    borderRadius: 8, padding: "8px 12px", color: T.danger, fontSize: 13, marginBottom: 14,
  };
}

function primaryBtn(T, disabled = false) {
  return {
    padding: "10px 24px", borderRadius: 10,
    background: disabled ? T.border : `linear-gradient(135deg,${T.gold},${T.goldDim})`,
    border: "none", color: "white", fontWeight: 600, fontSize: 14,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif",
  };
}
