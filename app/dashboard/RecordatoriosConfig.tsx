"use client";
import { useMemo, useState } from "react";
import { Card, CardBody } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { toast } from "@/app/components/ui/Toast";
import { IconRecordatorio } from "@/app/components/ui/Icons";

interface CitaRecordatorio {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  servicio: string;
  fecha: string;
  hora: string;
  estado_cita?: string;
  recordatorio_enviado?: boolean;
}

function mananaStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
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

function mensajeRecordatorio(cita: CitaRecordatorio, negocioNombre?: string) {
  return encodeURIComponent(
    `¡Hola ${cita.cliente_nombre}! 👋\n\n` +
      `Te recordamos tu cita *mañana* para *${cita.servicio}* en ${negocioNombre || "nuestro negocio"} ` +
      `a las ${cita.hora}.\n\n` +
      `¡Te esperamos! Si necesitas cambiar algo, escríbenos aquí.`
  );
}

function abrirWhatsApp(cita: CitaRecordatorio, negocioNombre?: string) {
  const numero = cita.cliente_telefono.replace(/\D/g, "").replace(/^0/, "");
  const numeroCompleto = numero.startsWith("57") ? numero : `57${numero}`;
  window.open(`https://wa.me/${numeroCompleto}?text=${mensajeRecordatorio(cita, negocioNombre)}`, "_blank");
}

export default function RecordatoriosConfig({
  negocioId,
  negocioNombre,
  citas = [],
}: {
  negocioId: string;
  negocioNombre?: string;
  citas?: CitaRecordatorio[];
}) {
  const [enviandoMasivo, setEnviandoMasivo] = useState(false);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());

  const manana = mananaStr();

  const pendientes = useMemo(() => {
    return citas
      .filter((c) => c.estado_cita === "confirmada" && c.fecha === manana)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [citas, manana]);

  const yaEnviado = (c: CitaRecordatorio) => marcadas.has(c.id) || c.recordatorio_enviado;
  const sinEnviar = pendientes.filter((c) => !yaEnviado(c));

  async function marcarEnviadas(ids: string[]) {
    setMarcadas((prev) => new Set([...prev, ...ids]));
    const res = await fetch("/api/negocios/recordatorios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ negocioId, citaIds: ids }),
    });
    if (!res.ok) toast.error("No se pudo guardar el estado del recordatorio");
  }

  async function enviarUno(cita: CitaRecordatorio) {
    setEnviandoId(cita.id);
    abrirWhatsApp(cita, negocioNombre);
    await marcarEnviadas([cita.id]);
    setEnviandoId(null);
    toast.success(`Recordatorio abierto para ${cita.cliente_nombre}`);
  }

  async function enviarTodos() {
    if (sinEnviar.length === 0) return;
    setEnviandoMasivo(true);

    for (let i = 0; i < sinEnviar.length; i++) {
      abrirWhatsApp(sinEnviar[i], negocioNombre);
      // Pequeña pausa entre cada ventana para que el navegador no bloquee
      // los popups por abrir demasiados de golpe.
      await new Promise((r) => setTimeout(r, 400));
    }

    await marcarEnviadas(sinEnviar.map((c) => c.id));
    setEnviandoMasivo(false);
    toast.success(`${sinEnviar.length} recordatorios abiertos en WhatsApp`);
  }

  if (pendientes.length === 0) {
    return (
      <Card className="text-center py-10 px-6 border-dashed">
        <div className="flex justify-center mb-3 text-slate-300">
          <IconRecordatorio size={28} />
        </div>
        <p className="text-sm text-slate-500">
          No hay citas confirmadas para mañana ({manana}) todavía.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-500">
          {pendientes.length} cita{pendientes.length !== 1 ? "s" : ""} confirmada
          {pendientes.length !== 1 ? "s" : ""} para mañana ({manana})
          {sinEnviar.length === 0 && " — todos los recordatorios ya se enviaron"}
        </p>
        {sinEnviar.length > 0 && (
          <Button onClick={enviarTodos} disabled={enviandoMasivo} size="sm">
            {enviandoMasivo
              ? "Abriendo WhatsApp..."
              : `Enviar a todos (${sinEnviar.length})`}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {pendientes.map((c) => (
          <Card key={c.id}>
            <CardBody className="!p-4 sm:!p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {iniciales(c.cliente_nombre)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {c.cliente_nombre}
                  </p>
                  <p className="text-xs text-slate-400">
                    {c.hora} · {c.servicio}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                {yaEnviado(c) ? (
                  <Badge tone="success">✓ Enviado</Badge>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => enviarUno(c)}
                    disabled={enviandoId === c.id || enviandoMasivo}
                  >
                    {enviandoId === c.id ? "..." : "Enviar"}
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
