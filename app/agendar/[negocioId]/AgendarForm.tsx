"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const SERVICIOS_POR_TIPO: Record<string, string[]> = {
  barberia: ["Corte de cabello", "Barba", "Corte + barba", "Tinte"],
  medico: ["Consulta general", "Control", "Examen", "Urgencia"],
  mecanico: ["Cambio de aceite", "Frenos", "Suspension", "Diagnostico"],
  masajista: ["Masaje relajante", "Masaje deportivo", "Reflexologia"],
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
  const [estado, setEstado] = useState<"idle" | "cargando" | "ok" | "error">("idle");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEstado("cargando");

    const { error } = await supabase.from("citas").insert({
      ...form,
      negocio_id: negocio.id,
    });

    if (error) {
      setEstado("error");
    } else {
      setEstado("ok");
      setForm({
        cliente_nombre: "",
        cliente_telefono: "",
        servicio: servicios[0],
        fecha: "",
        hora: "",
      });
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

        {estado === "ok" && (
          <div className="mb-6 bg-green-500/10 text-green-400 text-sm px-4 py-3 rounded-xl border border-green-500/20">
            Cita agendada. Te esperamos.
          </div>
        )}
        {estado === "error" && (
          <div className="mb-6 bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl border border-red-500/20">
            Algo salio mal. Intenta de nuevo.
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

          <button
            type="submit"
            disabled={estado === "cargando"}
            className="mt-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-3 rounded-xl transition-colors"
          >
            {estado === "cargando" ? "Agendando..." : "Confirmar cita"}
          </button>
        </form>
      </div>
    </main>
  );
}
