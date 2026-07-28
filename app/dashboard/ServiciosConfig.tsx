"use client";
import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Card, CardBody } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Input, Label, Select } from "@/app/components/ui/Input";

interface Servicio {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  duracion_min: number;
  precio: number;
  moneda: string;
  anticipo_tipo: "ninguno" | "fijo" | "porcentaje";
  anticipo_valor: number | null;
  activo: boolean;
  permite_pago_online: boolean;
  permite_reserva_publica: boolean;
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
  descripcion: "",
  categoria: "",
  duracion_min: 30,
  precio: 0,
  anticipo_tipo: "ninguno" as const,
  anticipo_valor: 0,
  permite_pago_online: false,
  permite_reserva_publica: true,
};

export default function ServiciosConfig({ negocioId }: { negocioId: string }) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    if (!negocioId) return;
    setCargando(true);
    const res = await fetch(`/api/negocios/servicios?negocioId=${negocioId}`);
    if (res.ok) {
      const { servicios } = await res.json();
      setServicios(servicios || []);
    }
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocioId]);

  async function crearServicio(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }
    setGuardando(true);
    setError("");

    const res = await fetch("/api/negocios/servicios", {
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
      setError(data.error || "Error al crear el servicio");
    }
  }

  async function toggleActivo(servicio: Servicio) {
    setServicios((prev) =>
      prev.map((s) => (s.id === servicio.id ? { ...s, activo: !s.activo } : s))
    );
    const res = await fetch(`/api/negocios/servicios/${servicio.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !servicio.activo }),
    });
    if (!res.ok) cargar();
  }

  if (cargando) {
    return <p className="text-sm text-slate-400">Cargando servicios...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {servicios.length === 0 && !mostrarForm && (
        <Card className="text-center py-10 px-6 border-dashed">
          <p className="text-sm text-slate-500 mb-4">
            Aún no has cargado servicios propios. Mientras tanto, tus clientes
            ven el catálogo genérico por tipo de negocio.
          </p>
          <Button onClick={() => setMostrarForm(true)}>+ Agregar mi primer servicio</Button>
        </Card>
      )}

      {servicios.length > 0 && (
        <div className="flex flex-col gap-2">
          {servicios.map((s) => (
            <Card key={s.id} className={!s.activo ? "opacity-60" : ""}>
              <CardBody className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {s.nombre}
                    </span>
                    {s.categoria && <Badge tone="primary">{s.categoria}</Badge>}
                    {!s.activo && <Badge tone="neutral">Inactivo</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">
                    {s.duracion_min} min · {formatCOP(s.precio)}
                    {s.anticipo_tipo !== "ninguno" &&
                      ` · anticipo ${
                        s.anticipo_tipo === "porcentaje"
                          ? `${s.anticipo_valor}%`
                          : formatCOP(s.anticipo_valor || 0)
                      }`}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toggleActivo(s)}
                >
                  {s.activo ? "Desactivar" : "Activar"}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {mostrarForm ? (
        <Card>
          <CardBody>
            <form onSubmit={crearServicio} className="flex flex-col gap-4">
              <div>
                <Label>Nombre del servicio</Label>
                <Input
                  className="mt-1.5"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Sesión de fisioterapia"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoría (opcional)</Label>
                  <Input
                    className="mt-1.5"
                    value={form.categoria}
                    onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                    placeholder="Fisioterapia"
                  />
                </div>
                <div>
                  <Label>Duración (minutos)</Label>
                  <Select
                    className="mt-1.5"
                    value={form.duracion_min}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, duracion_min: Number(e.target.value) }))
                    }
                  >
                    {[15, 30, 45, 60, 90].map((d) => (
                      <option key={d} value={d}>{d} minutos</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <Label>Precio (COP)</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  min={0}
                  value={form.precio}
                  onChange={(e) => setForm((f) => ({ ...f, precio: Number(e.target.value) }))}
                  placeholder="50000"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Anticipo</Label>
                  <Select
                    className="mt-1.5"
                    value={form.anticipo_tipo}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, anticipo_tipo: e.target.value as typeof f.anticipo_tipo }))
                    }
                  >
                    <option value="ninguno">Sin anticipo</option>
                    <option value="fijo">Monto fijo</option>
                    <option value="porcentaje">Porcentaje</option>
                  </Select>
                </div>
                {form.anticipo_tipo !== "ninguno" && (
                  <div>
                    <Label>{form.anticipo_tipo === "fijo" ? "Monto (COP)" : "Porcentaje (%)"}</Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      min={0}
                      value={form.anticipo_valor}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, anticipo_valor: Number(e.target.value) }))
                      }
                    />
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.permite_pago_online}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, permite_pago_online: e.target.checked }))
                  }
                />
                Permitir pago en línea para este servicio
              </label>

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
                  {guardando ? "Guardando..." : "Guardar servicio"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : (
        servicios.length > 0 && (
          <Button variant="secondary" onClick={() => setMostrarForm(true)} className="self-start">
            + Nuevo servicio
          </Button>
        )
      )}
    </div>
  );
}
