"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import SlotPicker from "./SlotPicker";
import CalendarioMensual from "@/app/components/CalendarioMensual";


const SERVICIOS_POR_TIPO: Record<string, string[]> = {
  barberia: ["Corte de cabello", "Barba", "Corte + barba", "Tinte"],
  medico: ["Consulta general", "Control", "Examen", "Urgencia"],
  mecanico: ["Cambio de aceite", "Frenos", "Suspension", "Diagnostico"],
  masajista: ["Masaje relajante", "Masaje deportivo", "Reflexologia"],
};

const PRECIOS_POR_SERVICIO: Record<string, number> = {
  "Corte de cabello": 15,
  "Barba": 10,
  "Corte + barba": 22,
  "Tinte": 30,
  "Consulta general": 50,
  "Control": 40,
  "Examen": 60,
  "Urgencia": 80,
  "Cambio de aceite": 35,
  "Frenos": 45,
  "Suspension": 55,
  "Diagnostico": 75,
  "Masaje relajante": 45,
  "Masaje deportivo": 50,
  "Reflexologia": 40,
};

const SERVICIOS_DEFAULT = ["Servicio 1", "Servicio 2", "Servicio 3"];

type Negocio = {
  id: string;
  nombre: string;
  tipo: string;
  requiere_pago: boolean;
  logo_url?: string;
  color_primario?: string;
  color_secundario?: string;
};

export default function AgendarForm({ negocio }: { negocio: Negocio }) {
  const servicios = SERVICIOS_POR_TIPO[negocio.tipo] || SERVICIOS_DEFAULT;

  const [form, setForm] = useState({
    cliente_nombre: "",
    cliente_telefono: "",
    servicio: servicios[0],
    fecha: "",
    hora: "",
  });
  const [estado, setEstado] = useState<"idle" | "cargando" | "pago" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [ultimoTelefono, setUltimoTelefono] = useState("");
  const [diasActivos, setDiasActivos] = useState<number[]>([]);

useEffect(() => {
  async function cargarDiasActivos() {
    const res = await fetch(`/api/negocios/dias-habilitados?negocioId=${negocio.id}`);
    const { diasActivos } = await res.json();
    setDiasActivos(diasActivos || []);
  }
  cargarDiasActivos();
}, [negocio.id]);

// Construye diasInfo para los próximos 90 días según el día de la semana habilitado
const diasInfo = useMemo(() => {
  const map: Record<string, { habilitado: boolean }> = {};
  const hoy = new Date();
  for (let i = 0; i < 90; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);
    const dateStr = fecha.toISOString().slice(0, 10);
    const diaSemana = fecha.getDay();
    map[dateStr] = { habilitado: diasActivos.includes(diaSemana) };
  }
  return map;
}, [diasActivos]);

  const monto = PRECIOS_POR_SERVICIO[form.servicio] || 0;
  
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEstado("cargando");
    setErrorMsg("");

    try {
      if (negocio.requiere_pago) {
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            negocioId: negocio.id,
            clienteNombre: form.cliente_nombre,
            clienteTelefono: form.cliente_telefono,
            servicio: form.servicio,
            fecha: form.fecha,
            hora: form.hora,
            monto: PRECIOS_POR_SERVICIO[form.servicio] || 0,
          }),
        });

        if (!res.ok) throw new Error("Error al crear sesion de pago");
        const { url } = await res.json();
        if (url) window.location.href = url;

      } else {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error } = await supabase.from("citas").insert({
          negocio_id: negocio.id,
          cliente_nombre: form.cliente_nombre,
          cliente_telefono: form.cliente_telefono,
          servicio: form.servicio,
          fecha: form.fecha,
          hora: form.hora,
          estado_cita: "pendiente",
        });

        if (error) throw new Error(error.message);

        setUltimoTelefono(form.cliente_telefono);
        setEstado("ok");
        setForm({
          cliente_nombre: "",
          cliente_telefono: "",
          servicio: servicios[0],
          fecha: "",
          hora: "",
        });
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Error al procesar");
      setEstado("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div
  className="fixed inset-0 pointer-events-none"
  style={{
    background: `radial-gradient(circle at 50% -20%, ${negocio.color_primario || "#7c3aed"}1a, transparent 60%)`,
  }}
/>

<div className="relative z-10 bg-white/[0.03] border border-white/10 rounded-2xl p-8 w-full max-w-lg">
        {/* Header */}
        <div className="mb-6">
  <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
    CitasYa
  </Link>
  <div className="flex items-center gap-3 mt-3">
    {negocio.logo_url ? (
      <img
        src={negocio.logo_url}
        alt={negocio.nombre}
        className="w-12 h-12 rounded-xl object-cover border border-white/10"
      />
    ) : (
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
        style={{
          background: `linear-gradient(135deg, ${negocio.color_primario || "#7c3aed"}, ${negocio.color_secundario || "#a855f7"})`,
        }}
      >
        🏢
      </div>
    )}
    <div>
      <h1 className="text-2xl font-bold text-white">Agendar cita</h1>
      <p className="text-sm text-zinc-500">{negocio.nombre}</p>
    </div>
  </div>
</div>

        {/* Mensaje éxito */}
        {estado === "ok" && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-lg">✅</span>
              <span className="text-green-400 text-sm font-semibold">
                Cita agendada correctamente
              </span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Nos comunicaremos contigo al numero{" "}
              <span className="text-white font-medium">{ultimoTelefono}</span>{" "}
              por WhatsApp para confirmar tu cita.
            </p>
            <p className="text-zinc-600 text-xs">
              Si no recibes mensaje en los proximos minutos, escribenos directamente.
            </p>
          </div>
        )}

        {/* Mensaje error */}
        {estado === "error" && (
          <div className="mb-6 bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl border border-red-500/20">
            {errorMsg || "Algo salio mal. Intenta de nuevo."}
          </div>
        )}

        {/* Formulario — se oculta cuando queda ok */}
        {estado !== "ok" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-zinc-400">Nombre</label>
              <input
                name="cliente_nombre"
                value={form.cliente_nombre}
                onChange={handleChange}
                required
                placeholder="Juan Perez"
                className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-400">Telefono</label>
              <input
                name="cliente_telefono"
                value={form.cliente_telefono}
                onChange={handleChange}
                required
                placeholder="3001234567"
                className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-400">Servicio</label>
              <select
                name="servicio"
                value={form.servicio}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
              >
                {servicios.map((s) => (
                  <option key={s} value={s} className="bg-zinc-900">
                    {s}
                  </option>
                ))}
              </select>
            </div>

           <div className="flex flex-col gap-3">
  <div>
    <label className="text-sm font-medium text-zinc-400">Selecciona fecha</label>
    <div className="mt-1.5">
     <CalendarioMensual
  diasInfo={diasInfo}
  selectedDay={form.fecha}
  onSelectDay={(dia) => setForm((f) => ({ ...f, fecha: dia, hora: "" }))}
  soloMostrarHabilitados={true}
  bloquearPasado={true}
  colorPrimario={negocio.color_primario || "#7c3aed"}
/>
    </div>
  </div>

  {form.fecha && (
    <div>
      <label className="text-sm font-medium text-zinc-400">Hora disponible</label>
      <div className="mt-1.5 bg-white/5 border border-white/10 rounded-xl p-3">
        <SlotPicker
          negocioId={negocio.id}
          fecha={form.fecha}
          horaSeleccionada={form.hora}
          onSelectHora={(hora) => setForm((f) => ({ ...f, hora }))}
        />
      </div>
    </div>
  )}
</div>

            {/* Resumen de pago — solo si requiere_pago */}
            {negocio.requiere_pago && (
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-400">Servicio:</span>
                  <span className="text-sm font-medium text-white">{form.servicio}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400">Total:</span>
                  <span className="text-lg font-bold text-violet-400">
                    ${monto.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <button
  type="submit"
  disabled={estado === "cargando"}
  className="mt-2 w-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
  style={{
    background: `linear-gradient(135deg, ${negocio.color_primario || "#7c3aed"}, ${negocio.color_secundario || "#a855f7"})`,
  }}
>
  {estado === "cargando" ? (
    <>
      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      {negocio.requiere_pago ? "Procesando pago..." : "Agendando..."}
    </>
  ) : negocio.requiere_pago ? (
    `Pagar $${monto.toFixed(2)} y confirmar`
  ) : (
    "Confirmar cita"
  )}
</button>
          </form>
        )}

        {/* Botón agendar otra */}
        {estado === "ok" && (
          <button
            onClick={() => setEstado("idle")}
            className="w-full mt-2 border border-white/10 text-zinc-400 hover:text-white text-sm font-medium py-3 rounded-xl transition-colors"
          >
            Agendar otra cita
          </button>
        )}

      </div>
    </main>
  );
}