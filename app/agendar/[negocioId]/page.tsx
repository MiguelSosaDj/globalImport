import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import AgendarForm from "./AgendarForm";

export default async function AgendarPage({
  params,
}: {
  params: Promise<{ negocioId: string }>;
}) {
  const { negocioId } = await params;

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: negocio, error } = await supabase
    .from("negocios")
    .select("*")
    .eq("id", negocioId)
    .single();

  if (error || !negocio) {
    console.error("Negocio no encontrado:", error?.message);
    notFound();
  }

  return <AgendarForm negocio={negocio} />;
}