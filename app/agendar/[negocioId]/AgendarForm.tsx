"use client";

import { useState } from "react";
import Link from "next/link";

const SERVICIOS_POR_TIPO: Record<string, string[]> = {
  barberia: ["Corte de cabello", "Barba", "Corte + barba", "Tinte"],
  medico: ["Consulta general", "Control", "Examen", "Urgencia"],
  mecanico: ["Cambio de aceite", "Frenos", "Suspension", "Diagnostico"],
  masajista: ["Masaje relajante", "Masaje deportivo", "Reflexologia"],
};

// Precios por servicio (en USD). Ajusta según necesites.
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
  const [estado, setEstado] = useState<"idle" | "pago" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const monto = PRECIOS_POR_SERVICIO[form.servicio] || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEstado("pago");
    setErrorMsg("");

    try {
      // Crear sesión de checkout en Stripe
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          negocioId: negocio.id,
          clienteNombre: form.cliente_nombre,
          clienteTelefono: form.cliente_telefono,
          servicio: form.servicio,
          fecha: form.fecha,
          hora: form.hora,
          monto: monto,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al crear sesión de pago");
      }

      const { url } = await res.json();

      if (url) {
        // Redirigir a Stripe Checkout
        window.location.href = url;
      }
    } catch (error: any) {
      console.error("Error:", error);
      setErrorMsg(error.message || "Error al procesar el pago");
      setEstado("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[600px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 bg-white/[0.03] border border-white/10 rounded-2xl p-8 w-full max-w-md">
        <div className="mb-6">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            CitasYa
          </Link>
          <h1 className="text-2xl font-bold text-white mt-3">Agendar cita</h1>
          <p className="text-sm text-zinc-500 mt-1">{negocio.nombre}</p>
        </div>

        {estado === "error" && (
          <div className="mb-6 bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl border border-red-500/20">
            {errorMsg || "Algo salió mal. Intenta de nuevo."}
          </div>
        )}

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-zinc-400">Fecha</label>
              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                required
                className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-400">Hora</label>
              <input
                type="time"
                name="hora"
                value={form.hora}
                onChange={handleChange}
                required
                className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {/* Resumen de pago */}
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-zinc-400">Servicio:</span>
              <span className="text-sm font-medium text-white">{form.servicio}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Total:</span>
              <span className="text-lg font-bold text-violet-400">${monto.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={estado === "pago"}
            className="mt-6 w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {estado === "pago" ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Procesando pago...
              </>
            ) : (
              `Pagar $${monto.toFixed(2)} y confirmar cita`
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

