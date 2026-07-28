"use client";

import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="relative z-10 bg-white border border-slate-200 shadow-sm rounded-2xl p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
          <h1 className="text-3xl font-bold text-slate-900">Pago Cancelado</h1>
          <p className="text-sm text-slate-500 mt-2">Tu pago no fue procesado</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 text-sm">
            No se realizó ningún cargo. Puedes intentar de nuevo cuando quieras.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/agendar"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Intentar de nuevo
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
