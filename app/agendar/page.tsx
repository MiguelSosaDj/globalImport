"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

type Negocio = {
  id: string;
  nombre: string;
  tipo: string;
};

const TIPOS = ["barberia", "medico", "mecanico", "fisioterapia", "masajista"];

export default function AgendarPage() {
  const router = useRouter();
  const [tipoSeleccionado, setTipoSeleccionado] = useState(TIPOS[0]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<Negocio | null>(null);
  const [cargandoNegocios, setCargandoNegocios] = useState(false);

  useEffect(() => {
    async function cargarNegocios() {
      setCargandoNegocios(true);
      setNegocioSeleccionado(null);
      const supabase = getSupabase();
      const { data } = await supabase
        .from("negocios_publico")
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
  }

  function handleContinuar(e: React.FormEvent) {
    e.preventDefault();
    if (!negocioSeleccionado) return;
    // Reutiliza el mismo formulario de reserva que el link personalizado del
    // negocio (servicios, paquetes y profesionales reales), en vez de
    // duplicar esa lógica aquí con un catálogo genérico aparte.
    router.push(`/agendar/${negocioSeleccionado.id}`);
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="relative z-10 bg-white border border-slate-200 shadow-sm rounded-2xl p-8 w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
            Volver al inicio
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">Agendar cita</h1>
          <p className="text-sm text-slate-500 mt-1">
            {negocioSeleccionado ? negocioSeleccionado.nombre : "Encuentra tu negocio"}
          </p>
        </div>

        <form onSubmit={handleContinuar} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium text-slate-600">Tipo de negocio</label>
            <select
              value={tipoSeleccionado}
              onChange={handleChangeTipo}
              className="mt-1.5 w-full rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">Negocio</label>
            <select
              value={negocioSeleccionado?.id || ""}
              onChange={handleChangeNegocio}
              disabled={cargandoNegocios || negocios.length === 0}
              className="mt-1.5 w-full rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-40"
            >
              <option value="">
                {cargandoNegocios
                  ? "Cargando..."
                  : negocios.length === 0
                  ? "No hay negocios de este tipo"
                  : "Selecciona un negocio"}
              </option>
              {negocios.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!negocioSeleccionado}
            className="mt-1 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-3 rounded-xl transition-colors"
          >
            Continuar
          </button>
        </form>
      </div>
    </main>
  );
}
