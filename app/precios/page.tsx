import Link from "next/link";
import PlanesSection from "../components/PlanesSection";

export default function PreciosPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-white overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[800px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[100px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-white/5 backdrop-blur-sm">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Citas</span>Ya
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Iniciar sesion
          </Link>
        </div>
      </nav>

      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-12 gap-4">
        <h1 className="text-5xl font-bold tracking-tight">
          Planes y{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            precios
          </span>
        </h1>
        <p className="text-zinc-400 max-w-md">
          Sin sorpresas. Cancela cuando quieras. Todos los planes incluyen 7 dias gratis.
        </p>
      </section>

      <PlanesSection />
    </main>
  );
}