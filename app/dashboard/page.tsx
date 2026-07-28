// app/dashboard/page.tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import AdminPanel from "./AdminPanel";
import { ADMIN_EMAIL } from "@/lib/auth-admin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

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

  async function cerrarSesionAdmin() {
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

  // El correo administrador de la plataforma ve un panel distinto al de un
  // negocio normal — administra métodos de pago y solicitudes de
  // suscripción, no tiene agenda propia.
  if (user.email === ADMIN_EMAIL) {
    return <AdminPanel cerrarSesion={cerrarSesionAdmin} />;
  }

  const { data: negocio } = await supabase
    .from("negocios")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // El plan puede vencer de dos formas: Stripe cancela la suscripción y el
  // webhook ya marca subscription_status "inactivo" directamente; el pago
  // manual por Nequi no tiene ciclo de facturación, así que aquí revisamos
  // subscription_end (calculado al aprobar la solicitud según mensual/anual)
  // y desactivamos el acceso apenas se cumple la fecha, sin esperar a que
  // ocurra ningún webhook.
  const vencido =
    !!negocio?.subscription_end && new Date(negocio.subscription_end) < new Date();

  if (vencido && negocio && negocio.subscription_status !== "inactivo") {
    const supabaseAdmin = createSupabaseAdmin();
    await supabaseAdmin
      .from("negocios")
      .update({ subscription_status: "inactivo" })
      .eq("id", negocio.id);
  }

  if (vencido) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 w-full max-w-md text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Tu plan venció</h1>
          <p className="text-sm text-slate-500 mb-6">
            Tu suscripción a CitasYa venció. Renueva tu plan para volver a acceder a tu agenda.
          </p>
          <a
            href="/precios"
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-3 rounded-xl transition-colors"
          >
            Ver planes y renovar
          </a>
          <form action={cerrarSesionAdmin} className="mt-4">
            <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Cerrar sesión
            </button>
          </form>
        </div>
      </main>
    );
  }

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

  const agendamientoUrl = `${process.env.NEXT_PUBLIC_APP_URL}/agendar/${negocio?.id}`;

  return (
    <DashboardClient
      negocio={negocio}
      citas={citas ?? []}
      agendamientoUrl={agendamientoUrl}
      cerrarSesion={cerrarSesion}
    />
  );
}