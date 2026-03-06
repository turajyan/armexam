import { useState, useEffect } from "react";
import { api } from "../api.js";

export default function AdminCenters({ theme: T }) {
  const C = T;

  const [cities,   setCities]   = useState([]);
  const [selected, setSelected] = useState(null); // selected city id for detail view
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);  // { type: "city"|"center", data?: obj }
  const [delConf,  setDelConf]  = useState(null);  // { type, id, name }
  const [err,      setErr]      = useState("");

  const load = async () => {
    setLoading(true);
    try { setCities(await api.getCities()); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const allCenters = cities.flatMap(c => c.centers.map(ctr => ({ ...ctr, cityName: c.name })));
  const displayedCity = selected ? cities.find(c => c.id === selected) : null;

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!delConf) return;
    try {
      if (delConf.type === "city")   await api.deleteCity(delConf.id);
      if (delConf.type === "center") await api.deleteCenter(delConf.id);
      setDelConf(null);
      if (delConf.type === "city" && selected === delConf.id) setSelected(null);
      await load();
    } catch (e) { setErr(e.message); }
  };

  const totalStudents = 0; // placeholder

  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden", fontFamily:"'DM Sans',sans-serif" }}>

      {/* Left: cities list */}
      <div style={{ width:260, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0, background:C.sidebarBg }}>
        <div style={{ padding:"18px 16px 12px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:700, color:C.text }}>Города</span>
          <Btn small onClick={() => setModal({ type:"city" })} C={C}>+ Город</Btn>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"8px 8px" }}>
          {loading && <Muted C={C}>Загрузка...</Muted>}
          {!loading && cities.length === 0 && <Muted C={C}>Нет городов</Muted>}
          {cities.map(city => (
            <div key={city.id}
              onClick={() => setSelected(city.id === selected ? null : city.id)}
              style={{
                padding:"10px 12px", borderRadius:10, marginBottom:4, cursor:"pointer",
                background: selected === city.id ? C.gold+"22" : "transparent",
                border:`1px solid ${selected === city.id ? C.gold+"66" : "transparent"}`,
                transition:"all .15s",
              }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ color:C.text, fontWeight:500, fontSize:14 }}>🏙 {city.name}</div>
                  <div style={{ color:C.muted, fontSize:11, marginTop:2 }}>{city.centers.length} центр(ов)</div>
                </div>
                <div style={{ display:"flex", gap:4 }}>
                  <IconBtn onClick={e => { e.stopPropagation(); setModal({ type:"city", data:city }); }} C={C}>✏️</IconBtn>
                  <IconBtn danger onClick={e => { e.stopPropagation(); setDelConf({ type:"city", id:city.id, name:city.name }); }} C={C}>🗑</IconBtn>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${C.border}`, display:"flex", gap:16 }}>
          <StatChip label="Городов" value={cities.length} C={C} />
          <StatChip label="Центров" value={allCenters.length} C={C} />
        </div>
      </div>

      {/* Right: centers list or detail */}
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
        {/* Top bar */}
        <div style={{ padding:"16px 24px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          {displayedCity
            ? <><span style={{ color:C.muted, fontSize:13 }}>🏙</span>
                <span style={{ color:C.text, fontWeight:600, fontSize:15 }}>{displayedCity.name}</span>
                <span style={{ color:C.muted, fontSize:13 }}>·</span>
                <span style={{ color:C.muted, fontSize:13 }}>{displayedCity.centers.length} центр(ов)</span>
              </>
            : <span style={{ color:C.text, fontWeight:600, fontSize:15 }}>Все центры ({allCenters.length})</span>
          }
          <div style={{ flex:1 }} />
          <Btn onClick={() => setModal({ type:"center", data: displayedCity ? { cityId: displayedCity.id } : {} })} C={C}>
            + Добавить центр
          </Btn>
        </div>

        {err && <div style={{ margin:"12px 24px", padding:"10px 14px", background:C.danger+"18", border:`1px solid ${C.danger}33`, borderRadius:10, color:C.danger, fontSize:13 }}>{err}<button onClick={()=>setErr("")} style={{ float:"right", background:"none", border:"none", color:C.danger, cursor:"pointer" }}>✕</button></div>}

        {/* Centers grid */}
        <div style={{ padding:"20px 24px", display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:16, alignContent:"start" }}>
          {(displayedCity ? displayedCity.centers : allCenters).map(center => (
            <CenterCard
              key={center.id}
              center={center}
              cityName={displayedCity ? displayedCity.name : center.cityName}
              cities={cities}
              C={C}
              onEdit={() => setModal({ type:"center", data: center })}
              onDelete={() => setDelConf({ type:"center", id:center.id, name:center.name })}
            />
          ))}
          {!loading && (displayedCity ? displayedCity.centers : allCenters).length === 0 && (
            <div style={{ gridColumn:"1/-1", textAlign:"center", color:C.muted, padding:"60px 0", fontSize:14 }}>
              Нет экзаменационных центров. Нажмите «+ Добавить центр»
            </div>
          )}
        </div>
      </div>

      {/* City Modal */}
      {modal?.type === "city" && (
        <CityModal
          C={C}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={async (name) => {
            if (modal.data?.id) await api.updateCity(modal.data.id, { name });
            else                await api.createCity({ name });
            setModal(null);
            await load();
          }}
        />
      )}

      {/* Center Modal */}
      {modal?.type === "center" && (
        <CenterModal
          C={C}
          cities={cities}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={async (data) => {
            if (modal.data?.id && !modal.data?.cityId) await api.updateCenter(modal.data.id, data);
            else if (modal.data?.cityId && !modal.data?.address) await api.createCenter(data);
            else if (modal.data?.id) await api.updateCenter(modal.data.id, data);
            else await api.createCenter(data);
            setModal(null);
            await load();
          }}
        />
      )}

      {/* Delete Confirm */}
      {delConf && (
        <div style={{ position:"fixed", inset:0, background:"#00000080", zIndex:99, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, padding:28, width:360 }}>
            <h3 style={{ color:C.text, fontSize:16, fontWeight:700, marginBottom:10 }}>Подтвердите удаление</h3>
            <p style={{ color:C.muted, fontSize:13, marginBottom:20, lineHeight:1.5 }}>
              Удалить {delConf.type === "city" ? "город" : "центр"} <strong style={{ color:C.text }}>«{delConf.name}»</strong>?
              {delConf.type === "city" && " Все центры этого города также будут удалены."}
            </p>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn small onClick={() => setDelConf(null)} C={C}>Отмена</Btn>
              <Btn small danger onClick={handleDelete} C={C}>Удалить</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Center Card ───────────────────────────────────────────────────────────────
function CenterCard({ center, cityName, C, onEdit, onDelete }) {
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:14, padding:20, display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div>
          <div style={{ color:C.text, fontWeight:600, fontSize:15, marginBottom:4 }}>{center.name}</div>
          <span style={{ background:C.gold+"18", color:C.gold, borderRadius:6, fontSize:11, padding:"2px 8px", fontWeight:500 }}>
            🏙 {cityName}
          </span>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <IconBtn onClick={onEdit} C={C}>✏️</IconBtn>
          <IconBtn danger onClick={onDelete} C={C}>🗑</IconBtn>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {center.address && <InfoRow icon="📍" value={center.address} C={C} />}
        {center.phone   && <InfoRow icon="📞" value={center.phone}   C={C} />}
        {center.email   && <InfoRow icon="✉️"  value={center.email}   C={C} />}
        {!center.address && !center.phone && !center.email &&
          <span style={{ color:C.muted, fontSize:12, fontStyle:"italic" }}>Контактные данные не указаны</span>
        }
      </div>

      {center.exams && (
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
          <div style={{ color:C.muted, fontSize:11, marginBottom:6 }}>Экзамены ({center.exams.length})</div>
          {center.exams.length === 0 && <span style={{ color:C.muted, fontSize:12 }}>Нет экзаменов</span>}
          {center.exams.slice(0, 3).map(e => (
            <div key={e.id} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:e.isOpen ? "#22c55e" : "#475569", display:"inline-block", flexShrink:0 }} />
              <span style={{ color:C.text, fontSize:12, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.title}</span>
              {e.isOpen && <span style={{ color:"#22c55e", fontSize:10, flexShrink:0 }}>Open</span>}
            </div>
          ))}
          {center.exams.length > 3 && <span style={{ color:C.muted, fontSize:11 }}>+{center.exams.length - 3} ещё</span>}
        </div>
      )}
    </div>
  );
}

// ── City Modal ────────────────────────────────────────────────────────────────
function CityModal({ C, initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [err,  setErr]  = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return setErr("Введите название города");
    setBusy(true);
    try { await onSave(name.trim()); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal C={C} title={initial?.id ? "Редактировать город" : "Новый город"} onClose={onClose}>
      <Field label="Название города *" C={C}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ереван"
          style={inputSt(C)} onKeyDown={e => e.key === "Enter" && submit()} autoFocus />
      </Field>
      {err && <p style={{ color:C.danger, fontSize:13, marginBottom:8 }}>{err}</p>}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:16 }}>
        <Btn small onClick={onClose} C={C}>Отмена</Btn>
        <Btn small primary onClick={submit} disabled={busy} C={C}>{busy ? "Сохранение..." : "Сохранить"}</Btn>
      </div>
    </Modal>
  );
}

// ── Center Modal ──────────────────────────────────────────────────────────────
function CenterModal({ C, cities, initial, onClose, onSave }) {
  const isEdit = !!(initial?.id && initial?.address !== undefined);
  const [form, setForm] = useState({
    name:    initial?.name    || "",
    address: initial?.address || "",
    phone:   initial?.phone   || "",
    email:   initial?.email   || "",
    cityId:  initial?.cityId  || initial?.city?.id || (cities[0]?.id ?? ""),
  });
  const [err,  setErr]  = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) return setErr("Введите название центра");
    if (!form.cityId)      return setErr("Выберите город");
    setBusy(true);
    try { await onSave({ ...form, cityId: Number(form.cityId) }); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <Modal C={C} title={isEdit ? "Редактировать центр" : "Новый центр"} onClose={onClose} wide>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
        <Field label="Название центра *" C={C} full>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="ArmExam Центр" style={inputSt(C)} autoFocus />
        </Field>
        <Field label="Город *" C={C} full>
          <select value={form.cityId} onChange={e => set("cityId", e.target.value)} style={inputSt(C)}>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Адрес" C={C} full>
          <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="ул. Пример 1" style={inputSt(C)} />
        </Field>
        <Field label="Телефон" C={C}>
          <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+374 10 123456" style={inputSt(C)} />
        </Field>
        <Field label="Email" C={C}>
          <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="center@armexam.am" style={inputSt(C)} />
        </Field>
      </div>
      {err && <p style={{ color:C.danger, fontSize:13, marginBottom:8 }}>{err}</p>}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:16 }}>
        <Btn small onClick={onClose} C={C}>Отмена</Btn>
        <Btn small primary onClick={submit} disabled={busy} C={C}>{busy ? "Сохранение..." : "Сохранить"}</Btn>
      </div>
    </Modal>
  );
}

// ── Generic Modal wrapper ─────────────────────────────────────────────────────
function Modal({ C, title, children, onClose, wide }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#00000080", zIndex:99, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, padding:28, width:"100%", maxWidth: wide ? 560 : 420, boxShadow:"0 20px 60px #0006" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ color:C.text, fontSize:17, fontWeight:700 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Field({ label, children, C, full }) {
  return (
    <div style={{ marginBottom:14, gridColumn: full ? "1/-1" : "auto" }}>
      <label style={{ display:"block", fontSize:11, color:C.muted, marginBottom:5, letterSpacing:.4, textTransform:"uppercase" }}>{label}</label>
      {children}
    </div>
  );
}
function InfoRow({ icon, value, C }) {
  return (
    <div style={{ display:"flex", gap:7, alignItems:"center" }}>
      <span style={{ fontSize:13 }}>{icon}</span>
      <span style={{ color:C.textSub || C.muted, fontSize:12 }}>{value}</span>
    </div>
  );
}
function StatChip({ label, value, C }) {
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ color:C.gold, fontWeight:700, fontSize:18 }}>{value}</div>
      <div style={{ color:C.muted, fontSize:10 }}>{label}</div>
    </div>
  );
}
function Muted({ C, children }) {
  return <div style={{ color:C.muted, fontSize:13, padding:"12px 8px" }}>{children}</div>;
}
function Btn({ children, onClick, primary, danger, small, disabled, C }) {
  const bg = primary ? `linear-gradient(135deg,${C.gold},${C.goldDim})` : danger ? C.danger+"18" : "transparent";
  const border = primary ? "none" : danger ? `1px solid ${C.danger}33` : `1px solid ${C.border}`;
  const color = primary ? "white" : danger ? C.danger : C.muted;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily:"'DM Sans',sans-serif", fontSize: small ? 12 : 13, fontWeight:600,
      borderRadius:9, padding: small ? "6px 14px" : "9px 18px",
      cursor: disabled ? "not-allowed" : "pointer", background: disabled ? C.border : bg,
      border, color, transition:"all .15s",
    }}>{children}</button>
  );
}
function IconBtn({ children, onClick, danger, C }) {
  return (
    <button onClick={onClick} style={{
      width:28, height:28, borderRadius:8, background:"transparent",
      border:`1px solid ${danger ? C.danger+"33" : C.border}`,
      cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center",
    }}>{children}</button>
  );
}
function inputSt(C) {
  return {
    width:"100%", background:C.card||C.panel, border:`1.5px solid ${C.border}`,
    borderRadius:10, padding:"9px 13px", color:C.text, fontSize:13,
    outline:"none", fontFamily:"'DM Sans',sans-serif",
  };
}
