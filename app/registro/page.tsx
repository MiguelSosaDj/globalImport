"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

// Plantilla inicial de servicios por tipo de negocio: se crea al registrarse
// como punto de partida editable en el dashboard (Servicios). Son precios de
// ejemplo en COP, no precios reales — el dueño los ajusta de inmediato.
const SERVICIOS_SEED_POR_TIPO: Record<
  string,
  { nombre: string; duracion_min: number; precio: number }[]
> = {
  barberia: [
    { nombre: "Corte de cabello", duracion_min: 30, precio: 25000 },
    { nombre: "Barba", duracion_min: 20, precio: 15000 },
    { nombre: "Corte + barba", duracion_min: 45, precio: 35000 },
  ],
  medico: [
    { nombre: "Consulta general", duracion_min: 30, precio: 80000 },
    { nombre: "Control", duracion_min: 20, precio: 60000 },
  ],
  mecanico: [
    { nombre: "Cambio de aceite", duracion_min: 45, precio: 70000 },
    { nombre: "Diagnostico", duracion_min: 30, precio: 50000 },
  ],
  fisioterapia: [
    { nombre: "Sesión de fisioterapia", duracion_min: 45, precio: 60000 },
    { nombre: "Masaje terapéutico", duracion_min: 45, precio: 55000 },
    { nombre: "Evaluación inicial", duracion_min: 30, precio: 50000 },
  ],
};

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "",
    tipo: "barberia",
    email: "",
    password: "",
  });
  const [estado, setEstado] = useState<"idle" | "cargando" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEstado("cargando");

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error || !data.user) {
      setErrorMsg(error?.message || "Error al registrarse");
      setEstado("error");
      return;
    }

    const { data: negocio, error: negocioError } = await supabase
      .from("negocios")
      .insert({
        nombre: form.nombre,
        tipo: form.tipo,
        user_id: data.user.id,
      })
      .select("id")
      .single();

    if (negocioError || !negocio) {
      setErrorMsg("Cuenta creada pero error al guardar el negocio");
      setEstado("error");
      return;
    }

    const seed = SERVICIOS_SEED_POR_TIPO[form.tipo];
    if (seed) {
      await supabase.from("servicios").insert(
        seed.map((s) => ({
          negocio_id: negocio.id,
          nombre: s.nombre,
          duracion_min: s.duracion_min,
          precio: s.precio,
        }))
      );
      // No bloqueamos el registro si esto falla (p.ej. la migración de
      // servicios aún no se ha aplicado) — el negocio ya quedó creado.
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="relative z-10 bg-white border border-slate-200 shadow-sm rounded-2xl p-8 w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
            Volver al inicio
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">Crear cuenta</h1>
          <p className="text-sm text-slate-500 mt-1">Registra tu negocio en CitasYa</p>
        </div>

        {estado === "error" && (
          <div className="mb-6 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium text-slate-600">Nombre del negocio</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              placeholder="Barberia El Corte"
              className="mt-1.5 w-full rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">Tipo de negocio</label>
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="barberia">Barberia</option>
              <option value="medico">Medico</option>
              <option value="mecanico">Mecanico</option>
              <option value="fisioterapia">Fisioterapia y bienestar</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="negocio@email.com"
              className="mt-1.5 w-full rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">Contrasena</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Minimo 6 caracteres"
              className="mt-1.5 w-full rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={estado === "cargando"}
            className="mt-1 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-3 rounded-xl transition-colors"
          >
            {estado === "cargando" ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Ya tienes cuenta?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 transition-colors">
              Inicia sesion
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}