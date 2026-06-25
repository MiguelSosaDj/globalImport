"use client";
import { useState, useEffect } from "react";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DURACIONES = [15, 30, 45, 60, 90];

type HorarioDia = {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
};

export default function HorariosConfig({ negocioId, duracionActual }: {
  negocioId: string;
  duracionActual: number;
}) {
  const [horarios, setHorarios] = useState<HorarioDia[]>(
    DIAS.map((_, i) => ({
      dia_semana: i,
      hora_inicio: "10:00",
      hora_fin: "18:00",
      activo: i >= 1 && i <= 6,
    }))
  );
  const [duracion, setDuracion] = useState(duracionActual || 30);
  const [cargando, setCargando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    async function cargar() {
      const res = await fetch(`/api/negocios/horarios?negocioId=${negocioId}`);
      const { horarios: data } = await res.json();
      if (data && data.length > 0) {
        setHorarios(
          DIAS.map((_, i) => {
            const existente = data.find((h: any) => h.dia_semana === i);
            return existente
              ? {
                  dia_semana: i,
                  hora_inicio: existente.hora_inicio?.slice(0, 5) || "10:00",
                  hora_fin: existente.hora_fin?.slice(0, 5) || "18:00",
                  activo: existente.activo,
                }
              : { dia_semana: i, hora_inicio: "10:00", hora_fin: "18:00", activo: false };
          })
        );
      }
    }
    if (abierto) cargar();
  }, [abierto, negocioId]);

  function actualizarDia(dia: number, campo: keyof HorarioDia, valor: any) {
    setHorarios((prev) =>
      prev.map((h) => (h.dia_semana === dia ? { ...h, [campo]: valor } : h))
    );
  }

  async function guardar() {
    setCargando(true);
    setGuardado(false);
    const res = await fetch("/api/negocios/horarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ negocioId, horarios, duracionCita: duracion }),
    });
    setCargando(false);
    if (res.ok) {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } else {
      alert("Error al guardar los horarios");
    }
  }

  return (
    <div style={{
      background: "#0a0a0a",
      border: "1px solid rgba(255,255,255,.05)",
      borderRadius: 14, marginBottom: 28, overflow: "hidden",
    }}>
      <button
        onClick={() => setAbierto(!abierto)}
        style={{
          width: "100%", padding: "14px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "transparent", border: "none", cursor: "pointer",
        }}
      >
        <div style={{
          fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase",
          color: "#7c3aed", fontFamily: "'Syne', sans-serif", fontWeight: 700,
        }}>
          🕐 Horarios de disponibilidad
        </div>
        <span style={{ color: "#52525b", fontSize: 14 }}>{abierto ? "−" : "+"}</span>
      </button>

      {abierto && (
        <div style={{ padding: "0 18px 18px" }}>
          {/* Duración de cita */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              fontSize: 11, color: "#71717a", fontFamily: "'Syne', sans-serif",
              fontWeight: 600, display: "block", marginBottom: 6,
            }}>
              Duración de cada cita
            </label>
            <select
              value={duracion}
              onChange={(e) => setDuracion(Number(e.target.value))}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 8,
                background: "#0f0f0f", border: "1px solid rgba(255,255,255,.08)",
                color: "#fff", fontSize: 12, fontFamily: "'DM Mono', monospace",
              }}
            >
              {DURACIONES.map((d) => (
                <option key={d} value={d}>{d} minutos</option>
              ))}
            </select>
          </div>

          {/* Días */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {horarios.map((h) => (
              <div
                key={h.dia_semana}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 10,
                  background: h.activo ? "rgba(124,58,237,.05)" : "#0f0f0f",
                  border: `1px solid ${h.activo ? "rgba(124,58,237,.2)" : "rgba(255,255,255,.04)"}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={h.activo}
                  onChange={(e) => actualizarDia(h.dia_semana, "activo", e.target.checked)}
                  style={{ accentColor: "#7c3aed", width: 14, height: 14 }}
                />
                <span style={{
                  fontSize: 11, color: h.activo ? "#e4e4e7" : "#52525b",
                  fontFamily: "'Syne', sans-serif", fontWeight: 600, width: 80, flexShrink: 0,
                }}>
                  {DIAS[h.dia_semana]}
                </span>
                <input
                  type="time"
                  value={h.hora_inicio}
                  disabled={!h.activo}
                  onChange={(e) => actualizarDia(h.dia_semana, "hora_inicio", e.target.value)}
                  style={{
                    padding: "5px 8px", borderRadius: 6, fontSize: 11,
                    background: "#0a0a0a", border: "1px solid rgba(255,255,255,.06)",
                    color: h.activo ? "#fff" : "#3f3f46",
                    fontFamily: "'DM Mono', monospace",
                  }}
                />
                <span style={{ color: "#52525b", fontSize: 11 }}>—</span>
                <input
                  type="time"
                  value={h.hora_fin}
                  disabled={!h.activo}
                  onChange={(e) => actualizarDia(h.dia_semana, "hora_fin", e.target.value)}
                  style={{
                    padding: "5px 8px", borderRadius: 6, fontSize: 11,
                    background: "#0a0a0a", border: "1px solid rgba(255,255,255,.06)",
                    color: h.activo ? "#fff" : "#3f3f46",
                    fontFamily: "'DM Mono', monospace",
                  }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={guardar}
            disabled={cargando}
            style={{
              marginTop: 16, width: "100%", padding: "10px",
              borderRadius: 10, border: "none", cursor: "pointer",
              background: guardado ? "rgba(74,222,128,.15)" : "rgba(124,58,237,.6)",
              color: guardado ? "#4ade80" : "#fff",
              fontSize: 12, fontWeight: 600, fontFamily: "'Syne', sans-serif",
            }}
          >
            {cargando ? "Guardando..." : guardado ? "✓ Guardado" : "Guardar horarios"}
          </button>
        </div>
      )}
    </div>
  );
}