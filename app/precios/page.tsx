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

      <div className="pt-16">
        <PlanesSection />
      </div>
    </main>
  );
}
