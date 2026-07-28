"use client";
import { useMemo } from "react";
import { Card, CardBody } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";

interface CitaReporte {
  cliente_telefono: string;
  servicio: string;
  fecha: string;
  estado_cita?: string;
  monto?: number | null;
  estado_pago?: string | null;
}

function formatCOP(valor: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
          {label}
        </p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </CardBody>
    </Card>
  );
}

export default function ReportesConfig({ citas = [] }: { citas?: CitaReporte[] }) {
  const stats = useMemo(() => {
    const porEstado: Record<string, number> = {
      pendiente: 0,
      confirmada: 0,
      atendida: 0,
      no_asistio: 0,
      cancelada: 0,
    };
    let ingresos = 0;
    const porServicio: Record<string, number> = {};
    const citasPorTelefono: Record<string, number> = {};

    for (const c of citas) {
      const estado = c.estado_cita || "pendiente";
      porEstado[estado] = (porEstado[estado] || 0) + 1;

      if (c.estado_pago === "pagado" && c.monto) ingresos += c.monto;

      porServicio[c.servicio] = (porServicio[c.servicio] || 0) + 1;

      if (c.cliente_telefono) {
        citasPorTelefono[c.cliente_telefono] = (citasPorTelefono[c.cliente_telefono] || 0) + 1;
      }
    }

    const serviciosTop = Object.entries(porServicio)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const telefonos = Object.values(citasPorTelefono);
    const nuevos = telefonos.filter((n) => n === 1).length;
    const recurrentes = telefonos.filter((n) => n > 1).length;

    return { porEstado, ingresos, serviciosTop, nuevos, recurrentes, total: citas.length };
  }, [citas]);

  if (citas.length === 0) {
    return (
      <Card className="text-center py-10 px-6 border-dashed">
        <p className="text-sm text-slate-500">Aún no hay citas para mostrar reportes</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total citas" value={String(stats.total)} />
        <StatCard label="Ingresos pagados" value={formatCOP(stats.ingresos)} />
        <StatCard label="Pacientes nuevos" value={String(stats.nuevos)} />
        <StatCard label="Pacientes recurrentes" value={String(stats.recurrentes)} />
      </div>

      <Card>
        <CardBody>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Citas por estado
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">Pendiente: {stats.porEstado.pendiente}</Badge>
            <Badge tone="success">Confirmada: {stats.porEstado.confirmada}</Badge>
            <Badge tone="primary">Atendida: {stats.porEstado.atendida}</Badge>
            <Badge tone="warning">No asistió: {stats.porEstado.no_asistio}</Badge>
            <Badge tone="danger">Cancelada: {stats.porEstado.cancelada}</Badge>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Servicios más reservados
          </p>
          <div className="flex flex-col gap-2">
            {stats.serviciosTop.map(([servicio, count]) => (
              <div key={servicio} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{servicio}</span>
                <span className="font-semibold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
