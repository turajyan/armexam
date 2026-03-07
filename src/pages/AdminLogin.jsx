import { useState } from "react";
import { api } from "../api.js";
import { t } from "../translations.js";

export default function AdminLogin({ theme: T, onSuccess }) {
  const [form, setForm]   = useState({ email: "", password: "" });
  const [loading, setL]   = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.email || !form.password) return setError(t("adm.login.err.empty"));
    setError(""); setL(true);
    try {
      const { token, admin } = await api.adminLogin({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });
      localStorage.setItem("armexam_admin_token", token);
      onSuccess(admin);
    } catch (e) {
      setError(e.message || t("adm.login.err.failed"));
    } finally {
      setL(false);
    }
  };

  const ROLE_LABELS = [
    t("role.super_admin"),
    t("role.center_admin"),
    t("role.moderator"),
    t("role.examiner"),
  ];

  const onKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: `linear-gradient(135deg,${T.gold},${T.goldDim})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 28,
            color: "white", margin: "0 auto 14px",
          }}>Հ</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: T.text, fontWeight: 700, marginBottom: 6 }}>
            ArmExam
          </h1>
          <p style={{ color: T.muted, fontSize: 14 }}>{t("adm.login.subtitle")}</p>
        </div>

        <div style={{
          background: T.panel, border: `1px solid ${T.border}`,
          borderRadius: 16, padding: 32,
          boxShadow: "0 8px 32px rgba(0,0,0,.18)",
        }}>
          <h2 style={{ fontSize: 17, color: T.text, fontWeight: 600, marginBottom: 6 }}>
            {t("adm.login.heading")}
          </h2>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: 22 }}>
            {t("adm.login.available")} {ROLE_LABELS.join(", ")}
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5, fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              onKeyDown={onKey}
              placeholder="admin@armexam.am"
              style={inputSt(T)}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5, fontWeight: 500 }}>{t("adm.login.password")}</label>
            <input
              type="password"
              value={form.password}
              onChange={e => set("password", e.target.value)}
              onKeyDown={onKey}
              placeholder="••••••"
              style={inputSt(T)}
            />
          </div>

          {error && (
            <div style={{
              background: T.danger + "18", border: `1px solid ${T.danger}44`,
              borderRadius: 8, padding: "8px 12px", marginBottom: 14,
              color: T.danger, fontSize: 13,
            }}>{error}</div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={primaryBtn(T, loading)}>
            {loading ? t("adm.login.submitting") : t("adm.login.submit")}
          </button>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <a href="#login" style={{ color: T.muted, fontSize: 12, textDecoration: "none" }}>
              {t("adm.login.portal")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function inputSt(T) {
  return {
    width: "100%", background: T.card, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "10px 14px", color: T.text, fontSize: 14,
    outline: "none", fontFamily: "'DM Sans', sans-serif",
  };
}

function primaryBtn(T, disabled = false) {
  return {
    width: "100%", padding: "12px 0", borderRadius: 10,
    background: disabled ? T.border : `linear-gradient(135deg,${T.gold},${T.goldDim})`,
    border: "none", color: "white", fontWeight: 600, fontSize: 14,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif",
  };
}
