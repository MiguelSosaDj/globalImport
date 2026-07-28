"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [estado, setEstado] = useState<"idle" | "cargando" | "error">("idle");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setEstado("cargando");

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: form.email,
    password: form.password,
  });

  if (error) {
    console.error("Error login:", error.message);
    setEstado("error");
    return;
  }

  console.log("Usuario logueado:", data.user);

  window.location.href = "/dashboard";
}

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="relative z-10 bg-white border border-slate-200 shadow-sm rounded-2xl p-8 w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
            Volver al inicio
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">Iniciar sesion</h1>
          <p className="text-sm text-slate-500 mt-1">Bienvenido de vuelta</p>
        </div>

        {estado === "error" && (
          <div className="mb-6 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
            Email o contrasena incorrectos
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              placeholder="Tu contrasena"
              className="mt-1.5 w-full rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={estado === "cargando"}
            className="mt-1 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-3 rounded-xl transition-colors"
          >
            {estado === "cargando" ? "Entrando..." : "Iniciar sesion"}
          </button>

          <p className="text-center text-sm text-slate-500">
            <Link href="/recuperar-password" className="text-blue-600 hover:text-blue-700 transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}