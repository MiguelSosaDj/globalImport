"use client";
import { useState } from "react";

const PLANES = [
  {
    nombre: "Básico",
    descripcion: "Para negocios que están empezando",
    mensual: { precio: 59900, priceId: "price_1ThYNTGPom06FybKysNM1a4K" },
    anual: { precio: 575040, priceId: "price_1ThYPSGPom06FybKyfvVQlVR", porMes: 47920 },
    features: [
      "Hasta 50 citas por mes",
      "1 negocio",
      "Link de agendamiento único",
      "Dashboard de gestión",
      "Soporte por email",
    ],
    popular: false,
    badge: null,
  },
  {
    nombre: "Pro",
    descripcion: "Para negocios en crecimiento",//
    mensual: { precio: 99900, priceId: "price_1ThYOuGPom06FybK9MHv5cNd" },
    anual: { precio: 959040, priceId: "price_1ThYOuGPom06FybKxtXPRdG4", porMes: 79920 },
    features: [
      "Hasta 200 citas por mes",
      "1 negocio",
      "Link de agendamiento único",
      "Dashboard de gestión",
      "Notificaciones por WhatsApp",
      "Cobro anticipado en citas",
      "Soporte por email y chat",
    ],
    popular: true,
    badge: "Más popular",
  },
  {
    nombre: "Premium",
    descripcion: "Para negocios consolidados",
    mensual: { precio: 129900, priceId: "price_1ThYQ3GPom06FybKFsKrDrQU" },
    anual: { precio: 1247040, priceId: "price_1ThYQTGPom06FybK10wfALT5", porMes: 103920 },
    features: [
      "Citas ilimitadas",
      "Hasta 3 negocios",
      "Links de agendamiento únicos",
      "Dashboard de gestión",
      "Notificaciones por WhatsApp",
      "Cobro anticipado en citas",
      "Reportes y métricas",
      "Soporte prioritario",
    ],
    popular: false,
    badge: null,
  },
];

function formatCOP(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);
}

interface ModalCheckoutProps {
  plan: { nombre: string; precio: number };
  priceId: string;
  onClose: () => void;
}

function ModalCheckout({ plan, priceId, onClose }: ModalCheckoutProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!email.trim()) {
      setError("El email es requerido");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/create-subscription-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, plan: plan.nombre, nombre, email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear sesión");
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setCargando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 flex flex-col gap-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors text-xl leading-none"
        >
          ×
        </button>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-widest uppercase text-blue-600">
            Plan {plan.nombre}
          </p>
          <h3 className="text-xl font-bold text-slate-900">Empieza tu prueba gratis</h3>
          <p className="text-sm text-slate-500">
            7 días gratis, sin cobro. Cancela cuando quieras.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-slate-600">Después del trial</span>
          <span className="text-sm font-semibold text-slate-900">
            {formatCOP(plan.precio)}/mes
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500">Nombre (opcional)</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre o el del negocio"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500">
              Email <span className="text-blue-600">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="tu@email.com"
              className={`w-full bg-white border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                error
                  ? "border-red-400 focus:border-red-500"
                  : "border-slate-300 focus:border-blue-500"
              }`}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={cargando}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Redirigiendo a Stripe...
            </span>
          ) : (
            "Continuar a pago seguro →"
          )}
        </button>

        <p className="text-center text-xs text-slate-400">
          🔒 Pago seguro con Stripe. No guardamos datos de tu tarjeta.
        </p>
      </div>
    </div>
  );
}

export default function PlanesSection() {
  const [anual, setAnual] = useState(false);
  const [modalData, setModalData] = useState<{
    planNombre: string;
    precio: number;
    priceId: string;
  } | null>(null);

  function abrirModal(planNombre: string, precio: number, priceId: string) {
    setModalData({ planNombre, precio, priceId });
  }

  return (
    <section className="max-w-5xl mx-auto px-8 pb-24">
      {modalData && (
        <ModalCheckout
          plan={{ nombre: modalData.planNombre, precio: modalData.precio }}
          priceId={modalData.priceId}
          onClose={() => setModalData(null)}
        />
      )}

      <div className="flex flex-col items-center text-center gap-4 mb-10">
        <h2 className="text-4xl font-bold tracking-tight text-slate-900">
          Planes y <span className="text-blue-600">precios</span>
        </h2>
        <p className="text-slate-600 max-w-md">
          Sin sorpresas. Cancela cuando quieras. Todos los planes incluyen 7 días gratis.
        </p>

        <div className="flex items-center gap-4 bg-slate-100 border border-slate-200 rounded-full px-2 py-1.5">
          <button
            onClick={() => setAnual(false)}
            className={`text-sm px-4 py-1.5 rounded-full transition-all ${
              !anual ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setAnual(true)}
            className={`text-sm px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
              anual ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Anual
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              20% off
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANES.map((plan) => {
          const precio = anual ? plan.anual.porMes : plan.mensual.precio;
          const priceId = anual ? plan.anual.priceId : plan.mensual.priceId;

          return (
            <div
              key={plan.nombre}
              className={`relative bg-white border rounded-2xl p-8 flex flex-col gap-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                plan.popular
                  ? "border-blue-300 shadow-md"
                  : "border-slate-200"
              }`}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4 text-xs font-medium bg-blue-600 text-white px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium tracking-widest uppercase text-blue-600">
                  {plan.nombre}
                </p>
                <p className="text-sm text-slate-500">{plan.descripcion}</p>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">
                    {formatCOP(precio)}
                  </span>
                  <span className="text-sm text-slate-500">/mes</span>
                </div>
                {anual && (
                  <p className="text-xs text-green-600">
                    {formatCOP(plan.anual.precio)} facturado anualmente
                  </p>
                )}
              </div>

              <ul className="flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => abrirModal(plan.nombre, precio, priceId)}
                className={`mt-auto w-full py-3 rounded-xl text-sm font-medium transition-all ${
                  plan.popular
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
                }`}
              >
                Empezar 7 días gratis
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400 mt-8">
        Precios en pesos colombianos (COP). Puedes cancelar en cualquier momento desde tu dashboard.
      </p>
    </section>
  );
}
