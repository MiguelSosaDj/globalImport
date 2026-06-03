"use client";

import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[600px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 bg-white/[0.03] border border-white/10 rounded-2xl p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Pago Cancelado</h1>
          <p className="text-sm text-zinc-500 mt-2">Tu pago no fue procesado</p>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">
            No se realizó ningún cargo. Puedes intentar de nuevo cuando quieras.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/agendar"
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Intentar de nuevo
          </Link>
          <Link
            href="/"
            className="text-zinc-400 hover:text-zinc-300 py-2 px-4 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
