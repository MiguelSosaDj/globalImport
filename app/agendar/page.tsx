"use client";
import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

type Negocio = {
  id: string;
  nombre: string;
  tipo: string;
};

const SERVICIOS_POR_TIPO: Record<string, string[]> = {
  barberia: ["Corte de cabello", "Barba", "Corte + barba", "Tinte"],
  medico: ["Consulta general", "Control", "Examen", "Urgencia"],
  mecanico: ["Cambio de aceite", "Frenos", "Suspension", "Diagnostico"],
  masajista: ["Masaje relajante", "Masaje deportivo", "Reflexologia"],
};

const TIPOS = ["barberia", "medico", "mecanico", "masajista"];

export default function AgendarPage() {
  const [paso, setPaso] = useState<"seleccion" | "formulario">("seleccion");
  const [tipoSeleccionado, setTipoSeleccionado] = useState(TIPOS[0]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<Negocio | null>(null);
  const [cargandoNegocios, setCargandoNegocios] = useState(false);
  const [ultimoTelefono, setUltimoTelefono] = useState("");

  const servicios = negocioSeleccionado
    ? SERVICIOS_POR_TIPO[negocioSeleccionado.tipo] || []
    : [];

  const [form, setForm] = useState({
    cliente_nombre: "",
    cliente_telefono: "",
    servicio: "",
    fecha: "",
    hora: "",
  });
  const [estado, setEstado] = useState<"idle" | "cargando" | "ok" | "error">("idle");

  useEffect(() => {
    async function cargarNegocios() {
      setCargandoNegocios(true);
      setNegocioSeleccionado(null);
      const supabase = getSupabase();
      const { data } = await supabase
        .from("negocios")
        .select("id, nombre, tipo")
        .eq("tipo", tipoSeleccionado);
      setNegocios(data || []);
      setCargandoNegocios(false);
    }
    cargarNegocios();
  }, [tipoSeleccionado]);

  function handleChangeTipo(e: React.ChangeEvent<HTMLSelectElement>) {
    setTipoSeleccionado(e.target.value);
  }

  function handleChangeNegocio(e: React.ChangeEvent<HTMLSelectElement>) {
    const negocio = negocios.find((n) => n.id === e.target.value) || null;
    setNegocioSeleccionado(negocio);
    if (negocio) {
      const serviciosNegocio = SERVICIOS_POR_TIPO[negocio.tipo] || [];
      setForm((f) => ({ ...f, servicio: serviciosNegocio[0] || "" }));
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleContinuar(e: React.FormEvent) {
    e.preventDefault();
    if (!negocioSeleccionado) return;
    setPaso("formulario");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!negocioSeleccionado) return;
    setEstado("cargando");

    const supabase = getSupabase();
    const { error } = await supabase.from("citas").insert({
      ...form,
      negocio_id: negocioSeleccionado.id,
      estado_cita: "pendiente",
    });

    if (error) {
      setEstado("error");
    } else {
      setUltimoTelefono(form.cliente_telefono);
      setEstado("ok");
      setForm({
        cliente_nombre: "",
        cliente_telefono: "",
        servicio: servicios[0] || "",
        fecha: "",
        hora: "",
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[600px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 bg-white/[0.03] border border-white/10 rounded-2xl p-8 w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Volver al inicio
          </Link>
          <h1 className="text-2xl font-bold text-white mt-3">Agendar cita</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {negocioSeleccionado ? negocioSeleccionado.nombre : "Encuentra tu negocio"}
          </p>
        </div>

        {/* PASO 1 — Seleccionar negocio */}
        {paso === "seleccion" && (
          <form onSubmit={handleContinuar} className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-medium text-zinc-400">Tipo de negocio</label>
              <select
                value={tipoSeleccionado}
                onChange={handleChangeTipo}
                className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t} className="bg-zinc-900 capitalize">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-400">Negocio</label>
              <select
                value={negocioSeleccionado?.id || ""}
                onChange={handleChangeNegocio}
                disabled={cargandoNegocios || negocios.length === 0}
                className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-40"
              >
                <option value="" className="bg-zinc-900">
                  {cargandoNegocios
                    ? "Cargando..."
                    : negocios.length === 0
                    ? "No hay negocios de este tipo"
                    : "Selecciona un negocio"}
                </option>
                {negocios.map((n) => (
                  <option key={n.id} value={n.id} className="bg-zinc-900">
                    {n.nombre}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!negocioSeleccionado}
              className="mt-1 w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-3 rounded-xl transition-colors"
            >
              Continuar
            </button>
          </form>
        )}

        {/* PASO 2 — Formulario de cita */}
        {paso === "formulario" && (
          <>
            {/* Mensaje de éxito */}
            {estado === "ok" && (
              <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-lg">✅</span>
                  <span className="text-green-400 text-sm font-semibold">
                    Cita agendada correctamente
                  </span>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Nos comunicaremos contigo al numero{" "}
                  <span className="text-white font-medium">{ultimoTelefono}</span>{" "}
                  por WhatsApp para confirmar tu cita.
                </p>
                <p className="text-zinc-600 text-xs">
                  Si no recibes mensaje en los proximos minutos, escribenos directamente.
                </p>
              </div>
            )}

            {/* Mensaje de error */}
            {estado === "error" && (
              <div className="mb-6 bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl border border-red-500/20">
                Algo salio mal. Intenta de nuevo.
              </div>
            )}

            {/* Formulario — se oculta cuando queda ok */}
            {estado !== "ok" && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="text-sm font-medium text-zinc-400">Nombre completo</label>
                  <input
                    name="cliente_nombre"
                    value={form.cliente_nombre}
                    onChange={handleChange}
                    required
                    placeholder="Juan Perez"
                    className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-400">Telefono</label>
                  <input
                    name="cliente_telefono"
                    value={form.cliente_telefono}
                    onChange={handleChange}
                    required
                    placeholder="3001234567"
                    className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-400">Servicio</label>
                  <select
                    name="servicio"
                    value={form.servicio}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    {servicios.map((s) => (
                      <option key={s} value={s} className="bg-zinc-900 text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-zinc-400">Fecha</label>
                    <input
                      type="date"
                      name="fecha"
                      value={form.fecha}
                      onChange={handleChange}
                      required
                      className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-400">Hora</label>
                    <input
                      type="time"
                      name="hora"
                      value={form.hora}
                      onChange={handleChange}
                      required
                      className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPaso("seleccion")}
                    className="w-1/3 border border-white/10 text-zinc-400 hover:text-white text-sm font-medium py-3 rounded-xl transition-colors"
                  >
                    Atras
                  </button>
                  <button
                    type="submit"
                    disabled={estado === "cargando"}
                    className="w-2/3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-3 rounded-xl transition-colors"
                  >
                    {estado === "cargando" ? "Agendando..." : "Confirmar cita"}
                  </button>
                </div>
              </form>
            )}

            {/* Botón para agendar otra cita */}
            {estado === "ok" && (
              <button
                onClick={() => {
                  setEstado("idle");
                  setPaso("seleccion");
                  setNegocioSeleccionado(null);
                }}
                className="w-full mt-2 border border-white/10 text-zinc-400 hover:text-white text-sm font-medium py-3 rounded-xl transition-colors"
              >
                Agendar otra cita
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}