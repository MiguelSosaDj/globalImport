"use client";
import { useState } from "react";

export type DashboardSeccion =
  | "agenda"
  | "citas"
  | "servicios"
  | "profesionales"
  | "pacientes"
  | "paquetes"
  | "reportes";

interface NavItem {
  id: DashboardSeccion | string;
  label: string;
  icon: string;
  disponible: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "agenda", label: "Agenda", icon: "📅", disponible: true },
  { id: "citas", label: "Citas", icon: "🗓️", disponible: true },
  { id: "pacientes", label: "Pacientes", icon: "🧑‍🤝‍🧑", disponible: true },
  { id: "profesionales", label: "Profesionales", icon: "👤", disponible: true },
  { id: "servicios", label: "Servicios", icon: "🧾", disponible: true },
  { id: "pagos", label: "Pagos", icon: "💳", disponible: false },
  { id: "paquetes", label: "Paquetes", icon: "📦", disponible: true },
  { id: "reportes", label: "Reportes", icon: "📊", disponible: true },
  { id: "mensajes", label: "Mensajes", icon: "💬", disponible: false },
  { id: "configuracion", label: "Configuración", icon: "⚙️", disponible: false },
];

interface Props {
  negocioNombre?: string;
  negocioTipo?: string;
  plan?: string;
  activeSection: DashboardSeccion;
  onSectionChange: (s: DashboardSeccion) => void;
  cerrarSesion: () => void | Promise<void>;
  children: React.ReactNode;
}

export default function DashboardShell({
  negocioNombre,
  negocioTipo,
  plan,
  activeSection,
  onSectionChange,
  cerrarSesion,
  children,
}: Props) {
  const [colapsado, setColapsado] = useState(false);

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Sidebar ── */}
      <aside
        className={`flex-shrink-0 bg-slate-900 text-slate-300 flex flex-col transition-all duration-200 ${
          colapsado ? "w-[72px]" : "w-64"
        } hidden md:flex`}
      >
        <div className="flex items-center gap-2 px-4 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-sm flex-shrink-0">
            📅
          </div>
          {!colapsado && (
            <span className="text-base font-semibold text-white tracking-tight">
              CitasYa
            </span>
          )}
          <button
            onClick={() => setColapsado((c) => !c)}
            className="ml-auto text-slate-500 hover:text-white transition-colors text-xs"
            aria-label="Contraer menú"
          >
            {colapsado ? "»" : "«"}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === activeSection;
            const isFuncional = item.disponible;
            return (
              <button
                key={item.id}
                disabled={!isFuncional}
                onClick={() => isFuncional && onSectionChange(item.id as DashboardSeccion)}
                title={!isFuncional ? "Próximamente" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                  isActive
                    ? "bg-slate-800 text-white font-medium"
                    : isFuncional
                    ? "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    : "text-slate-600 cursor-not-allowed"
                }`}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!colapsado && <span className="truncate">{item.label}</span>}
                {!colapsado && !isFuncional && (
                  <span className="ml-auto text-[10px] text-slate-600 border border-slate-700 rounded-full px-1.5 py-0.5">
                    Pronto
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-3 flex flex-col gap-2">
          {!colapsado && (
            <div className="px-2">
              <p className="text-sm text-white font-medium truncate">{negocioNombre}</p>
              <p className="text-xs text-slate-500 capitalize">
                {negocioTipo} · {plan || "gratuito"}
              </p>
            </div>
          )}
          <form action={cerrarSesion}>
            <button className="w-full text-left px-2 py-1.5 text-xs text-slate-500 hover:text-white transition-colors">
              {colapsado ? "⏻" : "Cerrar sesión"}
            </button>
          </form>
        </div>
      </aside>

      {/* ── Contenido ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar móvil (sidebar se oculta en pantallas chicas) */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <span className="text-sm font-semibold text-slate-900">CitasYa</span>
          <div className="flex items-center gap-3">
            {NAV_ITEMS.filter((i) => i.disponible).map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id as DashboardSeccion)}
                className={`text-xs px-2 py-1 rounded-lg ${
                  item.id === activeSection
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500"
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
