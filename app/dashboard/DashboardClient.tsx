"use client";
// app/dashboard/DashboardClient.tsx

import { useState, useMemo, useEffect } from "react";
import HorariosConfig from "./HorariosConfig";
import PersonalizacionConfig from "./PersonalizacionConfig";
import CalendarioMensual from "@/app/components/CalendarioMensual";
// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Negocio {
  id: string;
  nombre: string;
  tipo?: string;
  requiere_pago?: boolean;
  duracion_cita?: number;
  logo_url?: string;
  color_primario?: string;
  color_secundario?: string;
}
interface Cita {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  servicio: string;
  fecha: string; // "YYYY-MM-DD"
  hora: string;  // "HH:MM"
    estado_cita?: string; // agrega esta línea
}
interface Props {
  negocio: Negocio | null;
  citas: Cita[];
  agendamientoUrl: string;
  cerrarSesion: () => void | Promise<void>;
} 

// ── Helpers ───────────────────────────────────────────────────────────────────
const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DIAS = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}
function formatFecha(f: string) {
  const [y, m, d] = f.split("-");
  return `${parseInt(d)} ${MESES[parseInt(m) - 1]} ${y}`;
}
function formatFechaCorta(f: string) {
  const [, m, d] = f.split("-");
  return `${parseInt(d)} ${MESES[parseInt(m) - 1].slice(0, 3)}`;
}

// ── CSS global ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = (cp: string, cs: string) => `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${cp}4d; border-radius: 99px; }

  .cita-row {
    transition: background .15s, border-color .15s, transform .1s;
  }
  .cita-row:hover {
    border-color: ${cp}66 !important;
    background: ${cp}0d !important;
    transform: translateX(2px);
  }
  .cal-day {
    transition: background .12s, color .12s;
  }
  .cal-day:hover {
    background: ${cp}26 !important;
    color: ${cs} !important;
  }
  .btn-copy {
    transition: all .2s;
  }
  .btn-copy:hover {
    background: ${cp}26 !important;
  }
  .nav-btn {
    transition: background .15s, color .15s;
  }
  .nav-btn:hover {
    background: ${cp}26 !important;
    color: ${cs} !important;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeIn .25s ease both; }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: .3; }
  }
  .pulse { animation: pulse-dot 2s ease-in-out infinite; }

  @media (max-width: 768px) {
    .dashboard-grid { grid-template-columns: 1fr !important; }
    .stats-grid { grid-template-columns: 1fr 1fr !important; }
    .sidebar { display: none !important; }
  }
`;

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  const colors = [
    ["#2e1065","#7c3aed"],["#1e1b4b","#4f46e5"],["#4a1942","#9d174d"],
    ["#1c1917","#b45309"],["#042f2e","#0f766e"],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  const [from, to] = colors[idx];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg,${from},${to})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700, color: "#f5f3ff",
      fontFamily: "'Syne', sans-serif", letterSpacing: 0.5,
      boxShadow: `0 0 0 1px rgba(255,255,255,.06)`,
    }}>
      {initials(name)}
    </div>
  );
}

// ── Badge de estado ───────────────────────────────────────────────────────────
function StatusBadge({ fecha }: { fecha: string }) {
  const hoy = todayStr();
  const esHoy    = fecha === hoy;
  const esFutura = fecha > hoy;
  const label = esHoy ? "Hoy" : esFutura ? "Próxima" : "Pasada";
  const color = esHoy ? "#4ade80" : esFutura ? "#a78bfa" : "#71717a";
  const bg    = esHoy ? "rgba(74,222,128,.08)" : esFutura ? "rgba(167,139,250,.08)" : "rgba(113,113,122,.08)";
  return (
    <span style={{
      fontSize: 10, padding: "2px 7px", borderRadius: 99,
      background: bg, color, border: `1px solid ${color}40`,
      fontFamily: "'Syne', sans-serif", fontWeight: 600, letterSpacing: .5,
    }}>
      {label}
    </span>
  );
}
function AgendaDelDia({ citas, selectedDay }: { citas: Cita[]; selectedDay: string }) {
  const HORAS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am a 7pm

  const citasDelDia = citas.filter((c) => c.fecha === selectedDay && c.estado_cita !== "cancelada");

  function citaEnHora(hora: number) {
    return citasDelDia.find((c) => parseInt(c.hora.split(":")[0]) === hora);
  }

  return (
    <div style={{
      background: "#0a0a0a", border: "1px solid rgba(255,255,255,.05)",
      borderRadius: 14, overflow: "hidden",
    }}>
      {HORAS.map((h) => {
        const cita = citaEnHora(h);
        return (
          <div
            key={h}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", minHeight: 36,
              borderBottom: "1px solid rgba(255,255,255,.03)",
              background: cita ? "rgba(124,58,237,.06)" : "transparent",
            }}
          >
            <span style={{
              fontSize: 10, color: "#52525b", width: 44, flexShrink: 0,
              fontFamily: "'DM Mono', monospace",
            }}>
              {h % 12 === 0 ? 12 : h % 12}:00 {h >= 12 ? "PM" : "AM"}
            </span>
            {cita ? (
              <div style={{
                flex: 1, background: "rgba(124,58,237,.15)",
                border: "1px solid rgba(124,58,237,.3)",
                borderRadius: 6, padding: "4px 8px",
                fontSize: 11, color: "#e9d5ff",
                fontFamily: "'Syne', sans-serif", fontWeight: 600,
              }}>
                {cita.cliente_nombre} · {cita.servicio}
              </div>
            ) : (
              <div style={{ flex: 1, fontSize: 10, color: "#2a2a2e" }}>Libre</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = false, cp = "#7c3aed", cs = "#a855f7" }: {
  label: string; value: string; sub?: string; accent?: boolean; cp?: string; cs?: string;
}) {
  return (
    <div style={{
      background: accent ? `${cp}0f` : "#0f0f0f",
      border: `1px solid ${accent ? `${cp}40` : "rgba(255,255,255,.05)"}`,
      borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: accent
          ? `linear-gradient(90deg,${cp},${cs})`
          : "linear-gradient(90deg,#27272a,#3f3f46)",
      }} />
      <div style={{
        fontSize: 9, color: accent ? cs : "#52525b",
        textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10,
        fontFamily: "'Syne', sans-serif", fontWeight: 600,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: value.length > 10 ? 14 : value.length > 6 ? 18 : 26,
        fontWeight: 800, color: "#fff", letterSpacing: -0.5, lineHeight: 1.1,
        fontFamily: "'Syne', sans-serif",
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#71717a", marginTop: 5, fontFamily: "'DM Mono', monospace" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Calendario ────────────────────────────────────────────────────────────────
function Calendario({ citas, selectedDay, onSelectDay }: {
  citas: Cita[];
  selectedDay: string | null;
  onSelectDay: (d: string | null) => void;
}) {
  const [viewYear, setViewYear]   = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const citaDates = useMemo(() => {
    const map: Record<string, number> = {};
    citas.forEach(c => { map[c.fecha] = (map[c.fecha] || 0) + 1; });
    return map;
  }, [citas]);


  function changeMonth(dir: number) {
    setViewMonth(prev => {
      const next = prev + dir;
      if (next > 11) { setViewYear(y => y + 1); return 0; }
      if (next < 0)  { setViewYear(y => y - 1); return 11; }
      return next;
    });
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev  = new Date(viewYear, viewMonth, 0).getDate();
  let startDay = new Date(viewYear, viewMonth, 1).getDay() - 1;
  if (startDay < 0) startDay = 6;
  const today = todayStr();

  const cells: { label: number; dateStr?: string; otherMonth?: boolean }[] = [];
  for (let i = 0; i < startDay; i++) {
    cells.push({ label: daysInPrev - startDay + 1 + i, otherMonth: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
    cells.push({ label: d, dateStr });
  }
  const rem = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  for (let i = 1; i <= rem; i++) cells.push({ label: i, otherMonth: true });

  return (
    <div>
      {/* Nav mes */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button
          className="nav-btn"
          onClick={() => changeMonth(-1)}
          style={{
            background: "#0f0f0f", border: "1px solid rgba(255,255,255,.06)",
            color: "#71717a", width: 28, height: 28, borderRadius: 8,
            cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >‹</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Syne', sans-serif" }}>
          {MESES[viewMonth].slice(0, 3)} {viewYear}
        </span>
        <button
          className="nav-btn"
          onClick={() => changeMonth(1)}
          style={{
            background: "#0f0f0f", border: "1px solid rgba(255,255,255,.06)",
            color: "#71717a", width: 28, height: 28, borderRadius: 8,
            cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >›</button>
      </div>

      {/* Días de semana */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {DIAS.map(d => (
          <div key={d} style={{
            fontSize: 9, color: "#3f3f46", textAlign: "center", padding: "3px 0",
            textTransform: "uppercase", letterSpacing: 1, fontFamily: "'Syne', sans-serif", fontWeight: 700,
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid días */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((cell, i) => {
          const count  = cell.dateStr ? (citaDates[cell.dateStr] || 0) : 0;
          const hasCita = count > 0;
          const isToday = cell.dateStr === today;
          const isSel   = cell.dateStr === selectedDay;

          return (
            <div
              key={i}
              className={cell.dateStr && !cell.otherMonth ? "cal-day" : ""}
              onClick={() => {
                if (!cell.dateStr || cell.otherMonth) return;
                onSelectDay(isSel ? null : cell.dateStr);
              }}
              style={{
                aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: isToday ? 700 : 400,
                borderRadius: 8, position: "relative",
                cursor: cell.dateStr && !cell.otherMonth ? "pointer" : "default",
                fontFamily: "'DM Mono', monospace",
                color: cell.otherMonth
                  ? "#2a2a2e"
                  : isSel ? "#fff"
                  : isToday ? "#c084fc"
                  : hasCita ? "#e9d5ff" : "#52525b",
                background: isSel
                  ? "rgba(124,58,237,.25)"
                  : isToday && !isSel ? "rgba(192,132,252,.06)" : "transparent",
                border: isSel
                  ? "1px solid rgba(124,58,237,.5)"
                  : isToday && !isSel ? "1px solid rgba(192,132,252,.2)" : "1px solid transparent",
              }}
            >
              {cell.label}
              {/* Dot cantidad de citas */}
              {hasCita && !isSel && (
                <span style={{
                  position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)",
                  display: "flex", gap: 2,
                }}>
                  {Array.from({ length: Math.min(count, 3) }).map((_, di) => (
                    <span key={di} style={{
                      width: 3, height: 3, borderRadius: "50%",
                      background: count > 1 ? "#a855f7" : "#7c3aed",
                    }} />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Detalle cita ──────────────────────────────────────────────────────────────
function DetalleCita({ cita }: { cita: Cita | null }) {
  if (!cita) {
    return (
      <div style={{
        textAlign: "center", padding: "32px 12px", color: "#3f3f46",
        background: "#0a0a0a", border: "1px solid rgba(255,255,255,.03)",
        borderRadius: 14, fontSize: 12, fontFamily: "'Syne', sans-serif",
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>👆</div>
        Selecciona una cita
      </div>
    );
  }

  const rows = [
    { label: "Servicio",   val: cita.servicio,          mono: false },
    { label: "Fecha",      val: formatFecha(cita.fecha), mono: true  },
    { label: "Hora",       val: cita.hora,               mono: true  },
    { label: "Teléfono",   val: cita.cliente_telefono,   mono: true  },
  ];

  return (
    <div className="fade-in" style={{
      background: "#0a0a0a",
      border: "1px solid rgba(255,255,255,.05)",
      borderRadius: 14, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 18px",
        background: "linear-gradient(135deg,rgba(124,58,237,.08),rgba(168,85,247,.04))",
        borderBottom: "1px solid rgba(255,255,255,.05)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <Avatar name={cita.cliente_nombre} size={44} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>
            {cita.cliente_nombre}
          </div>
          <StatusBadge fecha={cita.fecha} />
        </div>
      </div>

      {/* Rows */}
      <div style={{ padding: "8px 0" }}>
        {rows.map((r, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 18px",
            borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,.03)" : "none",
          }}>
            <span style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase",
              letterSpacing: 1, fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
              {r.label}
            </span>
            <span style={{
              fontSize: 12, color: "#d4d4d8",
              fontFamily: r.mono ? "'DM Mono', monospace" : "'Syne', sans-serif",
              fontWeight: r.mono ? 400 : 500,
            }}>
              {r.val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Próximas citas (mini widget) ──────────────────────────────────────────────
function ProximasCitas({ citas, cp = "#7c3aed", cs = "#a855f7" }: { citas: Cita[]; cp?: string; cs?: string }) {
  const hoy = todayStr();
  const proximas = useMemo(
    () => citas.filter(c => c.fecha >= hoy).slice(0, 3),
    [citas, hoy]
  );

  if (proximas.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{
        fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase",
        color: "#52525b", marginBottom: 12, fontFamily: "'Syne', sans-serif", fontWeight: 700,
      }}>
        Próximas
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {proximas.map(c => (
          <div key={c.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 12px", borderRadius: 10,
            background: "#0f0f0f", border: "1px solid rgba(255,255,255,.04)",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `${cp}1f`, border: `1px solid ${cp}33`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 9, color: cs, fontFamily: "'DM Mono', monospace", lineHeight: 1.1 }}>
                {c.fecha.slice(8)}
              </span>
              <span style={{ fontSize: 7, color: cp, fontFamily: "'DM Mono', monospace" }}>
                {MESES[parseInt(c.fecha.slice(5, 7)) - 1].slice(0, 3).toUpperCase()}
              </span>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7",
                fontFamily: "'Syne', sans-serif",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.cliente_nombre}
              </div>
              <div style={{ fontSize: 10, color: "#52525b", fontFamily: "'DM Mono', monospace" }}>
                {c.hora} · {c.servicio}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function DashboardClient({ negocio, citas, agendamientoUrl, cerrarSesion }: Props) {
  const cp = negocio?.color_primario  || "#7c3aed";
  const cs = negocio?.color_secundario || "#a855f7";
  const [selectedDay,  setSelectedDay]  = useState<string | null>(null);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [copied, setCopied]             = useState(false);
  const [search, setSearch]             = useState("");

  const hoy = todayStr();

  const proxima = useMemo(() => citas.find(c => c.fecha >= hoy), [citas, hoy]);

  const citasMes = useMemo(() => {
    const mes = hoy.slice(0, 7);
    return citas.filter(c => c.fecha.startsWith(mes)).length;
  }, [citas, hoy]);

  const citasHoy = useMemo(() => citas.filter(c => c.fecha === hoy).length, [citas, hoy]);
  const diasInfoNegocio = useMemo(() => {
  const map: Record<string, { cantidadCitas: number; habilitado: boolean }> = {};
  citas.forEach((c) => {
    if (c.estado_cita === "cancelada") return;
    if (!map[c.fecha]) map[c.fecha] = { cantidadCitas: 0, habilitado: true };
    map[c.fecha].cantidadCitas += 1;
  });
  
  return map;
}, [citas]);
  const citasFiltradas = useMemo(() => {
    let list = citas;
    if (selectedDay) list = list.filter(c => c.fecha === selectedDay);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.cliente_nombre.toLowerCase().includes(q) ||
        c.cliente_telefono.includes(q) ||
        c.servicio.toLowerCase().includes(q)
      );
    }
    return list;
  }, [citas, selectedDay, search]);

  function handleSelectDay(day: string | null) {
    setSelectedDay(day);
    setSelectedCita(null);
  }

  function handleSelectCita(cita: Cita) {
    setSelectedCita(prev => prev?.id === cita.id ? null : cita);
  }

  function handleCopy() {
    navigator.clipboard?.writeText(agendamientoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function abrirWhatsApp(cita: Cita) {
  const numero = cita.cliente_telefono
    .replace(/\D/g, "") // quita todo lo que no sea número
    .replace(/^0/, "");  // quita el 0 inicial si lo tiene

  // Si el número no empieza con código de país, agrega Colombia (+57)
  const numeroCompleto = numero.startsWith("57") ? numero : `57${numero}`;

  const mensaje = encodeURIComponent(
    `Hola ${cita.cliente_nombre}, te informamos que tu cita en ${negocio?.nombre} ` +
    `para el servicio de ${cita.servicio} el día ${formatFecha(cita.fecha)} a las ${cita.hora} ` +
    `ha sido cancelada. Disculpa los inconvenientes. Para reagendar escríbenos aquí.`
  );

  window.open(`https://wa.me/${numeroCompleto}?text=${mensaje}`, "_blank");
}

async function handleTogglePago(e: React.MouseEvent) {
  e.stopPropagation();
  const res = await fetch("/api/negocios/toggle-pago", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      negocioId: negocio?.id, 
      requierePago: !negocio?.requiere_pago 
    }),
  });
  if (res.ok) window.location.reload();
  else alert("Error al actualizar la configuración");
}

async function handleCancelar(cita: Cita, e: React.MouseEvent) {
  e.stopPropagation(); // evita que seleccione la cita al hacer click

  const confirmar = window.confirm(
    `¿Cancelar la cita de ${cita.cliente_nombre} el ${formatFecha(cita.fecha)}?`
  );
  if (!confirmar) return;

  const res = await fetch("/api/citas/cancelar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ citaId: cita.id }),
  });

  if (res.ok) {
    abrirWhatsApp(cita); // abre WhatsApp con el mensaje listo
    window.location.reload(); // recarga el dashboard para reflejar el cambio
  } else {
    alert("Error al cancelar la cita");
  }
}

async function handleConfirmar(cita: Cita, e: React.MouseEvent) {
  e.stopPropagation();

  const res = await fetch("/api/citas/confirmar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ citaId: cita.id }),
  });

  if (res.ok) {
    // Abrir WhatsApp con mensaje de confirmación
    const numero = cita.cliente_telefono
      .replace(/\D/g, "")
      .replace(/^0/, "");
    const numeroCompleto = numero.startsWith("57") ? numero : `57${numero}`;

    const mensaje = encodeURIComponent(
      `Hola ${cita.cliente_nombre} 👋, tu cita en ${negocio?.nombre} ` +
      `ha sido *confirmada* ✅\n\n` +
      `📋 Servicio: ${cita.servicio}\n` +
      `📅 Fecha: ${formatFecha(cita.fecha)}\n` +
      `🕐 Hora: ${cita.hora}\n\n` +
      `Te esperamos. Si necesitas cambiar algo, escríbenos aquí.`
    );

    window.open(`https://wa.me/${numeroCompleto}?text=${mensaje}`, "_blank");
    window.location.reload();
  } else {
    alert("Error al confirmar la cita");
  }
}

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS(cp, cs) }} />
      <main style={{
        minHeight: "100vh",
        background: "#080808",
        color: "#fff",
        fontFamily: "'Syne', system-ui, sans-serif",
      }}>

        {/* Glow ambiental */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <div style={{
            position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)",
            width: 900, height: 700,
            background: `radial-gradient(ellipse,${cp}24 0%,transparent 70%)`,
            borderRadius: "50%",
          }} />
          <div style={{
            position: "absolute", bottom: "-20%", right: "-10%",
            width: 500, height: 500,
            background: `radial-gradient(ellipse,${cs}0f 0%,transparent 70%)`,
            borderRadius: "50%",
          }} />
        </div>

        {/* ── Nav ── */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 28px",
          borderBottom: "1px solid rgba(255,255,255,.04)",
          background: "rgba(8,8,8,.92)", backdropFilter: "blur(16px)",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
  width: 28, height: 28, borderRadius: 8,
  background: negocio?.logo_url
    ? `url(${negocio.logo_url})`
    : `linear-gradient(135deg, ${negocio?.color_primario || "#6d28d9"}, ${negocio?.color_secundario || "#a855f7"})`,
  backgroundSize: "cover", backgroundPosition: "center",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 14,
}}>
  {!negocio?.logo_url && "📅"}
</div>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>
              <span style={{
                background: `linear-gradient(135deg,${cp},${cs})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Citas</span>Ya
            </span>
          </div>

          {/* Centro: indicador de citas hoy */}
          {citasHoy > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: 99,
              background: "rgba(74,222,128,.07)", border: "1px solid rgba(74,222,128,.2)",
              fontSize: 11, color: "#4ade80", fontFamily: "'Syne', sans-serif", fontWeight: 600,
            }}>
              <span className="pulse" style={{
                width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block",
              }} />
              {citasHoy} cita{citasHoy > 1 ? "s" : ""} hoy
            </div>
          )}

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {negocio?.tipo && (
              <span style={{
                fontSize: 10, color: cs,
                background: `${cp}14`, border: `1px solid ${cp}2e`,
                padding: "3px 10px", borderRadius: 99, fontWeight: 600, letterSpacing: .5,
              }}>
                {negocio.tipo}
              </span>
            )}
            <span style={{
              fontSize: 12, color: "#a1a1aa",
              background: "#0f0f0f", border: "1px solid rgba(255,255,255,.05)",
              padding: "5px 12px", borderRadius: 99,
            }}>
              {negocio?.nombre}
            </span>
            <form action={cerrarSesion}>
              <button style={{
                fontSize: 11, color: "#52525b", background: "none",
                border: "none", cursor: "pointer", padding: "4px 8px",
                fontFamily: "'Syne', sans-serif",
              }}>
                Salir
              </button>
            </form>
          </div>
        </nav>

        {/* ── Layout principal ── */}
        <div
          className="dashboard-grid"
          style={{
            position: "relative", zIndex: 1,
            display: "grid", gridTemplateColumns: "1fr 380px",
            minHeight: "calc(100vh - 57px)",
          }}
        >
          {/* ── Columna izquierda ── */}
          <div style={{
            padding: "32px 36px",
            borderRight: "1px solid rgba(255,255,255,.04)",
            overflowY: "auto",
          }}>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <h1 style={{
                fontSize: 26, fontWeight: 800, letterSpacing: -0.8, color: "#fff",
                fontFamily: "'Syne', sans-serif", marginBottom: 4,
              }}>
                Panel de citas
              </h1>
              <p style={{ fontSize: 12, color: "#52525b", fontFamily: "'DM Mono', monospace" }}>
                {citas.length === 0 ? "Sin citas agendadas" : `${citas.length} citas en total`}
              </p>
            </div>

            {/* Stats */}
            <div
              className="stats-grid"
              style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 28 }}
            >
              <StatCard
                label="Total"
                value={String(citas.length)}
                sub="citas agendadas"
                accent={citas.length > 0} cp={cp} cs={cs}
              />
              <StatCard
                label="Próxima"
                value={proxima ? formatFechaCorta(proxima.fecha) : "—"}
                sub={proxima ? `a las ${proxima.hora}` : "sin citas futuras"} cp={cp} cs={cs}
              />
              <StatCard
                label="Este mes"
                value={String(citasMes)}
                sub={citasMes === 1 ? "cita" : "citas"} cp={cp} cs={cs}
              />
            </div>

            {/* Link agendamiento */}
            <div style={{
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,.05)",
              borderRadius: 14, padding: "14px 18px", marginBottom: 28,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase",
                  color: cp, marginBottom: 6,
                  fontFamily: "'Syne', sans-serif", fontWeight: 700,
                }}>
                  🔗 Link de agendamiento
                </div>
                <div style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#71717a",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {agendamientoUrl}
                </div>
              </div>
              <button
                className="btn-copy"
                onClick={handleCopy}
                style={{
                  flexShrink: 0, fontSize: 11, padding: "7px 16px", borderRadius: 10,
                  cursor: "pointer",
                  background: copied ? "rgba(74,222,128,.08)" : `${cp}14`,
                  color: copied ? "#4ade80" : cs,
                  border: `1px solid ${copied ? "rgba(74,222,128,.25)" : `${cp}40`}`,
                  fontFamily: "'Syne', sans-serif", fontWeight: 600,
                }}
              >
                {copied ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
            {/* Horarios de disponibilidad */}
{negocio?.id && (
  <HorariosConfig
    negocioId={negocio.id}
    duracionActual={negocio.duracion_cita || 30}
  />
)}

{/* Personalización */}
{negocio?.id && (
  <PersonalizacionConfig
    negocioId={negocio.id}
    logoActual={negocio.logo_url}
    colorPrimarioActual={negocio.color_primario}
    colorSecundarioActual={negocio.color_secundario}
  />
)}

{/* Toggle de pago */}
<div style={{
  background: "#0a0a0a",
  border: "1px solid rgba(255,255,255,.05)",
  borderRadius: 14, padding: "14px 18px", marginBottom: 28,
  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
}}>
  <div>
    <div style={{
      fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase",
      color: negocio?.requiere_pago ? cp : "#52525b",
      marginBottom: 6, fontFamily: "'Syne', sans-serif", fontWeight: 700,
    }}>
      💳 Pago al agendar
    </div>
    <div style={{ fontSize: 11, color: "#52525b", fontFamily: "'DM Mono', monospace" }}>
      {negocio?.requiere_pago
        ? "Tus clientes pagan antes de confirmar la cita"
        : "Tus clientes agendan sin pagar anticipado"}
    </div>
  </div>

  <button
    onClick={handleTogglePago}
    style={{
      flexShrink: 0,
      width: 44, height: 24, borderRadius: 99,
      background: negocio?.requiere_pago
        ? `${cp}99`
        : "rgba(255,255,255,.08)",
      border: `1px solid ${negocio?.requiere_pago ? cp : "rgba(255,255,255,.1)"}`,
      cursor: "pointer",
      position: "relative",
      transition: "all .2s",
    }}
  >
    <span style={{
      position: "absolute",
      top: 2,
      left: negocio?.requiere_pago ? 22 : 2,
      width: 18, height: 18, borderRadius: "50%",
      background: "#fff",
      transition: "left .2s",
      display: "block",
    }} />
  </button>
</div>

            {/* Buscador */}
            <div style={{ position: "relative", marginBottom: 20 }}>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                fontSize: 13, color: "#3f3f46", pointerEvents: "none",
              }}>
                🔍
              </span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, teléfono o servicio..."
                style={{
                  width: "100%", padding: "10px 14px 10px 36px",
                  background: "#0a0a0a", border: "1px solid rgba(255,255,255,.06)",
                  borderRadius: 10, color: "#e4e4e7", fontSize: 12, outline: "none",
                  fontFamily: "'DM Mono', monospace",
                  transition: "border-color .2s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = `${cp}66`; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.06)"; }}
              />
            </div>

            {/* Cabecera lista */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 14,
            }}>
              <div style={{
                fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase",
                color: "#52525b", fontFamily: "'Syne', sans-serif", fontWeight: 700,
              }}>
                {selectedDay ? `Citas del ${formatFechaCorta(selectedDay)}` : "Todas las citas"}
                {` (${citasFiltradas.length})`}
              </div>
              {(selectedDay || search) && (
                <button
                  onClick={() => { handleSelectDay(null); setSearch(""); }}
                  style={{
                    fontSize: 10, color: cp, background: "none",
                    border: "none", cursor: "pointer",
                    fontFamily: "'Syne', sans-serif", fontWeight: 600,
                  }}
                >
                  × Limpiar filtros
                </button>
              )}
            </div>

            {/* Lista de citas */}
            {citasFiltradas.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "56px 20px",
                background: "rgba(255,255,255,.01)",
                border: "1px dashed rgba(255,255,255,.06)", borderRadius: 16,
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>
                  {search ? "🔍" : "📭"}
                </div>
                <p style={{ color: "#52525b", fontSize: 13, fontFamily: "'Syne', sans-serif" }}>
                  {search ? "Sin resultados para tu búsqueda" :
                    selectedDay ? "Sin citas este día" : "Aún no hay citas agendadas"}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {citasFiltradas.map(c => {
                  const isSel = selectedCita?.id === c.id;
                  const isPast = c.fecha < hoy;
                  return (
                    <div
                      key={c.id}
                      className="cita-row fade-in"
                      onClick={() => handleSelectCita(c)}
                      style={{
                        background: isSel ? `${cp}12` : "#0d0d0d",
                        border: `1px solid ${isSel ? `${cp}66` : "rgba(255,255,255,.05)"}`,
                        borderRadius: 14, padding: "14px 18px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        cursor: "pointer",
                        opacity: isPast ? 0.6 : 1,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Avatar name={c.cliente_nombre} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff",
                            fontFamily: "'Syne', sans-serif", marginBottom: 3 }}>
                            {c.cliente_nombre}
                          </div>
                          <div style={{ fontSize: 11, color: "#52525b", fontFamily: "'DM Mono', monospace" }}>
                            {c.cliente_telefono}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{
                          fontSize: 11, color: cs, fontWeight: 600,
                          fontFamily: "'Syne', sans-serif",
                        }}>
                          {c.servicio}
                        </span>
                        <span style={{ fontSize: 10, color: "#52525b", fontFamily: "'DM Mono', monospace" }}>
                          {formatFechaCorta(c.fecha)} · {c.hora}
                        </span>
                        <StatusBadge fecha={c.fecha} />
                       <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
  {c.estado_cita === "cancelada" && (
    <span style={{
      fontSize: 10, padding: "3px 10px", borderRadius: 99,
      background: "rgba(113,113,122,.08)", color: "#71717a",
      border: "1px solid rgba(113,113,122,.2)",
      fontFamily: "'Syne', sans-serif", fontWeight: 600,
    }}>
      Cancelada
    </span>
  )}

  {c.estado_cita === "confirmada" && (
    <span style={{
      fontSize: 10, padding: "3px 10px", borderRadius: 99,
      background: "rgba(74,222,128,.08)", color: "#4ade80",
      border: "1px solid rgba(74,222,128,.2)",
      fontFamily: "'Syne', sans-serif", fontWeight: 600,
    }}>
      ✓ Confirmada
    </span>
  )}

  {(!c.estado_cita || c.estado_cita === "pendiente") && (
    <>
      <button
        onClick={(e) => handleConfirmar(c, e)}
        style={{
          fontSize: 10, padding: "3px 10px", borderRadius: 99,
          background: "rgba(74,222,128,.08)", color: "#4ade80",
          border: "1px solid rgba(74,222,128,.2)",
          cursor: "pointer",
          fontFamily: "'Syne', sans-serif", fontWeight: 600,
        }}
      >
        Confirmar
      </button>
      <button
        onClick={(e) => handleCancelar(c, e)}
        style={{
          fontSize: 10, padding: "3px 10px", borderRadius: 99,
          background: "rgba(239,68,68,.08)", color: "#f87171",
          border: "1px solid rgba(239,68,68,.2)",
          cursor: "pointer",
          fontFamily: "'Syne', sans-serif", fontWeight: 600,
        }}
      >
        Cancelar
      </button>
    </>
  )}
</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Sidebar derecha ── */}
          <div
            className="sidebar"
            style={{
              padding: "28px 22px",
              overflowY: "auto",
              display: "flex", flexDirection: "column",
            }}
          >
            {/* Calendario */}
<CalendarioMensual
  diasInfo={diasInfoNegocio}
  selectedDay={selectedDay}
  onSelectDay={handleSelectDay}
  bloquearPasado={false}
/>

            <div style={{ height: 1, background: "rgba(255,255,255,.04)", margin: "22px 0" }} />

            {/* Detalle */}
            <div style={{
              fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase",
              color: "#52525b", marginBottom: 12,
              fontFamily: "'Syne', sans-serif", fontWeight: 700,
            }}>
              Detalle
            </div>
{selectedDay ? (
  <AgendaDelDia citas={citas} selectedDay={selectedDay} />
) : (
  <DetalleCita cita={selectedCita} />
)}
            {/* Próximas citas widget */}
            <ProximasCitas citas={citas} cp={cp} cs={cs} />
          </div>
        </div>
      </main>
    </>
  );
}