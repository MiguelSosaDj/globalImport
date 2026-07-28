"use client";
import { useEffect, useState } from "react";

// Reemplaza window.confirm() (bloqueante, estilo navegador) por un modal
// propio. confirmDialog() devuelve una Promise<boolean> igual que confirm(),
// así que el código que ya usaba `if (!confirm("...")) return;` solo cambia
// a `if (!(await confirmDialog("..."))) return;` dentro de una función
// async. <ConfirmDialogContainer /> se monta una sola vez en el layout raíz.
//
// Igual que Toast.tsx, usa CustomEvent en `window` en vez de estado a nivel
// de módulo: un módulo "singleton" puede quedar duplicado entre el chunk del
// layout raíz y el chunk de la página que llama a confirmDialog(), y cada
// copia tendría su propio `resolver` — `window` es lo único garantizado
// como verdaderamente compartido entre esos chunks.

type ConfirmOpciones = {
  confirmarTexto?: string;
  cancelarTexto?: string;
  peligroso?: boolean;
};

type ConfirmRequest = ConfirmOpciones & { id: number; mensaje: string };
type ConfirmResponse = { id: number; valor: boolean };

const EVENTO_PEDIR = "citasya:confirm-request";
const EVENTO_RESPONDER = "citasya:confirm-response";

let idCounter = 0;

export function confirmDialog(mensaje: string, opciones?: ConfirmOpciones): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  const id = ++idCounter;

  return new Promise((resolve) => {
    function handleResponse(e: Event) {
      const { id: responseId, valor } = (e as CustomEvent<ConfirmResponse>).detail;
      if (responseId !== id) return;
      window.removeEventListener(EVENTO_RESPONDER, handleResponse);
      resolve(valor);
    }
    window.addEventListener(EVENTO_RESPONDER, handleResponse);
    window.dispatchEvent(
      new CustomEvent<ConfirmRequest>(EVENTO_PEDIR, { detail: { id, mensaje, ...opciones } })
    );
  });
}

export function ConfirmDialogContainer() {
  const [state, setState] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    function handleRequest(e: Event) {
      setState((e as CustomEvent<ConfirmRequest>).detail);
    }
    window.addEventListener(EVENTO_PEDIR, handleRequest);
    return () => window.removeEventListener(EVENTO_PEDIR, handleRequest);
  }, []);

  function responder(valor: boolean) {
    if (!state) return;
    window.dispatchEvent(
      new CustomEvent<ConfirmResponse>(EVENTO_RESPONDER, { detail: { id: state.id, valor } })
    );
    setState(null);
  }

  if (!state) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center px-4"
      onClick={() => responder(false)}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white border border-slate-200 rounded-2xl shadow-xl p-6 w-full max-w-sm"
      >
        <p className="text-sm text-slate-700 leading-relaxed mb-5">{state.mensaje}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => responder(false)}
            className="text-sm font-medium px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {state.cancelarTexto || "Cancelar"}
          </button>
          <button
            onClick={() => responder(true)}
            className={`text-sm font-medium px-4 py-2 rounded-xl text-white transition-colors ${
              state.peligroso ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {state.confirmarTexto || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
