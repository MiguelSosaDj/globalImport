"use client";
import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Card, CardBody } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Input, Label } from "@/app/components/ui/Input";

interface Profesional {
  id: string;
  nombre: string;
  apellidos: string | null;
  especialidad: string | null;
  color: string | null;
  activo: boolean;
}

interface Servicio {
  id: string;
  nombre: string;
}

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type HorarioDia = { dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean };

function horariosIniciales(): HorarioDia[] {
  return DIAS.map((_, i) => ({
    dia_semana: i,
    hora_inicio: "10:00",
    hora_fin: "18:00",
    activo: i >= 1 && i <= 6,
  }));
}

function ProfesionalDetalle({
  profesional,
  servicios,
}: {
  profesional: Profesional;
  servicios: Servicio[];
}) {
  const [horarios, setHorarios] = useState<HorarioDia[]>(horariosIniciales());
  const [servicioIds, setServicioIds] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const [resHorarios, resServicios] = await Promise.all([
        fetch(`/api/negocios/profesionales/${profesional.id}/horarios`),
        fetch(`/api/negocios/profesionales/${profesional.id}/servicios`),
      ]);
      if (resHorarios.ok) {
        const { horarios: data } = await resHorarios.json();
        if (data && data.length > 0) {
          setHorarios(
            DIAS.map((_, i) => {
              const existente = data.find((h: any) => h.dia_semana === i);
              return existente
                ? {
                    dia_semana: i,
                    hora_inicio: existente.hora_inicio?.slice(0, 5) || "10:00",
                    hora_fin: existente.hora_fin?.slice(0, 5) || "18:00",
                    activo: existente.activo,
                  }
                : { dia_semana: i, hora_inicio: "10:00", hora_fin: "18:00", activo: false };
            })
          );
        }
      }
      if (resServicios.ok) {
        const { servicioIds: ids } = await resServicios.json();
        setServicioIds(ids || []);
      }
      setCargando(false);
    }
    cargar();
  }, [profesional.id]);

  function actualizarDia(dia: number, campo: keyof HorarioDia, valor: any) {
    setHorarios((prev) => prev.map((h) => (h.dia_semana === dia ? { ...h, [campo]: valor } : h)));
  }

  function toggleServicio(servicioId: string) {
    setServicioIds((prev) =>
      prev.includes(servicioId) ? prev.filter((id) => id !== servicioId) : [...prev, servicioId]
    );
  }

  async function guardar() {
    setGuardando(true);
    setGuardado(false);
    const [resH, resS] = await Promise.all([
      fetch(`/api/negocios/profesionales/${profesional.id}/horarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horarios }),
      }),
      fetch(`/api/negocios/profesionales/${profesional.id}/servicios`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servicioIds }),
      }),
    ]);
    setGuardando(false);
    if (resH.ok && resS.ok) {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } else {
      alert("Error al guardar");
    }
  }

  if (cargando) {
    return <p className="text-xs text-slate-400 mt-4">Cargando...</p>;
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-4">
      <div>
        <Label>Servicios que realiza</Label>
        {servicios.length === 0 ? (
          <p className="text-xs text-slate-400 mt-1">
            Aún no has cargado servicios en el catálogo del negocio.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {servicios.map((s) => {
              const isSel = servicioIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleServicio(s.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    isSel
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-slate-200 text-slate-500"
                  }`}
                >
                  {s.nombre}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <Label>Horario semanal</Label>
        <div className="flex flex-col gap-1.5 mt-2">
          {horarios.map((h) => (
            <div
              key={h.dia_semana}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border text-xs ${
                h.activo ? "border-blue-200 bg-blue-50/40" : "border-slate-200"
              }`}
            >
              <input
                type="checkbox"
                checked={h.activo}
                onChange={(e) => actualizarDia(h.dia_semana, "activo", e.target.checked)}
              />
              <span className="w-16 flex-shrink-0 font-medium text-slate-600">
                {DIAS[h.dia_semana].slice(0, 3)}
              </span>
              <input
                type="time"
                value={h.hora_inicio}
                disabled={!h.activo}
                onChange={(e) => actualizarDia(h.dia_semana, "hora_inicio", e.target.value)}
                className="border border-slate-200 rounded px-1.5 py-0.5 text-xs disabled:opacity-40"
              />
              <span className="text-slate-400">—</span>
              <input
                type="time"
                value={h.hora_fin}
                disabled={!h.activo}
                onChange={(e) => actualizarDia(h.dia_semana, "hora_fin", e.target.value)}
                className="border border-slate-200 rounded px-1.5 py-0.5 text-xs disabled:opacity-40"
              />
            </div>
          ))}
        </div>
      </div>

      <Button size="sm" onClick={guardar} disabled={guardando} className="self-start">
        {guardando ? "Guardando..." : guardado ? "✓ Guardado" : "Guardar cambios"}
      </Button>
    </div>
  );
}

const FORM_INICIAL = { nombre: "", apellidos: "", especialidad: "" };

export default function ProfesionalesConfig({ negocioId }: { negocioId: string }) {
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [expandido, setExpandido] = useState<string | null>(null);

  async function cargar() {
    if (!negocioId) return;
    setCargando(true);
    const [resProf, resServ] = await Promise.all([
      fetch(`/api/negocios/profesionales?negocioId=${negocioId}`),
      fetch(`/api/negocios/servicios?negocioId=${negocioId}`),
    ]);
    if (resProf.ok) setProfesionales((await resProf.json()).profesionales || []);
    if (resServ.ok) setServicios((await resServ.json()).servicios || []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocioId]);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }
    setGuardando(true);
    setError("");

    const res = await fetch("/api/negocios/profesionales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ negocioId, ...form }),
    });

    setGuardando(false);

    if (res.ok) {
      setForm(FORM_INICIAL);
      setMostrarForm(false);
      cargar();
    } else {
      const data = await res.json();
      setError(data.error || "Error al crear el profesional");
    }
  }

  async function toggleActivo(profesional: Profesional) {
    setProfesionales((prev) =>
      prev.map((p) => (p.id === profesional.id ? { ...p, activo: !p.activo } : p))
    );
    const res = await fetch(`/api/negocios/profesionales/${profesional.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !profesional.activo }),
    });
    if (!res.ok) cargar();
  }

  if (cargando) {
    return <p className="text-sm text-slate-400">Cargando profesionales...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {profesionales.length === 0 && !mostrarForm && (
        <Card className="text-center py-10 px-6 border-dashed">
          <p className="text-sm text-slate-500 mb-4">
            Aún no has agregado profesionales. Mientras tanto tu negocio funciona con un solo
            horario general, como hasta ahora.
          </p>
          <Button onClick={() => setMostrarForm(true)}>+ Agregar profesional</Button>
        </Card>
      )}

      {profesionales.length > 0 && (
        <div className="flex flex-col gap-2">
          {profesionales.map((p) => (
            <Card key={p.id} className={!p.activo ? "opacity-60" : ""}>
              <CardBody>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                      style={{ background: p.color || "#2563eb" }}
                    >
                      {p.nombre[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {p.nombre} {p.apellidos || ""}
                      </p>
                      {p.especialidad && <p className="text-xs text-slate-500">{p.especialidad}</p>}
                    </div>
                    {!p.activo && <Badge tone="neutral">Inactivo</Badge>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                    >
                      {expandido === p.id ? "Cerrar" : "Editar"}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toggleActivo(p)}>
                      {p.activo ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </div>

                {expandido === p.id && <ProfesionalDetalle profesional={p} servicios={servicios} />}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {mostrarForm ? (
        <Card>
          <CardBody>
            <form onSubmit={crear} className="flex flex-col gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  className="mt-1.5"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="María"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Apellidos (opcional)</Label>
                  <Input
                    className="mt-1.5"
                    value={form.apellidos}
                    onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Especialidad</Label>
                  <Input
                    className="mt-1.5"
                    value={form.especialidad}
                    onChange={(e) => setForm((f) => ({ ...f, especialidad: e.target.value }))}
                    placeholder="Fisioterapeuta"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setMostrarForm(false);
                    setForm(FORM_INICIAL);
                    setError("");
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar profesional"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : (
        profesionales.length > 0 && (
          <Button variant="secondary" onClick={() => setMostrarForm(true)} className="self-start">
            + Nuevo profesional
          </Button>
        )
      )}
    </div>
  );
}
