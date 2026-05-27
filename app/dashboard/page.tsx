import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: negocio } = await supabase
    .from("negocios")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: citas } = await supabase
    .from("citas")
    .select("*")
    .eq("negocio_id", negocio?.id)
    .order("fecha", { ascending: true });

  async function cerrarSesion() {
    "use server";
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[800px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-white/5 backdrop-blur-sm">
        <span className="text-lg font-semibold tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Citas</span>Ya
        </span>
        <div className="flex items-center gap-6">
          <span className="text-sm text-zinc-400">{negocio?.nombre}</span>
          <form action={cerrarSesion}>
            <button className="text-sm text-zinc-500 hover:text-white transition-colors">
              Cerrar sesion
            </button>
          </form>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Tus citas</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            {citas?.length === 0 ? "No tienes citas aun" : `${citas?.length} citas programadas`}
          </p>
        </div>

        {citas?.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-12 text-center">
            <p className="text-zinc-500 text-sm">Aun no tienes citas agendadas.</p>
            <p className="text-zinc-600 text-xs mt-2">
              Comparte el link de agendamiento con tus clientes.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {citas?.map((cita) => (
              <div
                key={cita.id}
                className="bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-5 flex items-center justify-between hover:border-white/10 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-white">{cita.cliente_nombre}</span>
                  <span className="text-xs text-zinc-500">{cita.cliente_telefono}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-medium text-violet-400">{cita.servicio}</span>
                  <span className="text-xs text-zinc-500">{cita.fecha} a las {cita.hora}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}