"use client";
import { useEffect, useState } from "react";

// Sistema de notificaciones estilo Django messages: banners que aparecen y
// desaparecen solos a los 4 segundos, en vez de alert()/confirm() nativos
// del navegador. showToast() puede llamarse desde cualquier client
// component sin necesidad de envolver el árbol en un Provider.
//
// Se comunica vía un CustomEvent en `window` en vez de un array a nivel de
// módulo: Next.js puede empaquetar este archivo en chunks distintos para el
// layout raíz y para cada página, y un array "singleton" a nivel de módulo
// no queda realmente compartido entre esos chunks (cada uno tendría su
// propia copia). `window` sí es verdaderamente global sin importar cómo se
// divida el bundle, así que es el único canal confiable aquí.

type ToastType = "success" | "error" | "warning" | "info";
type ToastItem = { id: number; type: ToastType; message: string };

const DURACION_MS = 4000;
const EVENTO = "citasya:toast";

let idCounter = 0;

export function showToast(message: string, type: ToastType = "info") {
  if (typeof window === "undefined") return;
  const item: ToastItem = { id: ++idCounter, type, message };
  window.dispatchEvent(new CustomEvent<ToastItem>(EVENTO, { detail: item }));
}

export const toast = {
  success: (message: string) => showToast(message, "success"),
  error: (message: string) => showToast(message, "error"),
  warning: (message: string) => showToast(message, "warning"),
  info: (message: string) => showToast(message, "info"),
};

const ESTILOS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "✓" },
  error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-600", icon: "✕" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "!" },
  info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "i" },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handle(e: Event) {
      const item = (e as CustomEvent<ToastItem>).detail;
      setToasts((t) => [...t, item]);
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== item.id));
      }, DURACION_MS);
    }
    window.addEventListener(EVENTO, handle);
    return () => window.removeEventListener(EVENTO, handle);
  }, []);

  function cerrar(id: number) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const s = ESTILOS[t.type];
        return (
          <div
            key={t.id}
            className={`toast-item pointer-events-auto flex items-start gap-2.5 ${s.bg} ${s.border} border rounded-xl px-4 py-3 shadow-lg`}
          >
            <span
              className={`${s.text} flex-shrink-0 w-5 h-5 rounded-full border border-current flex items-center justify-center text-[11px] font-bold mt-0.5`}
            >
              {s.icon}
            </span>
            <p className={`${s.text} text-sm leading-snug flex-1`}>{t.message}</p>
            <button
              onClick={() => cerrar(t.id)}
              className={`${s.text} opacity-50 hover:opacity-100 transition-opacity text-xs flex-shrink-0`}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
