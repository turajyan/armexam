import { useState } from "react";
import { api } from "../api.js";
import { t } from "../translations.js";

const COUNTRIES = [
  "Armenia", "Russia", "USA", "France", "Germany", "Georgia", "Ukraine",
  "Belarus", "Kazakhstan", "Azerbaijan", "Turkey", "Iran", "Other",
];

export default function RegisterPage({ theme: T, onSuccess }) {
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "",
    country: "", documentType: "passport", documentNumber: "", gender: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.name.trim())           return t("reg.error.name");
    if (!form.email.includes("@"))   return t("reg.error.email");
    if (form.password.length < 6)    return t("reg.error.password");
    if (!form.country)               return t("reg.error.country");
    if (!form.documentNumber.trim()) return t("reg.error.doc");
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);
    setError("");
    setSubmitting(true);
    try {
      const { token, user } = await api.register({
        name:           form.name.trim(),
        email:          form.email.trim().toLowerCase(),
        password:       form.password,
        phone:          form.phone.trim() || undefined,
        country:        form.country,
        documentType:   form.documentType,
        documentNumber: form.documentNumber.trim(),
        gender:         form.gender || undefined,
      });
      localStorage.setItem("armexam_token", token);
      setDone(true);
      if (onSuccess) setTimeout(() => onSuccess(user), 1200);
    } catch (e) {
      setError(e.message || t("reg.error.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 500 }}>

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
          <p style={{ color: T.muted, fontSize: 14 }}>{t("reg.title")}</p>
        </div>

        <div style={{
          background: T.panel, border: `1px solid ${T.border}`,
          borderRadius: 16, padding: 32,
          boxShadow: "0 8px 32px rgba(0,0,0,.18)",
        }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 20, color: T.text, fontWeight: 700, marginBottom: 8 }}>{t("reg.success")}</h2>
              <p style={{ color: T.muted, fontSize: 14 }}>{t("reg.redirecting")}</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 17, color: T.text, fontWeight: 600, marginBottom: 22 }}>{t("reg.personal")}</h2>

              <Field label={t("reg.fullname")} T={T}>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="Ani Hakobyan" style={inputSt(T)} />
              </Field>

              <Field label={t("reg.email")} T={T}>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="ani@example.com" style={inputSt(T)} />
              </Field>

              <Field label={t("reg.password")} T={T}>
                <input type="password" value={form.password} onChange={e => set("password", e.target.value)}
                  placeholder={t("reg.password_hint")} style={inputSt(T)} />
              </Field>

              <Field label={t("reg.phone")} T={T}>
                <input value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="+374 99 123456" style={inputSt(T)} />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label={t("reg.country")} T={T}>
                  <select value={form.country} onChange={e => set("country", e.target.value)} style={inputSt(T)}>
                    <option value="">{t("reg.country_default")}</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label={t("reg.gender")} T={T}>
                  <select value={form.gender} onChange={e => set("gender", e.target.value)} style={inputSt(T)}>
                    <option value="">{t("reg.country_default")}</option>
                    <option value="male">{t("reg.gender_male")}</option>
                    <option value="female">{t("reg.gender_female")}</option>
                    <option value="other">{t("reg.gender_other")}</option>
                  </select>
                </Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label={t("reg.doc_type")} T={T}>
                  <select value={form.documentType} onChange={e => set("documentType", e.target.value)} style={inputSt(T)}>
                    <option value="passport">{t("reg.doc_passport")}</option>
                    <option value="id_card">{t("reg.doc_id")}</option>
                  </select>
                </Field>
                <Field label={t("reg.doc_number")} T={T}>
                  <input value={form.documentNumber} onChange={e => set("documentNumber", e.target.value)}
                    placeholder="AA 123456" style={inputSt(T)} />
                </Field>
              </div>

              {error && <p style={{ color: T.danger, fontSize: 13, marginBottom: 14, marginTop: -4 }}>{error}</p>}

              <button onClick={handleSubmit} disabled={submitting} style={primaryBtn(T, submitting)}>
                {submitting ? t("reg.submitting") : t("reg.submit")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, T }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5, fontWeight: 500 }}>{label}</label>
      {children}
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
    fontFamily: "'DM Sans', sans-serif", marginTop: 4,
  };
}
