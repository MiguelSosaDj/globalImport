"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Card, CardBody } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Input, Label } from "@/app/components/ui/Input";

interface Paciente {
  id: string;
  nombre: string;
  apellidos: string | null;
  telefono: string | null;
  numero_documento: string | null;
  correo: string | null;
  notas: string | null;
  activo: boolean;
}

interface CitaBasica {
  cliente_telefono: string;
  fecha: string;
  hora: string;
  servicio: string;
  estado_cita?: string;
}

const FORM_INICIAL = {
  nombre: "",
  apellidos: "",
  telefono: "",
  numero_documento: "",
  correo: "",
  notas: "",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface PaquetePaciente {
  id: string;
  sesiones_usadas: number;
  sesiones_restantes: number;
  fecha_vencimiento: string | null;
  estado: string;
  paquetes?: { nombre: string }[] | null;
}

function PaquetesDelPaciente({ pacienteId }: { pacienteId: string }) {
  const [paquetes, setPaquetes] = useState<PaquetePaciente[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const res = await fetch(`/api/negocios/pacientes/${pacienteId}/paquetes`);
      if (res.ok) setPaquetes((await res.json()).paquetesPaciente || []);
      setCargando(false);
    }
    cargar();
  }, [pacienteId]);

  if (cargando) return <p className="text-xs text-slate-400 mt-3">Cargando paquetes...</p>;

  if (paquetes.length === 0) {
    return <p className="text-xs text-slate-400 mt-3">Sin paquetes asignados</p>;
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
      {paquetes.map((pp) => (
        <div key={pp.id} className="flex items-center justify-between text-xs">
          <span className="text-slate-600">{pp.paquetes?.[0]?.nombre || "Paquete"}</span>
          <Badge tone={pp.estado === "activo" ? "primary" : "neutral"}>
            {pp.sesiones_restantes}/{pp.sesiones_usadas + pp.sesiones_restantes} sesiones
          </Badge>
        </div>
      ))}
    </div>
  );
}

export default function PacientesConfig({
  negocioId,
  citas = [],
}: {
  negocioId: string;
  citas?: CitaBasica[];
}) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandido, setExpandido] = useState<string | null>(null);

  async function cargar() {
    if (!negocioId) return;
    setCargando(true);
    const res = await fetch(`/api/negocios/pacientes?negocioId=${negocioId}`);
    if (res.ok) setPacientes((await res.json()).pacientes || []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocioId]);

  const hoy = todayStr();

  const citasPorTelefono = useMemo(() => {
    const map: Record<string, CitaBasica[]> = {};
    for (const c of citas) {
      if (c.estado_cita === "cancelada") continue;
      if (!c.cliente_telefono) continue;
      if (!map[c.cliente_telefono]) map[c.cliente_telefono] = [];
      map[c.cliente_telefono].push(c);
    }
    return map;
  }, [citas]);

  const pacientesFiltrados = useMemo(() => {
    if (!search.trim()) return pacientes;
    const q = search.toLowerCase();
    return pacientes.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.telefono || "").includes(q) ||
        (p.numero_documento || "").includes(q)
    );
  }, [pacientes, search]);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }
    setGuardando(true);
    setError("");

    const res = await fetch("/api/negocios/pacientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ negocioId, ...form }),
    });

    setGuardando(false);

    if (res.ok) {
      const data = await res.json();
      if (data.posibleDuplicado) {
        setError(
          `Ya existe un paciente parecido: ${data.posibleDuplicado.nombre} (${
            data.posibleDuplicado.telefono || data.posibleDuplicado.numero_documento
          }). Se creó igual — revisa si es duplicado.`
        );
      }
      setForm(FORM_INICIAL);
      setMostrarForm(false);
      cargar();
    } else {
      const data = await res.json();
      setError(data.error || "Error al crear el paciente");
    }
  }

  if (cargando) {
    return <p className="text-sm text-slate-400">Cargando pacientes...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono o documento..."
          className="flex-1"
        />
        <Button onClick={() => setMostrarForm((v) => !v)} className="flex-shrink-0">
          {mostrarForm ? "Cancelar" : "+ Nuevo paciente"}
        </Button>
      </div>

      {mostrarForm && (
        <Card>
          <CardBody>
            <form onSubmit={crear} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    className="mt-1.5"
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Apellidos (opcional)</Label>
                  <Input
                    className="mt-1.5"
                    value={form.apellidos}
                    onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    className="mt-1.5"
                    value={form.telefono}
                    onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                    placeholder="3001234567"
                  />
                </div>
                <div>
                  <Label>Documento (opcional)</Label>
                  <Input
                    className="mt-1.5"
                    value={form.numero_documento}
                    onChange={(e) => setForm((f) => ({ ...f, numero_documento: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Correo (opcional)</Label>
                <Input
                  className="mt-1.5"
                  type="email"
                  value={form.correo}
                  onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
                />
              </div>
              <div>
                <Label>Notas (opcional)</Label>
                <Input
                  className="mt-1.5"
                  value={form.notas}
                  onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                />
              </div>

              {error && <p className="text-sm text-amber-700">{error}</p>}

              <Button type="submit" disabled={guardando} className="self-start">
                {guardando ? "Guardando..." : "Guardar paciente"}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {pacientesFiltrados.length === 0 ? (
        <Card className="text-center py-10 px-6 border-dashed">
          <p className="text-sm text-slate-500">
            {search ? "Sin resultados para tu búsqueda" : "Aún no has registrado pacientes"}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {pacientesFiltrados.map((p) => {
            const citasPaciente = (p.telefono && citasPorTelefono[p.telefono]) || [];
            const proxima = citasPaciente
              .filter((c) => c.fecha >= hoy)
              .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];

            return (
              <Card key={p.id} className={!p.activo ? "opacity-60" : ""}>
                <CardBody>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {p.nombre} {p.apellidos || ""}
                        </span>
                        {!p.activo && <Badge tone="neutral">Inactivo</Badge>}
                      </div>
                      <p className="text-xs text-slate-500">
                        {p.telefono || "sin teléfono"}
                        {p.numero_documento && ` · ${p.numero_documento}`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-slate-500">
                          {citasPaciente.length} cita{citasPaciente.length !== 1 ? "s" : ""}
                        </p>
                        {proxima ? (
                          <Badge tone="primary" className="mt-1">
                            Próxima: {proxima.fecha}
                          </Badge>
                        ) : (
                          <p className="text-xs text-slate-400 mt-1">Sin citas futuras</p>
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                      >
                        {expandido === p.id ? "Cerrar" : "Paquetes"}
                      </Button>
                    </div>
                  </div>
                  {expandido === p.id && <PaquetesDelPaciente pacienteId={p.id} />}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
