"use client";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Input, Select } from "@/app/components/ui/Input";

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
  const [monto, setMonto] = useState(
    montoActual ? String(montoActual) : montoSugerido ? String(montoSugerido) : ""
  );
  const [guardando, setGuardando] = useState(false);

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
      alert("Error al registrar el pago");
    }
  }

  if (!editando) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setEditando(true)}>
        ¿Pagó?
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 justify-end">
      <Input
        type="number"
        min={0}
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        placeholder="Monto COP"
        className="w-28 text-right"
        autoFocus
      />
      <Button size="sm" onClick={confirmar} disabled={guardando}>
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
      <div className="flex items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono o servicio..."
          className="flex-1"
        />
        <Select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="w-48 flex-shrink-0"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmada">Confirmada</option>
          <option value="atendida">Atendida</option>
          <option value="no_asistio">No asistió</option>
          <option value="cancelada">Cancelada</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Servicio</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Pago</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    Sin citas para mostrar
                  </td>
                </tr>
              ) : (
                filtradas.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {c.fecha} · {c.hora}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-900 font-medium">{c.cliente_nombre}</div>
                      <div className="text-xs text-slate-400">{c.cliente_telefono}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.servicio}</td>
                    <td className="px-4 py-3">{badgeEstado(c.estado_cita)}</td>
                    <td className="px-4 py-3 text-right">
                      {c.estado_pago === "pagado" ? (
                        <span className="text-green-700 font-medium">
                          ✓ {formatCOP(c.monto || 0)}
                        </span>
                      ) : (
                        <MarcarPago
                          citaId={c.id}
                          montoActual={c.monto}
                          montoSugerido={montoSugeridoPara(c)}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
