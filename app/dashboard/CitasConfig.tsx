"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardBody } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Input, Select } from "@/app/components/ui/Input";
import { toast } from "@/app/components/ui/Toast";

interface CitaTabla {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  servicio: string;
  fecha: string;
  hora: string;
  estado_cita?: string;
  monto?: number | null;
  estado_pago?: string | null;
  paquete_id?: string | null;
}

function MarcarPago({
  citaId,
  montoActual,
  montoSugerido,
}: {
  citaId: string;
  montoActual?: number | null;
  montoSugerido?: number;
}) {
  const [editando, setEditando] = useState(false);
  const [monto, setMonto] = useState("");
  const [guardando, setGuardando] = useState(false);

  function abrirEdicion() {
    setMonto(montoActual ? String(montoActual) : montoSugerido ? String(montoSugerido) : "");
    setEditando(true);
  }

  async function confirmar() {
    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) return;
    setGuardando(true);
    const res = await fetch("/api/citas/marcar-pago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ citaId, monto: montoNum }),
    });
    setGuardando(false);
    if (res.ok) {
      window.location.reload();
    } else {
      toast.error("Error al registrar el pago");
    }
  }

  if (!editando) {
    return (
      <Button variant="secondary" size="sm" onClick={abrirEdicion}>
        ¿Pagó?
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 justify-end flex-shrink-0">
      <Input
        type="number"
        min={0}
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        placeholder="Monto COP"
        className="w-24 sm:w-28 flex-shrink-0 !px-2 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        autoFocus
      />
      <Button size="sm" onClick={confirmar} disabled={guardando} className="flex-shrink-0">
        {guardando ? "..." : "✓"}
      </Button>
    </div>
  );
}

function formatCOP(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);
}

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function badgeEstado(estado?: string) {
  switch (estado) {
    case "confirmada":
      return <Badge tone="success">Confirmada</Badge>;
    case "atendida":
      return <Badge tone="primary">Atendida</Badge>;
    case "no_asistio":
      return <Badge tone="warning">No asistió</Badge>;
    case "cancelada":
      return <Badge tone="danger">Cancelada</Badge>;
    default:
      return <Badge tone="neutral">Pendiente</Badge>;
  }
}

export default function CitasConfig({
  citas = [],
  negocioId,
}: {
  citas?: CitaTabla[];
  negocioId?: string;
}) {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [precioPorServicio, setPrecioPorServicio] = useState<Record<string, number>>({});
  // Por paquete se guarda el precio YA DIVIDIDO entre el número de sesiones
  // — el cliente paga el paquete completo una sola vez, pero cada sesión
  // individual (y por lo tanto cada pago manual que registres aquí) vale
  // precio_paquete / numero_sesiones, nunca el precio del paquete completo.
  const [montoPorSesionPaquete, setMontoPorSesionPaquete] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!negocioId) return;
    async function cargarPrecios() {
      const [resServ, resPaq] = await Promise.all([
        fetch(`/api/negocios/servicios?negocioId=${negocioId}`),
        fetch(`/api/negocios/paquetes?negocioId=${negocioId}`),
      ]);
      if (resServ.ok) {
        const { servicios } = await resServ.json();
        const map: Record<string, number> = {};
        for (const s of servicios || []) map[s.nombre] = s.precio;
        setPrecioPorServicio(map);
      }
      if (resPaq.ok) {
        const { paquetes } = await resPaq.json();
        const map: Record<string, number> = {};
        for (const p of paquetes || []) {
          map[p.id] = Math.round(p.precio / (p.numero_sesiones || 1));
        }
        setMontoPorSesionPaquete(map);
      }
    }
    cargarPrecios();
  }, [negocioId]);

  function montoSugeridoPara(c: CitaTabla) {
    if (c.paquete_id && montoPorSesionPaquete[c.paquete_id]) {
      return montoPorSesionPaquete[c.paquete_id];
    }
    return precioPorServicio[c.servicio];
  }

  const filtradas = useMemo(() => {
    let list = [...citas].sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
    if (filtroEstado) {
      list = list.filter((c) => (c.estado_cita || "pendiente") === filtroEstado);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.cliente_nombre.toLowerCase().includes(q) ||
          c.cliente_telefono.includes(q) ||
          c.servicio.toLowerCase().includes(q)
      );
    }
    return list;
  }, [citas, search, filtroEstado]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono o servicio..."
          className="flex-1"
        />
        <Select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="sm:w-48 sm:flex-shrink-0"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmada">Confirmada</option>
          <option value="atendida">Atendida</option>
          <option value="no_asistio">No asistió</option>
          <option value="cancelada">Cancelada</option>
        </Select>
      </div>

      {filtradas.length === 0 ? (
        <Card className="text-center py-10 px-6 border-dashed">
          <p className="text-sm text-slate-500">Sin citas para mostrar</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtradas.map((c) => (
            <Card key={c.id}>
              <CardBody className="!p-4 sm:!p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {iniciales(c.cliente_nombre)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {c.cliente_nombre}
                      </p>
                      <p className="text-xs text-slate-400">{c.cliente_telefono}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">{badgeEstado(c.estado_cita)}</div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    {c.fecha} · {c.hora}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>{c.servicio}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">Pago</span>
                  {c.estado_pago === "pagado" ? (
                    <span className="text-sm text-green-700 font-medium">
                      ✓ {formatCOP(c.monto || 0)}
                    </span>
                  ) : (
                    <MarcarPago
                      citaId={c.id}
                      montoActual={c.monto}
                      montoSugerido={montoSugeridoPara(c)}
                    />
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
