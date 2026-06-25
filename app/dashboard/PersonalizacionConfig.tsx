"use client";
import { useState, useRef } from "react";

interface Props {
  negocioId: string;
  logoActual?: string;
  colorPrimarioActual?: string;
  colorSecundarioActual?: string;
}

export default function PersonalizacionConfig({
  negocioId,
  logoActual,
  colorPrimarioActual = "#7c3aed",
  colorSecundarioActual = "#a855f7",
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [logoPreview, setLogoPreview] = useState(logoActual || "");
  const [colorPrimario, setColorPrimario] = useState(colorPrimarioActual);
  const [colorSecundario, setColorSecundario] = useState(colorSecundarioActual);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoLogo(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("negocioId", negocioId);

    const res = await fetch("/api/negocios/logo", {
      method: "POST",
      body: formData,
    });

    setSubiendoLogo(false);

    if (res.ok) {
      const { logoUrl } = await res.json();
      setLogoPreview(logoUrl);
    } else {
      alert("Error al subir el logo");
    }
  }

  async function guardarColores() {
    setGuardando(true);
    setGuardado(false);
    const res = await fetch("/api/negocios/personalizacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ negocioId, colorPrimario, colorSecundario }),
    });
    setGuardando(false);
    if (res.ok) {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } else {
      alert("Error al guardar los colores");
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
          color: colorPrimario,
          fontFamily: "'Syne', sans-serif", fontWeight: 700,
        }}>
          🎨 Personalización de marca
        </div>
        <span style={{ color: "#52525b", fontSize: 14 }}>{abierto ? "−" : "+"}</span>
      </button>

      {abierto && (
        <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Logo */}
          <div>
            <label style={{
              fontSize: 11, color: "#71717a", fontFamily: "'Syne', sans-serif",
              fontWeight: 600, display: "block", marginBottom: 8,
            }}>
              Logo del negocio
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                background: logoPreview
                  ? `url(${logoPreview})`
                  : `linear-gradient(135deg, ${colorPrimario}22, ${colorSecundario}22)`,
                backgroundSize: "cover", backgroundPosition: "center",
                border: `1px solid ${colorPrimario}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, color: colorPrimario, flexShrink: 0,
              }}>
                {!logoPreview && "🏢"}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={subiendoLogo}
                style={{
                  fontSize: 11, padding: "8px 14px", borderRadius: 8,
                  background: `${colorPrimario}1a`,
                  color: colorSecundario,
                  border: `1px solid ${colorPrimario}40`,
                  cursor: "pointer",
                  fontFamily: "'Syne', sans-serif", fontWeight: 600,
                }}
              >
                {subiendoLogo ? "Subiendo..." : "Subir logo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Colores */}
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{
                fontSize: 11, color: "#71717a", fontFamily: "'Syne', sans-serif",
                fontWeight: 600, display: "block", marginBottom: 8,
              }}>
                Color primario
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="color"
                  value={colorPrimario}
                  onChange={(e) => setColorPrimario(e.target.value)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: "none",
                    cursor: "pointer", background: "none", padding: 0,
                  }}
                />
                <span style={{
                  fontSize: 11, color: colorPrimario,
                  fontFamily: "'DM Mono', monospace", fontWeight: 700,
                }}>
                  {colorPrimario}
                </span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{
                fontSize: 11, color: "#71717a", fontFamily: "'Syne', sans-serif",
                fontWeight: 600, display: "block", marginBottom: 8,
              }}>
                Color secundario
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="color"
                  value={colorSecundario}
                  onChange={(e) => setColorSecundario(e.target.value)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: "none",
                    cursor: "pointer", background: "none", padding: 0,
                  }}
                />
                <span style={{
                  fontSize: 11, color: colorSecundario,
                  fontFamily: "'DM Mono', monospace", fontWeight: 700,
                }}>
                  {colorSecundario}
                </span>
              </div>
            </div>
          </div>

          {/* Preview del gradiente */}
          <div style={{
            height: 36, borderRadius: 8,
            background: `linear-gradient(135deg, ${colorPrimario}, ${colorSecundario})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: "#fff", fontWeight: 700,
            fontFamily: "'Syne', sans-serif", letterSpacing: 0.5,
          }}>
            Vista previa
          </div>

          <button
            onClick={guardarColores}
            disabled={guardando}
            style={{
              padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
              background: guardado
                ? "rgba(74,222,128,.15)"
                : `linear-gradient(135deg, ${colorPrimario}, ${colorSecundario})`,
              color: guardado ? "#4ade80" : "#fff",
              fontSize: 12, fontWeight: 600, fontFamily: "'Syne', sans-serif",
            }}
          >
            {guardando ? "Guardando..." : guardado ? "✓ Guardado" : "Guardar personalización"}
          </button>
        </div>
      )}
    </div>
  );
}