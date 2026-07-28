"use client";
import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";

interface Solicitud {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  negocio_nombre: string;
  tipo_negocio: string;
  plan: string;
  periodo: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  created_at: string;
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function abrirWhatsAppCuentaCreada(nombre: string, telefono: string, correo: string, password: string) {
  const numero = telefono.replace(/\D/g, "").replace(/^0/, "");
  const numeroCompleto = numero.startsWith("57") ? numero : `57${numero}`;

  const mensaje = encodeURIComponent(
    `¡Hola ${nombre}! 🎉\n\n` +
      `Tu cuenta de CitasYa ya está activa. Puedes ingresar con:\n\n` +
      `📧 Usuario: ${correo}\n` +
      `🔑 Contraseña temporal: ${password}\n\n` +
      `⚠️ Por seguridad, por favor cambia tu contraseña apenas ingreses. ¡Bienvenido a CitasYa! 🚀`
  );

  window.open(`https://wa.me/${numeroCompleto}?text=${mensaje}`, "_blank");
}

function TogglePago() {
  const [metodo, setMetodo] = useState<"stripe" | "nequi" | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch("/api/config/metodo-pago")
      .then((r) => r.json())
      .then((d) => setMetodo(d.metodoPago));
  }, []);

  async function cambiar(nuevo: "stripe" | "nequi") {
    if (nuevo === metodo) return;
    setGuardando(true);
    const res = await fetch("/api/config/metodo-pago", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodoPago: nuevo }),
    });
    setGuardando(false);
    if (res.ok) setMetodo(nuevo);
    else alert("Error al cambiar el método de pago");
  }

  if (metodo === null) return <p className="text-sm text-slate-400">Cargando...</p>;

  return (
    <div className="flex items-center gap-3">
      <Button
        variant={metodo === "stripe" ? "primary" : "secondary"}
        onClick={() => cambiar("stripe")}
        disabled={guardando}
      >
        Stripe
      </Button>
      <Button
        variant={metodo === "nequi" ? "primary" : "secondary"}
        onClick={() => cambiar("nequi")}
        disabled={guardando}
      >
        Nequi
      </Button>
      <span className="text-xs text-slate-500">
        Activo ahora: <strong className="text-slate-700">{metodo}</strong>
      </span>
    </div>
  );
}

function FilaSolicitud({ s, onProcesada }: { s: Solicitud; onProcesada: () => void }) {
  const [procesando, setProcesando] = useState(false);

  async function verComprobante() {
    const res = await fetch(`/api/admin/solicitudes/${s.id}/comprobante`);
    if (res.ok) {
      const { url } = await res.json();
      window.open(url, "_blank");
    } else {
      alert("Error al abrir el comprobante");
    }
  }

  async function aprobar() {
    if (!confirm(`¿Aprobar la suscripción de ${s.nombre} (${s.negocio_nombre})?`)) return;
    setProcesando(true);
    const res = await fetch(`/api/admin/solicitudes/${s.id}/aprobar`, { method: "POST" });
    setProcesando(false);
    const data = await res.json();
    if (res.ok) {
      abrirWhatsAppCuentaCreada(data.nombre, data.telefono, data.correo, data.password);
      onProcesada();
    } else {
      alert(data.error || "Error al aprobar");
    }
  }

  async function rechazar() {
    if (!confirm(`¿Rechazar la solicitud de ${s.nombre}?`)) return;
    setProcesando(true);
    const res = await fetch(`/api/admin/solicitudes/${s.id}/rechazar`, { method: "POST" });
    setProcesando(false);
    if (res.ok) onProcesada();
    else alert("Error al rechazar");
  }

  return (
    <tr className="border-b border-slate-50 last:border-0">
      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatFecha(s.created_at)}</td>
      <td className="px-4 py-3">
        <div className="text-slate-900 font-medium">{s.nombre}</div>
        <div className="text-xs text-slate-400">{s.correo} · {s.telefono}</div>
      </td>
      <td className="px-4 py-3 text-slate-600">
        {s.negocio_nombre}
        <div className="text-xs text-slate-400 capitalize">{s.tipo_negocio}</div>
      </td>
      <td className="px-4 py-3 text-slate-600 capitalize">
        {s.plan} · {s.periodo}
      </td>
      <td className="px-4 py-3">
        {s.estado === "pendiente" && <Badge tone="warning">Pendiente</Badge>}
        {s.estado === "aprobada" && <Badge tone="success">Aprobada</Badge>}
        {s.estado === "rechazada" && <Badge tone="danger">Rechazada</Badge>}
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <div className="flex items-center gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={verComprobante}>
            Comprobante
          </Button>
          {s.estado === "pendiente" && (
            <>
              <Button size="sm" onClick={aprobar} disabled={procesando}>
                Aprobar
              </Button>
              <Button variant="danger" size="sm" onClick={rechazar} disabled={procesando}>
                Rechazar
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function AdminPanel({ cerrarSesion }: { cerrarSesion: () => void | Promise<void> }) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    const res = await fetch("/api/admin/solicitudes");
    if (res.ok) setSolicitudes((await res.json()).solicitudes || []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  const pendientes = solicitudes.filter((s) => s.estado === "pendiente");

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-slate-200 bg-white">
        <span className="text-base font-semibold text-slate-900">
          <span className="text-blue-600">Citas</span>Ya — Administrador
        </span>
        <form action={cerrarSesion}>
          <button className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
            Cerrar sesión
          </button>
        </form>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de administrador</h1>
          <p className="text-sm text-slate-500 mt-1">
            Método de pago de la plataforma y solicitudes de suscripción
          </p>
        </div>

        <Card>
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Método de pago activo
            </p>
          </CardHeader>
          <CardBody>
            <TogglePago />
            <p className="text-xs text-slate-400 mt-3">
              Con Stripe, los planes se cobran automáticamente en /precios. Con Nequi, los
              interesados llenan un formulario con comprobante de pago que aparece abajo para que
              lo apruebes manualmente.
            </p>
          </CardBody>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Solicitudes de suscripción {pendientes.length > 0 && `(${pendientes.length} pendientes)`}
            </p>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Solicitante</th>
                  <th className="px-4 py-3 font-semibold">Negocio</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      Cargando...
                    </td>
                  </tr>
                ) : solicitudes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      Sin solicitudes todavía
                    </td>
                  </tr>
                ) : (
                  solicitudes.map((s) => (
                    <FilaSolicitud key={s.id} s={s} onProcesada={cargar} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
