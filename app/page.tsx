import Link from "next/link";
import PlanesSection from "./components/PlanesSection";

function IconAgendamiento() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M8 2.5v4M16 2.5v4M3 9.5h18" />
      <path d="M8.5 14l2 2 4-4" />
    </svg>
  );
}

function IconRecordatorios() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8.5a6 6 0 10-12 0c0 7-3 8.5-3 8.5h18s-3-1.5-3-8.5" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function IconPagos() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="6" width="19" height="13" rx="2.5" />
      <path d="M2.5 10.5h19" />
      <path d="M6 14.5h4" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: IconAgendamiento,
    tag: "Agendamiento",
    titulo: "Tus clientes reservan en segundos",
    texto: "Comparte tu link y recibe reservas 24/7 sin llamadas ni mensajes.",
  },
  {
    icon: IconRecordatorios,
    tag: "Recordatorios",
    titulo: "Reduce los no-shows automáticamente",
    texto: "Notificaciones automáticas por WhatsApp antes de cada cita.",
  },
  {
    icon: IconPagos,
    tag: "Pagos",
    titulo: "Cobra antes de que lleguen",
    texto: "Acepta pagos anticipados y elimina las citas fantasma.",
  },
];

const PASOS = [
  {
    numero: "1",
    titulo: "Elige tu plan",
    texto: "Actívalo por Stripe o Nequi y configura tus servicios y horarios.",
  },
  {
    numero: "2",
    titulo: "Comparte tu link",
    texto: "Envíalo por WhatsApp, Instagram o ponlo en tu bio. Tus clientes agendan solos.",
  },
  {
    numero: "3",
    titulo: "Recibe tus citas",
    texto: "Confírmalas desde tu dashboard y deja que los recordatorios hagan el resto.",
  },
];

const CITAS_MOCKUP = [
  { nombre: "María González", inicial: "MG", hora: "10:00 AM", servicio: "Corte + barba", estado: "confirmada" as const },
  { nombre: "Andrés Pardo", inicial: "AP", hora: "11:30 AM", servicio: "Consulta general", estado: "pendiente" as const },
  { nombre: "Laura Mesa", inicial: "LM", hora: "2:00 PM", servicio: "Masaje terapéutico", estado: "confirmada" as const },
];

function BadgeEstadoMockup({ estado }: { estado: "confirmada" | "pendiente" }) {
  if (estado === "confirmada") {
    return (
      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
        Confirmada
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
      Pendiente
    </span>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/70 via-white to-white text-slate-900">

      {/* Nav */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-5 sm:px-10 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <span className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-tight">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-sm font-bold shadow-sm shadow-blue-600/30">
            C
          </span>
          <span className="text-blue-600">Citas</span>Ya
        </span>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/precios"
            className="hidden sm:inline text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Precios
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm shadow-blue-600/20"
          >
            Iniciar sesión
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-5 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-28 gap-6 sm:gap-8 overflow-hidden">
        <div
          className="pointer-events-none absolute -top-40 -left-32 w-[420px] h-[420px] rounded-full bg-blue-300/40 blur-3xl -z-10"
        />
        <div
          className="pointer-events-none absolute -top-20 -right-24 w-[460px] h-[460px] rounded-full bg-indigo-200/50 blur-3xl -z-10"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] -z-10 opacity-[0.4]"
          style={{
            backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse 600px 320px at 50% 0%, black, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 600px 320px at 50% 0%, black, transparent 75%)",
          }}
        />

        <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Hecho para negocios en Colombia
        </span>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold max-w-4xl leading-[1.1] sm:leading-[1.05] tracking-tight text-slate-900">
          Tus citas, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">bajo tu control</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-lg leading-relaxed">
          La herramienta de agendamiento para barberías, clínicas y negocios en Colombia.
          Sin dólares, sin inglés, sin complicaciones.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-2">
          <Link
            href="/precios"
            className="text-sm font-medium px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 hover:scale-105 shadow-md shadow-blue-600/25"
          >
            Ver planes
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium px-8 py-3.5 rounded-full border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all duration-300"
          >
            Iniciar sesión
          </Link>
        </div>

        <div className="flex items-center gap-6 sm:gap-10 pt-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">2,400+</span>
            <span className="text-[11px] sm:text-xs text-slate-500 text-center">citas agendadas</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">180+</span>
            <span className="text-[11px] sm:text-xs text-slate-500 text-center">negocios activos</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">98%</span>
            <span className="text-[11px] sm:text-xs text-slate-500 text-center">tasa de confirmación</span>
          </div>
        </div>

        {/* Mockup del producto */}
        <div className="relative w-full max-w-lg mx-auto mt-6">
          <div className="absolute -inset-6 bg-gradient-to-tr from-blue-300/40 via-indigo-200/30 to-transparent rounded-[2.5rem] blur-2xl -z-10" />
          <div className="relative bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-blue-900/10 p-5 sm:p-6 text-left">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
              <div>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Hoy</p>
                <p className="text-sm font-semibold text-slate-900">28 de julio</p>
              </div>
              <span className="text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full whitespace-nowrap">
                9 citas activas
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {CITAS_MOCKUP.map((c) => (
                <div
                  key={c.nombre}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {c.inicial}
                    </span>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-semibold text-slate-900 truncate">{c.nombre}</p>
                      <p className="text-[11px] text-slate-500 truncate">{c.servicio}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[11px] text-slate-500 font-medium">{c.hora}</span>
                    <BadgeEstadoMockup estado={c.estado} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* Features */}
      <section className="relative bg-slate-50/80 border-y border-slate-200 py-16 sm:py-24 overflow-hidden">
        <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-blue-100/60 blur-3xl -z-10" />
        <div className="relative max-w-5xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col items-center text-center gap-3 mb-10 sm:mb-14">
            <p className="text-xs font-medium tracking-widest uppercase text-blue-600">Todo en un solo lugar</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Menos fricción, más citas
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, tag, titulo, texto }) => (
              <div
                key={tag}
                className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-sm shadow-slate-200/50 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium tracking-widest uppercase text-blue-600">{tag}</p>
                  <h3 className="text-base font-semibold text-slate-900 leading-snug">{titulo}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute top-0 right-0 w-[460px] h-[460px] rounded-full bg-indigo-200/50 blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-[420px] h-[420px] rounded-full bg-blue-200/50 blur-3xl -z-10 -translate-x-1/3 translate-y-1/3"
        />
        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
        <div className="flex flex-col items-center text-center gap-3 mb-10 sm:mb-14">
          <p className="text-xs font-medium tracking-widest uppercase text-blue-600">Cómo funciona</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Listo en 3 pasos
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
          {PASOS.map((p, i) => (
            <div key={p.numero} className="relative flex flex-col gap-3 px-2">
              <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm shadow-blue-600/30">
                {p.numero}
              </span>
              <h3 className="text-base font-semibold text-slate-900">{p.titulo}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{p.texto}</p>
              {i < PASOS.length - 1 && (
                <div className="hidden sm:block absolute top-5 left-[calc(100%-1.25rem)] w-[calc(100%-1.5rem)] border-t border-dashed border-slate-300" />
              )}
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* Pricing */}
      <PlanesSection />

      {/* CTA final */}
      <section className="relative flex flex-col items-center text-center px-5 sm:px-6 pb-20 sm:pb-32 gap-6 overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] rounded-full bg-blue-200/50 blur-3xl -z-10" />
        <div className="max-w-2xl mx-auto w-full rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-100 via-blue-50 to-white p-8 sm:p-16 shadow-xl shadow-blue-900/10">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4 text-slate-900">
            Listo para llenar tu agenda
          </h2>
          <p className="text-slate-600 text-base max-w-md mx-auto mb-8">
            Elige tu plan y recibe tu primera cita hoy mismo.
          </p>
          <Link
            href="/precios"
            className="inline-block bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold px-8 py-3.5 rounded-full shadow-sm shadow-blue-600/30 hover:shadow-md hover:shadow-blue-600/40 transition-all duration-300 hover:scale-105"
          >
            Ver planes
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8 px-5 sm:px-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-2 font-medium text-slate-700">
            <span className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-xs font-bold">
              C
            </span>
            <span className="text-blue-600">Citas</span>Ya
          </span>
          <span>© {new Date().getFullYear()} CitasYa. Todos los derechos reservados.</span>
        </div>
      </footer>

    </main>
  );
}
