import PlanesSection from "./components/PlanesSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080808] text-white overflow-hidden">

      {/* Ambient glow background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[800px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-white/5 backdrop-blur-sm">
        <span className="text-lg font-semibold tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            Citas
          </span>
          Ya
        </span>
        <div className="flex items-center gap-6">
          <a
            href="/login"
            className="text-sm text-zinc-400 hover:text-white transition-all duration-300"
          >
            Iniciar sesión
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-28 pb-20 gap-8">


        <h1 className="text-7xl font-bold max-w-4xl leading-[1.05] tracking-tight">
          Tus citas,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">
            bajo tu control
          </span>
        </h1>

        <p className="text-lg text-zinc-400 max-w-lg leading-relaxed">
          La herramienta de agendamiento para barberías, clínicas y negocios en Colombia.
          Sin dólares, sin inglés, sin complicaciones.
        </p>

        <div className="flex items-center gap-4 mt-2">
          <a
            href="/agendar"
            className="text-sm font-medium px-8 py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transition-all duration-300 hover:scale-105"
          >
            Empieza gratis
          </a>
          <a
            href="/demo"
            className="text-sm text-zinc-400 hover:text-white transition-all duration-300 underline underline-offset-4"
          >
            Ver demo
          </a>
        </div>

        <div className="flex items-center gap-10 mt-8 pt-8 border-t border-white/5">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-bold text-white">2,400+</span>
            <span className="text-xs text-zinc-500">citas agendadas</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-bold text-white">180+</span>
            <span className="text-xs text-zinc-500">negocios activos</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-bold text-white">98%</span>
            <span className="text-xs text-zinc-500">tasa de confirmación</span>
          </div>
        </div>

      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="group relative bg-white/[0.03] border border-white/5 rounded-2xl p-8 flex flex-col gap-4 hover:border-white/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-violet-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="relative text-xs font-medium tracking-widest uppercase text-violet-400">Agendamiento</p>
            <h3 className="relative text-base font-semibold text-white leading-snug">Tus clientes reservan en segundos</h3>
            <p className="relative text-sm text-zinc-500 leading-relaxed">Comparte tu link y recibe reservas 24/7 sin llamadas ni mensajes.</p>
          </div>

          <div className="group relative bg-white/[0.03] border border-white/5 rounded-2xl p-8 flex flex-col gap-4 hover:border-white/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="relative text-xs font-medium tracking-widest uppercase text-violet-400">Recordatorios</p>
            <h3 className="relative text-base font-semibold text-white leading-snug">Reduce los no-shows automáticamente</h3>
            <p className="relative text-sm text-zinc-500 leading-relaxed">Notificaciones automáticas por WhatsApp antes de cada cita.</p>
          </div>

          <div className="group relative bg-white/[0.03] border border-white/5 rounded-2xl p-8 flex flex-col gap-4 hover:border-white/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <p className="relative text-xs font-medium tracking-widest uppercase text-violet-400">Pagos</p>
            <h3 className="relative text-base font-semibold text-white leading-snug">Cobra antes de que lleguen</h3>
            <p className="relative text-sm text-zinc-500 leading-relaxed">Acepta pagos anticipados y elimina las citas fantasma.</p>
          </div>

        </div>
      </section>

      {/* Pricing */}
      <PlanesSection />

      {/* CTA final */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pb-32 gap-6">
        <div className="relative max-w-2xl mx-auto w-full rounded-3xl border border-white/5 bg-white/[0.02] p-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 to-transparent pointer-events-none" />
          <h2 className="relative text-4xl font-bold tracking-tight mb-4">
            Listo para llenar tu agenda
          </h2>
          <p className="relative text-zinc-400 text-base max-w-md mx-auto mb-8">
            Crea tu cuenta gratis y recibe tu primera cita hoy mismo.
          </p>
          <a
            href="/registro"
            className="relative inline-block bg-white text-zinc-950 text-sm font-semibold px-8 py-3.5 rounded-full hover:bg-zinc-100 transition-all duration-300 hover:scale-105"
          >
            Crear cuenta gratis
          </a>
        </div>
      </section>

    </main>
  );
}