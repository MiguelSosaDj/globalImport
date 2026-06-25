"use client";
import { useState } from "react";

const PLANES = [
  {
    nombre: "Básico",
    descripcion: "Para negocios que están empezando",
    mensual: { precio: 29900, priceId: "price_1ThYNTGPom06FybKysNM1a4K" },
    anual: { precio: 287040, priceId: "price_1ThYPSGPom06FybKyfvVQlVR", porMes: 23920 },
    features: [
      "Hasta 50 citas por mes",
      "1 negocio",
      "Link de agendamiento único",
      "Dashboard de gestión",
      "Soporte por email",
    ],
    popular: false,
    color: "from-zinc-600/20 to-transparent",
    badge: null,
  },
  {
    nombre: "Pro",
    descripcion: "Para negocios en crecimiento",//
    mensual: { precio: 59900, priceId: "price_1ThYOuGPom06FybK9MHv5cNd" },
    anual: { precio: 575040, priceId: "price_1ThYOuGPom06FybKxtXPRdG4", porMes: 47920 },
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
    color: "from-violet-600/20 to-transparent",
    badge: "Más popular",
  },
  {
    nombre: "Premium",
    descripcion: "Para negocios consolidados",
    mensual: { precio: 99900, priceId: "price_1ThYQ3GPom06FybKFsKrDrQU" },
    anual: { precio: 959040, priceId: "price_1ThYQTGPom06FybK10wfALT5", porMes: 79920 },
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
    color: "from-fuchsia-600/20 to-transparent",
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 flex flex-col gap-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors text-xl leading-none"
        >
          ×
        </button>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-widest uppercase text-violet-400">
            Plan {plan.nombre}
          </p>
          <h3 className="text-xl font-bold text-white">Empieza tu prueba gratis</h3>
          <p className="text-sm text-zinc-500">
            7 días gratis, sin cobro. Cancela cuando quieras.
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-zinc-400">Después del trial</span>
          <span className="text-sm font-semibold text-white">
            {formatCOP(plan.precio)}/mes
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400">Nombre (opcional)</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre o el del negocio"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400">
              Email <span className="text-violet-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="tu@email.com"
              className={`w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors ${
                error
                  ? "border-red-500/50 focus:border-red-500"
                  : "border-white/10 focus:border-violet-500/50"
              }`}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={cargando}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Redirigiendo a Stripe...
            </span>
          ) : (
            "Continuar a pago seguro →"
          )}
        </button>

        <p className="text-center text-xs text-zinc-600">
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
    <section className="relative z-10 max-w-5xl mx-auto px-8 pb-24">
      {modalData && (
        <ModalCheckout
          plan={{ nombre: modalData.planNombre, precio: modalData.precio }}
          priceId={modalData.priceId}
          onClose={() => setModalData(null)}
        />
      )}

      <div className="flex flex-col items-center text-center gap-4 mb-10">
        <h2 className="text-4xl font-bold tracking-tight">
          Planes y{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            precios
          </span>
        </h2>
        <p className="text-zinc-400 max-w-md">
          Sin sorpresas. Cancela cuando quieras. Todos los planes incluyen 7 días gratis.
        </p>

        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-full px-2 py-1.5">
          <button
            onClick={() => setAnual(false)}
            className={`text-sm px-4 py-1.5 rounded-full transition-all ${
              !anual ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setAnual(true)}
            className={`text-sm px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
              anual ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Anual
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
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
              className={`group relative bg-white/[0.03] border rounded-2xl p-8 flex flex-col gap-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "border-violet-500/40 hover:border-violet-500/60"
                  : "border-white/5 hover:border-white/10"
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-b ${plan.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              {plan.badge && (
                <div className="absolute top-4 right-4 text-xs font-medium bg-violet-600 text-white px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}

              <div className="relative flex flex-col gap-1">
                <p className="text-xs font-medium tracking-widest uppercase text-violet-400">
                  {plan.nombre}
                </p>
                <p className="text-sm text-zinc-500">{plan.descripcion}</p>
              </div>

              <div className="relative flex flex-col gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {formatCOP(precio)}
                  </span>
                  <span className="text-sm text-zinc-500">/mes</span>
                </div>
                {anual && (
                  <p className="text-xs text-green-400">
                    {formatCOP(plan.anual.precio)} facturado anualmente
                  </p>
                )}
              </div>

              <ul className="relative flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                    <span className="text-violet-400 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => abrirModal(plan.nombre, precio, priceId)}
                className={`relative mt-auto w-full py-3 rounded-xl text-sm font-medium transition-all ${
                  plan.popular
                    ? "bg-violet-600 hover:bg-violet-500 text-white"
                    : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                }`}
              >
                Empezar 7 días gratis
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-zinc-600 mt-8">
        Precios en pesos colombianos (COP). Puedes cancelar en cualquier momento desde tu dashboard.
      </p>
    </section>
  );
}