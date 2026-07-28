"use client";
import { useState, useMemo } from "react";

interface Props {
  diasInfo?: Record<string, { cantidadCitas?: number; habilitado: boolean }>;
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
  soloMostrarHabilitados?: boolean;
  bloquearPasado?: boolean;
  colorPrimario?: string; // agrega esta línea
}
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type DiaInfo = {
  dateStr: string;
  cantidadCitas?: number;
  habilitado: boolean;
};

interface Props {
  // Días con conteo de citas (para el dashboard) o disponibilidad (para agendar)
  diasInfo?: Record<string, { cantidadCitas?: number; habilitado: boolean }>;
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
  // Si true, días sin info en diasInfo quedan deshabilitados (modo cliente)
  soloMostrarHabilitados?: boolean;
  // Bloquea fechas pasadas
  bloquearPasado?: boolean;
}

export default function CalendarioMensual({
  diasInfo = {},
  selectedDay,
  onSelectDay,
  soloMostrarHabilitados = false,
  bloquearPasado = true,
   colorPrimario = "#2563eb",
}: Props) {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const today = todayStr();

  function changeMonth(dir: number) {
    setViewMonth((prev) => {
      const next = prev + dir;
      if (next > 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      if (next < 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return next;
    });
  }

  const cells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
    let startDay = new Date(viewYear, viewMonth, 1).getDay();

    const result: { label: number; dateStr?: string; otherMonth?: boolean }[] = [];

    for (let i = 0; i < startDay; i++) {
      result.push({ label: daysInPrev - startDay + 1 + i, otherMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ label: d, dateStr: `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}` });
    }
    const rem = result.length % 7 === 0 ? 0 : 7 - (result.length % 7);
    for (let i = 1; i <= rem; i++) {
      result.push({ label: i, otherMonth: true });
    }
    return result;
  }, [viewYear, viewMonth]);

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 18,
      padding: "20px 18px",
      fontFamily: "'Syne', system-ui, sans-serif",
    }}>
      {/* Header navegación */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20,
      }}>
        <button
          onClick={() => changeMonth(-1)}
          style={{
            background: "#f8fafc", border: "1px solid #e2e8f0",
            color: "#475569", width: 34, height: 34, borderRadius: 10,
            cursor: "pointer", fontSize: 18, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
        >
          ‹
        </button>
        <span style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: -0.3 }}>
          {MESES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={() => changeMonth(1)}
          style={{
            background: "#f8fafc", border: "1px solid #e2e8f0",
            color: "#475569", width: 34, height: 34, borderRadius: 10,
            cursor: "pointer", fontSize: 18, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
        >
          ›
        </button>
      </div>

      {/* Días de la semana */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7,1fr)",
        gap: 4, marginBottom: 8,
      }}>
        {DIAS_SEMANA.map((d) => (
          <div key={d} style={{
            fontSize: 11, color: "#94a3b8", textAlign: "center",
            textTransform: "uppercase", letterSpacing: 1, fontWeight: 700,
            padding: "4px 0",
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4,
      }}>
        {cells.map((cell, i) => {
          if (!cell.dateStr || cell.otherMonth) {
            return (
              <div key={i} style={{ aspectRatio: "1", display: "flex" }} />
            );
          }

          const info = diasInfo[cell.dateStr];
          const isPast = bloquearPasado && cell.dateStr < today;
          const isToday = cell.dateStr === today;
          const isSel = cell.dateStr === selectedDay;
          const cantidadCitas = info?.cantidadCitas || 0;

          // En modo cliente: deshabilita si no hay info o no está habilitado
          const deshabilitado = isPast || (soloMostrarHabilitados && !info?.habilitado);

          return (
            <button
              key={i}
              disabled={deshabilitado}
              onClick={() => !deshabilitado && onSelectDay(cell.dateStr!)}
              style={{
                aspectRatio: "1",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 2,
                borderRadius: 12,
                cursor: deshabilitado ? "not-allowed" : "pointer",
                fontFamily: "'DM Mono', monospace",
                fontSize: 14,
                fontWeight: isToday ? 800 : 500,
                position: "relative",
                background: isSel
  ? colorPrimario
  : isToday
  ? `${colorPrimario}14`
  : deshabilitado
  ? "transparent"
  : "#ffffff",
border: isSel
  ? `1px solid ${colorPrimario}`
  : isToday
  ? `1px solid ${colorPrimario}66`
  : "1px solid #e2e8f0",
                color: isSel
                  ? "#fff"
                  : deshabilitado
                  ? "#cbd5e1"
                  : isToday
                  ? colorPrimario
                  : "#1e293b",
                transition: "all .12s",
              }}
            >
              {cell.label}
              {cantidadCitas > 0 && !isSel && (
                <span style={{
                  fontSize: 8, color: colorPrimario, fontWeight: 700,
                  background: `${colorPrimario}1a`, borderRadius: 99,
                  padding: "1px 5px",
                }}>
                  {cantidadCitas}
                </span>
              )}
              {soloMostrarHabilitados && info?.habilitado && !isSel && cantidadCitas === 0 && (
                <span style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: "#22c55e",
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      {soloMostrarHabilitados && (
        <div style={{
          display: "flex", gap: 14, marginTop: 16, paddingTop: 14,
          borderTop: "1px solid #e2e8f0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: 10, color: "#64748b" }}>Disponible</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "#cbd5e1" }} />
            <span style={{ fontSize: 10, color: "#64748b" }}>No disponible</span>
          </div>
        </div>
      )}
    </div>
  );
}