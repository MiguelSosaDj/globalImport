"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TIPOS_NEGOCIO = ["barberia", "medico", "mecanico", "fisioterapia", "masajista"];
const NEQUI_NUMERO = "3013423627";
const MAX_COMPROBANTE_MB = 4;
const SOLICITUD_TIMEOUT_MS = 30000;

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
  periodo: "mensual" | "anual";
  onClose: () => void;
}

function ModalCheckout({ plan, priceId, periodo, onClose }: ModalCheckoutProps) {
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
            {formatCOP(plan.precio)}{periodo === "anual" ? "/año" : "/mes"}
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

interface ModalNequiProps {
  plan: { nombre: string; precio: number };
  periodo: "mensual" | "anual";
  onClose: () => void;
}

function ModalNequi({ plan, periodo, onClose }: ModalNequiProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    negocioNombre: "",
    tipoNegocio: TIPOS_NEGOCIO[0],
  });
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.nombre.trim() || !form.correo.trim() || !form.telefono.trim() || !form.negocioNombre.trim()) {
      setError("Todos los campos son requeridos");
      return;
    }
    if (!comprobante) {
      setError("Debes adjuntar el comprobante de pago");
      return;
    }
    if (comprobante.size > MAX_COMPROBANTE_MB * 1024 * 1024) {
      setError(`La imagen pesa demasiado (máx. ${MAX_COMPROBANTE_MB}MB). Toma la foto con menor calidad o recórtala.`);
      return;
    }

    setEnviando(true);
    setError("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SOLICITUD_TIMEOUT_MS);

    try {
      const body = new FormData();
      body.append("nombre", form.nombre);
      body.append("correo", form.correo);
      body.append("telefono", form.telefono);
      body.append("negocioNombre", form.negocioNombre);
      body.append("tipoNegocio", form.tipoNegocio);
      body.append("plan", plan.nombre);
      body.append("periodo", periodo);
      body.append("comprobante", comprobante);

      const res = await fetch("/api/suscripciones/solicitar", {
        method: "POST",
        body,
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar la solicitud");

      router.push("/");
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("La solicitud tardó demasiado. Verifica tu conexión e intenta de nuevo.");
      } else {
        setError(err.message || "Error al enviar la solicitud");
      }
      setEnviando(false);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 flex flex-col gap-5 shadow-xl my-auto">
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
          <h3 className="text-xl font-bold text-slate-900">Paga por Nequi</h3>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-slate-700">
          <p>
            Envía <strong>{formatCOP(plan.precio)}</strong> al Nequi{" "}
            <strong className="text-blue-700">{NEQUI_NUMERO}</strong> y adjunta tu comprobante
            abajo. Aprobamos tu cuenta manualmente en cuanto lo verifiquemos.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-slate-500">Tu nombre</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Juan Pérez"
              className="mt-1 w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Correo</label>
            <input
              name="correo"
              type="email"
              value={form.correo}
              onChange={handleChange}
              placeholder="tu@email.com"
              className="mt-1 w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Teléfono (WhatsApp)</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="3001234567"
              className="mt-1 w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Nombre del negocio</label>
              <input
                name="negocioNombre"
                value={form.negocioNombre}
                onChange={handleChange}
                placeholder="Mi negocio"
                className="mt-1 w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Tipo de negocio</label>
              <select
                name="tipoNegocio"
                value={form.tipoNegocio}
                onChange={handleChange}
                className="mt-1 w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 transition-colors capitalize"
              >
                {TIPOS_NEGOCIO.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Comprobante de pago (imagen)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file && file.size > MAX_COMPROBANTE_MB * 1024 * 1024) {
                  setError(`La imagen pesa demasiado (máx. ${MAX_COMPROBANTE_MB}MB). Toma la foto con menor calidad o recórtala.`);
                  setComprobante(null);
                  e.target.value = "";
                  return;
                }
                setError("");
                setComprobante(file);
              }}
              className="mt-1 w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={enviando}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enviando ? "Enviando..." : "Enviar solicitud"}
        </button>

        <p className="text-center text-xs text-slate-400">
          Revisaremos tu comprobante y activaremos tu cuenta manualmente.
        </p>
      </div>
    </div>
  );
}

export default function PlanesSection() {
  const [anual, setAnual] = useState(false);
  const [metodoPago, setMetodoPago] = useState<"stripe" | "nequi">("stripe");
  const [modalData, setModalData] = useState<{
    planNombre: string;
    precio: number;
    priceId: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/config/metodo-pago")
      .then((r) => r.json())
      .then((d) => setMetodoPago(d.metodoPago || "stripe"))
      .catch(() => setMetodoPago("stripe"));
  }, []);

  function abrirModal(planNombre: string, precio: number, priceId: string) {
    setModalData({ planNombre, precio, priceId });
  }

  return (
    <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24">
      {modalData && metodoPago === "nequi" && (
        <ModalNequi
          plan={{ nombre: modalData.planNombre, precio: modalData.precio }}
          periodo={anual ? "anual" : "mensual"}
          onClose={() => setModalData(null)}
        />
      )}
      {modalData && metodoPago === "stripe" && (
        <ModalCheckout
          plan={{ nombre: modalData.planNombre, precio: modalData.precio }}
          priceId={modalData.priceId}
          periodo={anual ? "anual" : "mensual"}
          onClose={() => setModalData(null)}
        />
      )}

      <div className="flex flex-col items-center text-center gap-4 mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
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
          // El precio mostrado y el que se envía a los modales de pago
          // (Stripe/Nequi) es el monto real a cobrar en ese periodo: el
          // total anual cuando está en modo Anual, no el equivalente
          // mensual — a un cliente pagando por Nequi hay que pedirle el
          // valor completo que realmente va a transferir.
          const precio = anual ? plan.anual.precio : plan.mensual.precio;
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
                  <span className="text-sm text-slate-500">{anual ? "/año" : "/mes"}</span>
                </div>
                {anual && (
                  <p className="text-xs text-green-600">
                    Equivale a {formatCOP(plan.anual.porMes)}/mes
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
