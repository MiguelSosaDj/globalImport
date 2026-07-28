"use client";
import { useState, useEffect } from "react";

type Slot = { hora_inicio: string; disponible: boolean };

export default function SlotPicker({
  negocioId,
  fecha,
  horaSeleccionada,
  onSelectHora,
}: {
  negocioId: string;
  fecha: string;
  horaSeleccionada: string;
  onSelectHora: (hora: string) => void;
}) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!fecha) {
      setSlots([]);
      return;
    }
    async function cargarSlots() {
      setCargando(true);
      const res = await fetch(`/api/slots?negocioId=${negocioId}&fecha=${fecha}`);
      const { slots: data } = await res.json();
      setSlots(data || []);
      setCargando(false);
    }
    cargarSlots();
  }, [negocioId, fecha]);

  function formatHora(h: string) {
    const [hh, mm] = h.split(":");
    const hora = parseInt(hh);
    const ampm = hora >= 12 ? "PM" : "AM";
    const hora12 = hora % 12 === 0 ? 12 : hora % 12;
    return `${hora12}:${mm} ${ampm}`;
  }

  if (!fecha) {
    return (
      <div style={{
        textAlign: "center", padding: "20px", color: "#64748b",
        fontSize: 12, fontFamily: "system-ui",
      }}>
        Selecciona una fecha primero
      </div>
    );
  }

  if (cargando) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: 12 }}>
        Cargando horarios...
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div style={{
        textAlign: "center", padding: "20px", color: "#64748b",
        fontSize: 12, background: "#f8fafc",
        border: "1px dashed #cbd5e1", borderRadius: 10,
      }}>
        El negocio no atiende este día
      </div>
    );
  }

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
      maxHeight: 220, overflowY: "auto", padding: "4px 2px",
    }}>
      {slots.map((s) => {
        const isSel = s.hora_inicio === horaSeleccionada;
        return (
          <button
            key={s.hora_inicio}
            type="button"
            disabled={!s.disponible}
            onClick={() => onSelectHora(s.hora_inicio)}
            style={{
              padding: "8px 4px", borderRadius: 8, fontSize: 11,
              fontFamily: "monospace", fontWeight: 600,
              cursor: s.disponible ? "pointer" : "not-allowed",
              background: isSel
                ? "#2563eb"
                : s.disponible
                ? "#f8fafc"
                : "#fef2f2",
              color: isSel ? "#fff" : s.disponible ? "#1e293b" : "#94a3b8",
              border: `1px solid ${
                isSel
                  ? "#2563eb"
                  : s.disponible
                  ? "#e2e8f0"
                  : "#fecaca"
              }`,
              textDecoration: s.disponible ? "none" : "line-through",
              transition: "all .15s",
            }}
          >
            {formatHora(s.hora_inicio)}
          </button>
        );
      })}
    </div>
  );
}