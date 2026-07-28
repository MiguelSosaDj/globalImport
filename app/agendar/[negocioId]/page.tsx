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
    .from("negocios_publico")
    .select("*")
    .eq("id", negocioId)
    .single();

  if (error || !negocio) {
    console.error("Negocio no encontrado:", error?.message);
    notFound();
  }

  const { data: servicios } = await supabase
    .from("servicios")
    .select(
      "id, nombre, descripcion, categoria, duracion_min, precio, anticipo_tipo, anticipo_valor, imagen_url"
    )
    .eq("negocio_id", negocioId)
    .eq("activo", true)
    .eq("permite_reserva_publica", true)
    .order("created_at", { ascending: true });

  const { data: profesionales } = await supabase
    .from("profesionales")
    .select("id, nombre, apellidos, especialidad, color")
    .eq("negocio_id", negocioId)
    .eq("activo", true)
    .order("created_at", { ascending: true });

  const { data: paquetes } = await supabase
    .from("paquetes")
    .select("id, nombre, numero_sesiones, precio, vigencia_dias, servicios(nombre)")
    .eq("negocio_id", negocioId)
    .eq("activo", true)
    .order("created_at", { ascending: true });

  return (
    <AgendarForm
      negocio={negocio}
      serviciosDb={servicios || []}
      profesionalesDb={profesionales || []}
      paquetesDb={paquetes || []}
    />
  );
}