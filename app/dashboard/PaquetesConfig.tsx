"use client";
import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Card, CardBody } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Input, Label, Select } from "@/app/components/ui/Input";

interface Servicio {
  id: string;
  nombre: string;
}

interface Paciente {
  id: string;
  nombre: string;
  apellidos: string | null;
  telefono: string | null;
}

interface Paquete {
  id: string;
  nombre: string;
  servicio_id: string;
  numero_sesiones: number;
  precio: number;
  vigencia_dias: number;
  activo: boolean;
  servicios?: { nombre: string }[] | null;
}

function formatCOP(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);
}

const FORM_INICIAL = {
  nombre: "",
  servicioId: "",
  numeroSesiones: 5,
  precio: 0,
  vigenciaDias: 90,
};

function abrirWhatsAppVenta(paciente: Paciente, paquete: Paquete, negocioNombre?: string) {
  if (!paciente.telefono) return;

  const numero = paciente.telefono.replace(/\D/g, "").replace(/^0/, "");
  const numeroCompleto = numero.startsWith("57") ? numero : `57${numero}`;

  const mensaje = encodeURIComponent(
    `¡Hola ${paciente.nombre}! 🎉✨\n\n` +
      `Tenemos excelentes noticias: te acabamos de asignar tu paquete *${paquete.nombre}*` +
      (paquete.servicios?.[0]?.nombre ? ` de *${paquete.servicios[0].nombre}*` : "") +
      ` en ${negocioNombre || "nuestro negocio"} 💪\n\n` +
      `📦 ${paquete.numero_sesiones} sesiones disponibles\n` +
      `⏳ Válido por ${paquete.vigencia_dias} días\n\n` +
      `¡Ya puedes agendar tu primera sesión cuando quieras! Escríbenos si tienes alguna pregunta. 🙌`
  );

  window.open(`https://wa.me/${numeroCompleto}?text=${mensaje}`, "_blank");
}

function VenderPaquete({
  paquete,
  pacientes,
  negocioNombre,
}: {
  paquete: Paquete;
  pacientes: Paciente[];
  negocioNombre?: string;
}) {
  const [pacienteId, setPacienteId] = useState("");
  const [vendiendo, setVendiendo] = useState(false);
  const [ok, setOk] = useState(false);

  async function vender() {
    if (!pacienteId) return;
    setVendiendo(true);
    setOk(false);
    const res = await fetch("/api/negocios/paquetes/vender", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paqueteId: paquete.id, pacienteId }),
    });
    setVendiendo(false);
    if (res.ok) {
      setOk(true);
      const paciente = pacientes.find((p) => p.id === pacienteId);
      if (paciente) abrirWhatsAppVenta(paciente, paquete, negocioNombre);
      setPacienteId("");
      setTimeout(() => setOk(false), 2000);
    } else {
      alert("Error al asignar el paquete");
    }
  }

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
      <Select value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} className="flex-1">
        <option value="">Vender a paciente...</option>
        {pacientes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre} {p.apellidos || ""}
          </option>
        ))}
      </Select>
      <Button size="sm" onClick={vender} disabled={!pacienteId || vendiendo}>
        {vendiendo ? "..." : ok ? "✓" : "Vender"}
      </Button>
    </div>
  );
}

export default function PaquetesConfig({
  negocioId,
  negocioNombre,
}: {
  negocioId: string;
  negocioNombre?: string;
}) {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    if (!negocioId) return;
    setCargando(true);
    const [resPaq, resServ, resPac] = await Promise.all([
      fetch(`/api/negocios/paquetes?negocioId=${negocioId}`),
      fetch(`/api/negocios/servicios?negocioId=${negocioId}`),
      fetch(`/api/negocios/pacientes?negocioId=${negocioId}`),
    ]);
    if (resPaq.ok) setPaquetes((await resPaq.json()).paquetes || []);
    if (resServ.ok) setServicios((await resServ.json()).servicios || []);
    if (resPac.ok) setPacientes((await resPac.json()).pacientes || []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocioId]);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.servicioId) {
      setError("Nombre y servicio son requeridos");
      return;
    }
    setGuardando(true);
    setError("");

    const res = await fetch("/api/negocios/paquetes", {
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
      setError(data.error || "Error al crear el paquete");
    }
  }

  if (cargando) {
    return <p className="text-sm text-slate-400">Cargando paquetes...</p>;
  }

  if (servicios.length === 0 && !mostrarForm && paquetes.length === 0) {
    return (
      <Card className="text-center py-10 px-6 border-dashed">
        <p className="text-sm text-slate-500">
          Primero necesitas cargar al menos un servicio (sección Servicios) antes de crear
          paquetes.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {paquetes.length === 0 && !mostrarForm && (
        <Card className="text-center py-10 px-6 border-dashed">
          <p className="text-sm text-slate-500 mb-4">
            Aún no has creado paquetes de sesiones (ej. "5 sesiones de fisioterapia").
          </p>
          <Button onClick={() => setMostrarForm(true)}>+ Crear paquete</Button>
        </Card>
      )}

      {paquetes.length > 0 && (
        <div className="flex flex-col gap-2">
          {paquetes.map((p) => (
            <Card key={p.id} className={!p.activo ? "opacity-60" : ""}>
              <CardBody>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {p.nombre}
                      </span>
                      {p.servicios?.[0]?.nombre && (
                        <Badge tone="primary">{p.servicios[0].nombre}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {p.numero_sesiones} sesiones · {formatCOP(p.precio)} · vigencia{" "}
                      {p.vigencia_dias} días
                    </p>
                  </div>
                </div>
                {pacientes.length > 0 && (
                  <VenderPaquete paquete={p} pacientes={pacientes} negocioNombre={negocioNombre} />
                )}
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
                <Label>Nombre del paquete</Label>
                <Input
                  className="mt-1.5"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="5 sesiones de fisioterapia"
                  required
                />
              </div>
              <div>
                <Label>Servicio relacionado</Label>
                <Select
                  className="mt-1.5"
                  value={form.servicioId}
                  onChange={(e) => setForm((f) => ({ ...f, servicioId: e.target.value }))}
                >
                  <option value="">Selecciona un servicio</option>
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Número de sesiones</Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    min={1}
                    value={form.numeroSesiones}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, numeroSesiones: Number(e.target.value) }))
                    }
                  />
                </div>
                <div>
                  <Label>Precio (COP)</Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    min={0}
                    value={form.precio}
                    onChange={(e) => setForm((f) => ({ ...f, precio: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <Label>Vigencia (días)</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  min={1}
                  value={form.vigenciaDias}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vigenciaDias: Number(e.target.value) }))
                  }
                />
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
                  {guardando ? "Guardando..." : "Guardar paquete"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : (
        paquetes.length > 0 && (
          <Button variant="secondary" onClick={() => setMostrarForm(true)} className="self-start">
            + Nuevo paquete
          </Button>
        )
      )}
    </div>
  );
}
