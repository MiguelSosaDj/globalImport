"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[600px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 bg-white/[0.03] border border-white/10 rounded-2xl p-8 w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Volver al inicio
          </Link>
          <h1 className="text-2xl font-bold text-white mt-3">Iniciar sesion</h1>
          <p className="text-sm text-zinc-500 mt-1">Bienvenido de vuelta</p>
        </div>

        {estado === "error" && (
          <div className="mb-6 bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl border border-red-500/20">
            Email o contrasena incorrectos
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium text-zinc-400">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="negocio@email.com"
              className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-400">Contrasena</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Tu contrasena"
              className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={estado === "cargando"}
            className="mt-1 w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-3 rounded-xl transition-colors"
          >
            {estado === "cargando" ? "Entrando..." : "Iniciar sesion"}
          </button>

          <p className="text-center text-sm text-zinc-500">
            No tienes cuenta?{" "}
            <Link href="/registro" className="text-violet-400 hover:text-violet-300 transition-colors">
              Registrate gratis
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}