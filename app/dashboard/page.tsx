// app/dashboard/page.tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

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