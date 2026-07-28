import Link from "next/link";
import PlanesSection from "../components/PlanesSection";

export default function PreciosPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="flex items-center justify-between px-10 py-6 border-b border-slate-200">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          <span className="text-blue-600">Citas</span>Ya
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
            Iniciar sesion
          </Link>
        </div>
      </nav>

      <section className="flex flex-col items-center text-center px-6 pt-20 pb-12 gap-4">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          Planes y <span className="text-blue-600">precios</span>
        </h1>
        <p className="text-slate-600 max-w-md">
          Sin sorpresas. Cancela cuando quieras. Todos los planes incluyen 7 dias gratis.
        </p>
      </section>

      <PlanesSection />
    </main>
  );
}
