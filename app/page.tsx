import Link from "next/link";
import PlanesSection from "./components/PlanesSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* Nav */}
      <nav className="flex items-center justify-between px-5 sm:px-10 py-4 sm:py-6 border-b border-slate-200">
        <span className="text-base sm:text-lg font-semibold tracking-tight">
          <span className="text-blue-600">Citas</span>Ya
        </span>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-5 sm:px-6 pt-16 sm:pt-28 pb-16 sm:pb-20 gap-6 sm:gap-8 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-[-10%] h-[500px] -z-10"
          style={{
            background:
              "radial-gradient(ellipse 700px 400px at 50% 0%, rgba(37,99,235,0.08), transparent 70%)",
          }}
        />

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold max-w-4xl leading-[1.1] sm:leading-[1.05] tracking-tight text-slate-900">
          Tus citas, <span className="text-blue-600">bajo tu control</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-lg leading-relaxed">
          La herramienta de agendamiento para barberías, clínicas y negocios en Colombia.
          Sin dólares, sin inglés, sin complicaciones.
        </p>

        <div className="flex items-center gap-4 mt-2">
          <Link
            href="/agendar"
            className="text-sm font-medium px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 hover:scale-105"
          >
            Empieza gratis
          </Link>
        </div>

        <div className="flex items-center gap-6 sm:gap-10 mt-8 pt-8 border-t border-slate-200">
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

      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-sm shadow-slate-200/50 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1 transition-all duration-300">
            <p className="text-xs font-medium tracking-widest uppercase text-blue-600">Agendamiento</p>
            <h3 className="text-base font-semibold text-slate-900 leading-snug">Tus clientes reservan en segundos</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Comparte tu link y recibe reservas 24/7 sin llamadas ni mensajes.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-sm shadow-slate-200/50 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1 transition-all duration-300">
            <p className="text-xs font-medium tracking-widest uppercase text-blue-600">Recordatorios</p>
            <h3 className="text-base font-semibold text-slate-900 leading-snug">Reduce los no-shows automáticamente</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Notificaciones automáticas por WhatsApp antes de cada cita.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-sm shadow-slate-200/50 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1 transition-all duration-300">
            <p className="text-xs font-medium tracking-widest uppercase text-blue-600">Pagos</p>
            <h3 className="text-base font-semibold text-slate-900 leading-snug">Cobra antes de que lleguen</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Acepta pagos anticipados y elimina las citas fantasma.</p>
          </div>

        </div>
      </section>

      {/* Pricing */}
      <PlanesSection />

      {/* CTA final */}
      <section className="flex flex-col items-center text-center px-5 sm:px-6 pb-20 sm:pb-32 gap-6">
        <div className="max-w-2xl mx-auto w-full rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-blue-50 to-white p-8 sm:p-16 shadow-sm">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4 text-slate-900">
            Listo para llenar tu agenda
          </h2>
          <p className="text-slate-600 text-base max-w-md mx-auto mb-8">
            Crea tu cuenta gratis y recibe tu primera cita hoy mismo.
          </p>
          <Link
            href="/registro"
            className="inline-block bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold px-8 py-3.5 rounded-full shadow-sm shadow-blue-600/30 hover:shadow-md hover:shadow-blue-600/40 transition-all duration-300 hover:scale-105"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

    </main>
  );
}
