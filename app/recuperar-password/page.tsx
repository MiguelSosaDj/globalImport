"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "cargando" | "enviado" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEstado("cargando");
    setErrorMsg("");

    const supabase = getSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-password`,
    });

    if (error) {
      setErrorMsg(error.message);
      setEstado("error");
      return;
    }

    setEstado("enviado");
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="relative z-10 bg-white border border-slate-200 shadow-sm rounded-2xl p-8 w-full max-w-md">
        <div className="mb-6">
          <Link href="/login" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
            Volver a iniciar sesión
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">Recuperar contraseña</h1>
          <p className="text-sm text-slate-500 mt-1">
            Te enviaremos un link a tu correo para crear una nueva contraseña.
          </p>
        </div>

        {estado === "enviado" ? (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-200">
            Si el correo existe, te enviamos un link para restablecer tu contraseña. Revisa tu
            bandeja de entrada (y spam).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {estado === "error" && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="negocio@email.com"
                className="mt-1.5 w-full rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={estado === "cargando"}
              className="mt-1 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-3 rounded-xl transition-colors"
            >
              {estado === "cargando" ? "Enviando..." : "Enviar link de recuperación"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
