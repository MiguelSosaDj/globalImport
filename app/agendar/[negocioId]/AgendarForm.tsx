"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import SlotPicker from "./SlotPicker";
import CalendarioMensual from "@/app/components/CalendarioMensual";
import { IconPaquetes, IconAgenda } from "@/app/components/ui/Icons";
import { toast } from "@/app/components/ui/Toast";


const SERVICIOS_POR_TIPO: Record<string, string[]> = {
  barberia: ["Corte de cabello", "Barba", "Corte + barba", "Tinte"],
  medico: ["Consulta general", "Control", "Examen", "Urgencia"],
  mecanico: ["Cambio de aceite", "Frenos", "Suspension", "Diagnostico"],
  masajista: ["Masaje relajante", "Masaje deportivo", "Reflexologia"],
  fisioterapia: ["Sesión de fisioterapia", "Masaje terapéutico", "Evaluación inicial"],
};

const PRECIOS_POR_SERVICIO: Record<string, number> = {
  "Corte de cabello": 15,
  "Barba": 10,
  "Corte + barba": 22,
  "Tinte": 30,
  "Consulta general": 50,
  "Control": 40,
  "Examen": 60,
  "Urgencia": 80,
  "Cambio de aceite": 35,
  "Frenos": 45,
  "Suspension": 55,
  "Diagnostico": 75,
  "Masaje relajante": 45,
  "Masaje deportivo": 50,
  "Reflexologia": 40,
  "Sesión de fisioterapia": 60,
  "Masaje terapéutico": 55,
  "Evaluación inicial": 50,
};

const SERVICIOS_DEFAULT = ["Servicio 1", "Servicio 2", "Servicio 3"];

type Negocio = {
  id: string;
  nombre: string;
  tipo: string;
  requiere_pago: boolean;
  logo_url?: string;
  color_primario?: string;
  color_secundario?: string;
};

type ServicioDb = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  duracion_min: number;
  precio: number;
  anticipo_tipo: "ninguno" | "fijo" | "porcentaje";
  anticipo_valor: number | null;
  imagen_url?: string | null;
};

function formatCOP(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);
}

// Suma `dias` a una fecha "YYYY-MM-DD" sin problemas de zona horaria.
function addDays(fechaStr: string, dias: number) {
  const [y, m, d] = fechaStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + dias);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

const DIAS_SEMANA_LARGO = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];

function formatFechaCorta(fechaStr: string) {
  const [, m, d] = fechaStr.split("-");
  return `${parseInt(d, 10)}/${m}`;
}

type ProfesionalDb = {
  id: string;
  nombre: string;
  apellidos?: string | null;
  especialidad?: string | null;
  color?: string | null;
};

type PaqueteDb = {
  id: string;
  nombre: string;
  numero_sesiones: number;
  precio: number;
  vigencia_dias: number;
  servicios?: { nombre: string }[] | null;
};

export default function AgendarForm({
  negocio,
  serviciosDb = [],
  profesionalesDb = [],
  paquetesDb = [],
}: {
  negocio: Negocio;
  serviciosDb?: ServicioDb[];
  profesionalesDb?: ProfesionalDb[];
  paquetesDb?: PaqueteDb[];
}) {
  // Catálogo real del negocio si ya lo configuró; si no, cae al catálogo
  // genérico por tipo de negocio (transición sin romper negocios existentes).
  const servicios =
    serviciosDb.length > 0
      ? serviciosDb.map((s) => s.nombre)
      : SERVICIOS_POR_TIPO[negocio.tipo] || SERVICIOS_DEFAULT;

  const [form, setForm] = useState({
    cliente_nombre: "",
    cliente_telefono: "",
    servicio: servicios[0],
    fecha: "",
    hora: "",
    profesional_id: "",
    paquete_id: "",
  });
  const [estado, setEstado] = useState<"idle" | "cargando" | "pago" | "ok">("idle");
  const [ultimoTelefono, setUltimoTelefono] = useState("");
  const [ultimasSesiones, setUltimasSesiones] = useState(1);
  const [diasActivos, setDiasActivos] = useState<number[]>([]);

useEffect(() => {
  async function cargarDiasActivos() {
    const res = await fetch(`/api/negocios/dias-habilitados?negocioId=${negocio.id}`);
    const { diasActivos } = await res.json();
    setDiasActivos(diasActivos || []);
  }
  cargarDiasActivos();
}, [negocio.id]);

// Construye diasInfo para los próximos 90 días según el día de la semana habilitado
const diasInfo = useMemo(() => {
  const map: Record<string, { habilitado: boolean }> = {};
  const hoy = new Date();
  for (let i = 0; i < 90; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);
    const dateStr = fecha.toISOString().slice(0, 10);
    const diaSemana = fecha.getDay();
    map[dateStr] = { habilitado: diasActivos.includes(diaSemana) };
  }
  return map;
}, [diasActivos]);

  const paqueteSeleccionado = paquetesDb.find((pq) => pq.id === form.paquete_id);
  const servicioDbSeleccionado = serviciosDb.find((s) => s.nombre === form.servicio);
  const monto = paqueteSeleccionado
    ? paqueteSeleccionado.precio
    : servicioDbSeleccionado
    ? servicioDbSeleccionado.precio
    : PRECIOS_POR_SERVICIO[form.servicio] || 0;

  // Si hay un paquete elegido, la fecha que el cliente escoge es solo la
  // primera sesión — el resto se agenda automáticamente el mismo día de la
  // semana, una vez por semana, hasta completar todas las sesiones.
  const fechasSesiones = useMemo(() => {
    if (!form.fecha) return [];
    if (!paqueteSeleccionado) return [form.fecha];
    return Array.from({ length: paqueteSeleccionado.numero_sesiones }, (_, i) =>
      addDays(form.fecha, i * 7)
    );
  }, [form.fecha, paqueteSeleccionado]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function elegirServicio(nombre: string) {
    setForm((f) => ({ ...f, servicio: nombre, paquete_id: "" }));
  }

  function elegirPaquete(paquete: PaqueteDb) {
    setForm((f) => ({
      ...f,
      paquete_id: paquete.id,
      servicio: paquete.servicios?.[0]?.nombre || f.servicio,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.fecha || !form.hora) {
      toast.warning("Selecciona una fecha y una hora disponible antes de confirmar.");
      return;
    }

    setEstado("cargando");

    try {
      if (negocio.requiere_pago) {
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            negocioId: negocio.id,
            clienteNombre: form.cliente_nombre,
            clienteTelefono: form.cliente_telefono,
            servicio: form.servicio,
            fecha: form.fecha,
            hora: form.hora,
            profesionalId: form.profesional_id || null,
            paqueteId: form.paquete_id || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          if (res.status === 409) {
            toast.warning(data?.error || "Ese horario ya no está disponible. Elige otro.");
            setEstado("idle");
            return;
          }
          throw new Error(data?.error || "Error al crear sesión de pago");
        }
        const { url } = await res.json();
        if (url) window.location.href = url;

      } else {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const fechas = fechasSesiones.length > 0 ? fechasSesiones : [form.fecha];

        const { error } = await supabase.from("citas").insert(
          fechas.map((fecha) => ({
            negocio_id: negocio.id,
            cliente_nombre: form.cliente_nombre,
            cliente_telefono: form.cliente_telefono,
            servicio: form.servicio,
            fecha,
            hora: form.hora,
            profesional_id: form.profesional_id || null,
            paquete_id: form.paquete_id || null,
            estado_cita: "pendiente",
          }))
        );

        if (error) {
          if (error.code === "23505") {
            toast.warning(
              fechas.length > 1
                ? "Uno de los días de tus sesiones ya está reservado. Elige otra fecha de inicio."
                : "Ese horario ya fue reservado. Elige otro."
            );
            setEstado("idle");
            return;
          }
          if (error.code === "CY001") {
            toast.warning("Ese horario ya no tiene cupos disponibles. Elige otro.");
            setEstado("idle");
            return;
          }
          if (error.code === "CY002") {
            toast.warning(
              "Este negocio alcanzó su límite de citas para este mes. Contacta directamente al negocio."
            );
            setEstado("idle");
            return;
          }
          throw new Error(error.message);
        }

        toast.success(
          fechas.length > 1 ? `${fechas.length} sesiones agendadas correctamente` : "Cita agendada correctamente"
        );
        setUltimoTelefono(form.cliente_telefono);
        setUltimasSesiones(fechas.length);
        setEstado("ok");
        setForm({
          cliente_nombre: "",
          cliente_telefono: "",
          servicio: servicios[0],
          fecha: "",
          hora: "",
          profesional_id: "",
          paquete_id: "",
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Error al procesar");
      setEstado("idle");
    }
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-6">
      <div
  className="fixed inset-0 pointer-events-none"
  style={{
    background: `radial-gradient(circle at 50% -20%, ${negocio.color_primario || "#2563eb"}0d, transparent 60%)`,
  }}
/>

<div className="relative z-10 bg-white border border-slate-200 shadow-xl rounded-2xl p-5 sm:p-7 w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-3">
  <div className="flex items-center gap-3 min-w-0">
    {negocio.logo_url ? (
      <img
        src={negocio.logo_url}
        alt={negocio.nombre}
        className="w-11 h-11 rounded-xl object-cover border border-slate-200 flex-shrink-0"
      />
    ) : (
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${negocio.color_primario || "#2563eb"}, ${negocio.color_secundario || "#1d4ed8"})`,
        }}
      >
        🏢
      </div>
    )}
    <div className="min-w-0">
      <h1 className="text-xl font-bold text-slate-900 truncate">Agendar cita</h1>
      <p className="text-sm text-slate-500 truncate">{negocio.nombre}</p>
    </div>
  </div>
  <Link href="/" className="text-xs text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0">
    CitasYa
  </Link>
</div>

        {/* Mensaje éxito */}
        {estado === "ok" && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-lg">✅</span>
              <span className="text-green-700 text-sm font-semibold">
                {ultimasSesiones > 1
                  ? `${ultimasSesiones} sesiones agendadas correctamente`
                  : "Cita agendada correctamente"}
              </span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Nos comunicaremos contigo al numero{" "}
              <span className="text-slate-900 font-medium">{ultimoTelefono}</span>{" "}
              por WhatsApp para confirmar tu{" "}
              {ultimasSesiones > 1 ? "primera sesión" : "cita"}.
            </p>
            <p className="text-slate-400 text-xs">
              Si no recibes mensaje en los proximos minutos, escribenos directamente.
            </p>
          </div>
        )}

        {/* Formulario — se oculta cuando queda ok */}
        {estado !== "ok" && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Columna izquierda: datos del cliente + servicio ── */}
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="text-sm font-medium text-slate-600">Nombre</label>
              <input
                name="cliente_nombre"
                value={form.cliente_nombre}
                onChange={handleChange}
                required
                placeholder="Juan Perez"
                className="mt-1.5 w-full rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Telefono</label>
              <input
                name="cliente_telefono"
                value={form.cliente_telefono}
                onChange={handleChange}
                required
                placeholder="3001234567"
                className="mt-1.5 w-full rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">Servicio</label>

              {paqueteSeleccionado ? (
                <div className="mt-1.5 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-3.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{form.servicio}</p>
                    <p className="text-xs text-blue-600">Incluido en el paquete seleccionado</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, paquete_id: "" }))}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 flex-shrink-0"
                  >
                    Cambiar
                  </button>
                </div>
              ) : serviciosDb.length > 0 ? (
                <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {serviciosDb.map((s) => {
                    const isSel = form.servicio === s.nombre;
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => elegirServicio(s.nombre)}
                        className={`text-left rounded-xl border p-3.5 transition-colors ${
                          isSel
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                        style={isSel ? { borderColor: negocio.color_primario || "#2563eb" } : undefined}
                      >
                        <div className="flex items-start gap-3">
                          {s.imagen_url ? (
                            <img
                              src={s.imagen_url}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-lg flex-shrink-0"
                              style={{
                                background: `linear-gradient(135deg, ${negocio.color_primario || "#2563eb"}22, ${negocio.color_secundario || "#1d4ed8"}22)`,
                              }}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {s.nombre}
                            </p>
                            {s.descripcion && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                {s.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-slate-500">{s.duracion_min} min</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {formatCOP(s.precio)}
                          </span>
                        </div>
                        {s.anticipo_tipo !== "ninguno" && (
                          <p className="text-[11px] text-blue-600 mt-1.5">
                            Anticipo:{" "}
                            {s.anticipo_tipo === "porcentaje"
                              ? `${s.anticipo_valor}%`
                              : formatCOP(s.anticipo_valor || 0)}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <select
                  name="servicio"
                  value={form.servicio}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {servicios.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {paquetesDb.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Paquetes disponibles <span className="text-slate-400">(opcional)</span>
                </label>
                <div className="mt-1.5 flex flex-col gap-2">
                  {paquetesDb.map((pq) => {
                    const isSel = form.paquete_id === pq.id;
                    return (
                      <button
                        type="button"
                        key={pq.id}
                        onClick={() => (isSel ? elegirServicio(form.servicio) : elegirPaquete(pq))}
                        className={`text-left rounded-xl border p-3 transition-colors ${
                          isSel
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-900 inline-flex items-center gap-1.5">
                            <IconPaquetes size={14} className="text-blue-600 flex-shrink-0" />
                            {pq.nombre}
                            {pq.servicios?.[0]?.nombre && (
                              <span className="text-xs font-normal text-slate-500">
                                {" "}
                                — {pq.servicios[0].nombre}
                              </span>
                            )}
                          </span>
                          <span className="text-sm font-semibold text-slate-900">
                            {formatCOP(pq.precio)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {pq.numero_sesiones} sesiones · válido {pq.vigencia_dias} días
                        </p>
                        {isSel && (
                          <p className="text-[11px] text-blue-600 mt-1.5 font-medium">
                            ✓ Seleccionado — pagarás el paquete completo
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {profesionalesDb.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-600">Profesional</label>
                <select
                  name="profesional_id"
                  value={form.profesional_id}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Cualquier profesional disponible</option>
                  {profesionalesDb.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.apellidos || ""}
                      {p.especialidad ? ` — ${p.especialidad}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ── Columna derecha: fecha + hora + resumen + confirmar ── */}
          <div className="flex flex-col gap-3">
  <div>
    <label className="text-sm font-medium text-slate-600">
      {paqueteSeleccionado ? "Selecciona la fecha de tu primera sesión" : "Selecciona fecha"}
    </label>
    <div className="mt-1.5">
     <CalendarioMensual
  diasInfo={diasInfo}
  selectedDay={form.fecha}
  onSelectDay={(dia) => setForm((f) => ({ ...f, fecha: dia, hora: "" }))}
  soloMostrarHabilitados={true}
  bloquearPasado={true}
  colorPrimario={negocio.color_primario || "#2563eb"}
/>
    </div>
  </div>

  {form.fecha && (
    <div>
      <label className="text-sm font-medium text-slate-600">Hora disponible</label>
      <div className="mt-1.5 bg-white border border-slate-200 rounded-xl p-3">
        <SlotPicker
          negocioId={negocio.id}
          fecha={form.fecha}
          horaSeleccionada={form.hora}
          onSelectHora={(hora) => setForm((f) => ({ ...f, hora }))}
        />
      </div>
    </div>
  )}

  {paqueteSeleccionado && form.fecha && form.hora && (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
      <p className="text-xs font-semibold text-blue-700 mb-2 flex items-start gap-1.5">
        <IconAgenda size={13} className="flex-shrink-0 mt-0.5" />
        <span>
          Se agendarán tus {fechasSesiones.length} sesiones, todos los{" "}
          {DIAS_SEMANA_LARGO[new Date(form.fecha + "T00:00:00").getDay()]} a las{" "}
          {form.hora}:
        </span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {fechasSesiones.map((f, i) => (
          <span
            key={f}
            className="text-[11px] font-medium bg-white text-blue-700 border border-blue-200 rounded-full px-2.5 py-1"
          >
            {i + 1}. {formatFechaCorta(f)}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-blue-500 mt-2">
        Si alguna de estas fechas ya está ocupada, te avisaremos al confirmar para que elijas
        otra fecha de inicio.
      </p>
    </div>
  )}

            {/* Resumen de pago — solo si requiere_pago */}
            {negocio.requiere_pago && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">
                    {paqueteSeleccionado ? "Paquete:" : "Servicio:"}
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {paqueteSeleccionado ? paqueteSeleccionado.nombre : form.servicio}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total:</span>
                  <span className="text-lg font-bold text-blue-600">{formatCOP(monto)}</span>
                </div>
              </div>
            )}

            <button
  type="submit"
  disabled={estado === "cargando"}
  className="mt-2 w-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
  style={{
    background: `linear-gradient(135deg, ${negocio.color_primario || "#2563eb"}, ${negocio.color_secundario || "#1d4ed8"})`,
  }}
>
  {estado === "cargando" ? (
    <>
      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      {negocio.requiere_pago ? "Procesando pago..." : "Agendando..."}
    </>
  ) : negocio.requiere_pago ? (
    `Pagar ${formatCOP(monto)} y confirmar`
  ) : paqueteSeleccionado ? (
    `Confirmar ${fechasSesiones.length} sesiones`
  ) : (
    "Confirmar cita"
  )}
</button>
          </div>
          </form>
        )}

        {/* Botón agendar otra */}
        {estado === "ok" && (
          <button
            onClick={() => setEstado("idle")}
            className="w-full mt-2 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium py-3 rounded-xl transition-colors"
          >
            Agendar otra cita
          </button>
        )}

      </div>
    </main>
  );
}