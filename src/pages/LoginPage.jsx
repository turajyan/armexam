import { useState } from "react";
import { api } from "../api.js";

export default function LoginPage({ theme: T, onSuccess, onRegister }) {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [submitting, setSubm] = useState(false);
  const [error, setError]     = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async () => {
    if (!form.email || !form.password) return setError("Введите email и пароль");
    setError("");
    setSubm(true);
    try {
      const { token, user } = await api.login({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });
      localStorage.setItem("armexam_token", token);
      onSuccess(user);
    } catch (e) {
      setError(e.message || "Ошибка входа");
    } finally {
      setSubm(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter") handleLogin(); };

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
          <p style={{ color: T.muted, fontSize: 14 }}>Вход в личный кабинет</p>
        </div>

        <div style={{
          background: T.panel, border: `1px solid ${T.border}`,
          borderRadius: 16, padding: 32,
          boxShadow: "0 8px 32px rgba(0,0,0,.18)",
        }}>
          <h2 style={{ fontSize: 17, color: T.text, fontWeight: 600, marginBottom: 22 }}>Войти</h2>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5, fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              onKeyDown={onKey}
              placeholder="ivan@example.com"
              style={inputSt(T)}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, color: T.muted, marginBottom: 5, fontWeight: 500 }}>Пароль</label>
            <input
              type="password"
              value={form.password}
              onChange={e => set("password", e.target.value)}
              onKeyDown={onKey}
              placeholder="••••••"
              style={inputSt(T)}
            />
          </div>

          {error && <p style={{ color: T.danger, fontSize: 13, marginBottom: 14 }}>{error}</p>}

          <button onClick={handleLogin} disabled={submitting} style={primaryBtn(T, submitting)}>
            {submitting ? "Вход..." : "Войти"}
          </button>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ color: T.muted, fontSize: 13 }}>Нет учётной записи? </span>
            <button
              onClick={onRegister}
              style={{ background: "none", border: "none", color: T.gold, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
            >
              Зарегистрироваться
            </button>
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
