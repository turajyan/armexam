import { useState, useEffect } from "react";
import { api } from "../api.js";
import { t } from "../translations.js";

const ROLE_COLORS = {
  super_admin:  "#c9a84c",
  center_admin: "#4c9ac9",
  moderator:    "#4cc98a",
  examiner:     "#c94c6f",
};

const EMPTY_FORM = { name: "", email: "", password: "", role: "moderator", centerId: "", status: "active" };

export default function AdminManagement({ theme: T }) {
  const [admins,  setAdmins]  = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [deleting, setDel]    = useState(null);

  const ROLES = [
    { value: "super_admin",  label: t("role.super_admin") },
    { value: "center_admin", label: t("role.center_admin") },
    { value: "moderator",    label: t("role.moderator") },
    { value: "examiner",     label: t("role.examiner") },
  ];

  const load = async () => {
    try {
      const [a, c] = await Promise.all([api.getAdmins(), api.getCenters()]);
      setAdmins(a);
      setCenters(c);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSaveErr("");
    setModal({ mode: "create" });
  };

  const openEdit = (admin) => {
    setForm({
      name:     admin.name,
      email:    admin.email,
      password: "",
      role:     admin.role,
      centerId: admin.centerId ?? "",
      status:   admin.status,
    });
    setSaveErr("");
    setModal({ mode: "edit", id: admin.id });
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return setSaveErr(t("adm.m.err.required"));
    if (modal.mode === "create" && !form.password) return setSaveErr(t("adm.m.err.password"));
    setSaving(true); setSaveErr("");
    try {
      const payload = { ...form, centerId: form.centerId ? Number(form.centerId) : null };
      if (!payload.password) delete payload.password;
      if (modal.mode === "create") {
        await api.createAdmin(payload);
      } else {
        await api.updateAdmin(modal.id, payload);
      }
      setModal(null);
      load();
    } catch (e) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDel(id);
    try {
      await api.deleteAdmin(id);
      setAdmins(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setDel(null);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (loading) return <div style={{ padding: 40, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>{t("adm.loading")}</div>;

  const HEADERS = [t("adm.m.col.name"), "Email", t("adm.m.col.role"), t("adm.m.col.center"), t("adm.m.col.status"), ""];

  return (
    <div style={{ padding: 28, overflow: "auto", height: "100%", fontFamily: "'DM Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, color: T.text, fontWeight: 600, marginBottom: 4 }}>{t("adm.m.title")}</h2>
          <p style={{ fontSize: 13, color: T.muted }}>{t("adm.m.accounts", { n: admins.length })}</p>
        </div>
        <button onClick={openCreate} style={primaryBtn(T)}>{t("adm.m.add")}</button>
      </div>

      {error && <div style={errorBox(T)}>{error}</div>}

      {/* Table */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.card }}>
              {HEADERS.map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {admins.map((a, i) => (
              <tr key={a.id} style={{ borderBottom: i < admins.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <td style={{ padding: "12px 16px", color: T.text, fontSize: 14, fontWeight: 500 }}>{a.name}</td>
                <td style={{ padding: "12px 16px", color: T.muted, fontSize: 13 }}>{a.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    background: (ROLE_COLORS[a.role] || T.gold) + "22",
                    color: ROLE_COLORS[a.role] || T.gold,
                    border: `1px solid ${(ROLE_COLORS[a.role] || T.gold)}44`,
                    borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
                  }}>
                    {ROLES.find(r => r.value === a.role)?.label || a.role}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: T.muted, fontSize: 13 }}>
                  {a.center?.name ?? <span style={{ opacity: .4 }}>—</span>}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    background: a.status === "active" ? T.success + "22" : T.danger + "22",
                    color: a.status === "active" ? T.success : T.danger,
                    borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
                  }}>
                    {a.status === "active" ? t("adm.m.active") : t("adm.m.blocked")}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <button onClick={() => openEdit(a)} style={iconBtn(T, T.gold)}>✎</button>
                  <button
                    onClick={() => { if (confirm(`Delete «${a.name}»?`)) handleDelete(a.id); }}
                    disabled={deleting === a.id}
                    style={iconBtn(T, T.danger)}
                  >✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {admins.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>{t("adm.m.no_admins")}</div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={modalBox(T)} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 17, color: T.text, fontWeight: 600, marginBottom: 20 }}>
              {modal.mode === "create" ? t("adm.m.modal_add") : t("adm.m.modal_edit")}
            </h3>

            {[
              { key: "name",     label: t("adm.m.col.name"), type: "text",     placeholder: "John Doe" },
              { key: "email",    label: "Email",              type: "email",    placeholder: "john@armexam.am" },
              { key: "password", label: modal.mode === "create" ? t("adm.login.password") : t("adm.m.pwd_edit"), type: "password", placeholder: "••••••" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={labelSt(T)}>{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  style={inputSt(T)}
                />
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={labelSt(T)}>{t("adm.m.col.role")}</label>
              <select value={form.role} onChange={e => set("role", e.target.value)} style={inputSt(T)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {(form.role === "center_admin") && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelSt(T)}>{t("adm.m.col.center")}</label>
                <select value={form.centerId} onChange={e => set("centerId", e.target.value)} style={inputSt(T)}>
                  <option value="">{t("adm.m.center_none")}</option>
                  {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={labelSt(T)}>{t("adm.m.col.status")}</label>
              <select value={form.status} onChange={e => set("status", e.target.value)} style={inputSt(T)}>
                <option value="active">{t("adm.m.active")}</option>
                <option value="inactive">{t("adm.m.blocked")}</option>
              </select>
            </div>

            {saveErr && <div style={errorBox(T)}>{saveErr}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setModal(null)} style={secondaryBtn(T)}>{t("adm.cancel")}</button>
              <button onClick={handleSave} disabled={saving} style={{ ...primaryBtn(T), flex: 1 }}>
                {saving ? t("adm.saving") : t("adm.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
};

const modalBox = (T) => ({
  background: T.panel, border: `1px solid ${T.border}`,
  borderRadius: 16, padding: 28, width: "100%", maxWidth: 460,
  boxShadow: "0 20px 60px rgba(0,0,0,.4)",
});

function inputSt(T) {
  return {
    width: "100%", background: T.card, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "9px 12px", color: T.text, fontSize: 14,
    outline: "none", fontFamily: "'DM Sans', sans-serif",
  };
}
const labelSt = (T) => ({ display: "block", fontSize: 12, color: T.muted, marginBottom: 5, fontWeight: 500 });
const errorBox = (T) => ({
  background: T.danger + "18", border: `1px solid ${T.danger}44`,
  borderRadius: 8, padding: "8px 12px", color: T.danger, fontSize: 13, marginBottom: 14,
});
function primaryBtn(T) {
  return {
    padding: "10px 20px", borderRadius: 10,
    background: `linear-gradient(135deg,${T.gold},${T.goldDim})`,
    border: "none", color: "white", fontWeight: 600, fontSize: 14,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  };
}
function secondaryBtn(T) {
  return {
    padding: "10px 20px", borderRadius: 10,
    background: T.card, border: `1px solid ${T.border}`,
    color: T.text, fontWeight: 500, fontSize: 14,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  };
}
function iconBtn(T, color) {
  return {
    background: color + "18", border: `1px solid ${color}44`,
    color, borderRadius: 8, padding: "4px 10px", fontSize: 14,
    cursor: "pointer", marginLeft: 6, fontFamily: "'DM Sans', sans-serif",
  };
}
