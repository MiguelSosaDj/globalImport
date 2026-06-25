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
        textAlign: "center", padding: "20px", color: "#52525b",
        fontSize: 12, fontFamily: "system-ui",
      }}>
        Selecciona una fecha primero
      </div>
    );
  }

  if (cargando) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "#52525b", fontSize: 12 }}>
        Cargando horarios...
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div style={{
        textAlign: "center", padding: "20px", color: "#71717a",
        fontSize: 12, background: "rgba(255,255,255,.02)",
        border: "1px dashed rgba(255,255,255,.08)", borderRadius: 10,
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
                ? "rgba(124,58,237,.6)"
                : s.disponible
                ? "rgba(255,255,255,.04)"
                : "rgba(239,68,68,.05)",
              color: isSel ? "#fff" : s.disponible ? "#e4e4e7" : "#52525b",
              border: `1px solid ${
                isSel
                  ? "rgba(124,58,237,.8)"
                  : s.disponible
                  ? "rgba(255,255,255,.08)"
                  : "rgba(239,68,68,.15)"
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