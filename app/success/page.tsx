"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session_id") || "");
  }, []);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="relative z-10 bg-white border border-slate-200 shadow-sm rounded-2xl p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">¡Cita Confirmada!</h1>
          <p className="text-sm text-slate-500 mt-2">Tu pago fue procesado exitosamente</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-green-700 text-sm">
            Recibirás una confirmación por correo pronto. Te esperamos en tu cita agendada.
          </p>
        </div>

        {sessionId && (
          <p className="text-xs text-slate-400 mb-6">
            ID de transacción: <span className="font-mono">{sessionId.slice(0, 20)}...</span>
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href="/agendar"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Agendar otra cita
          </Link>
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-700 py-2 px-4 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
