import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireOwnServicio } from "@/lib/auth-negocio";

const CAMPOS_EDITABLES = [
  "nombre",
  "descripcion",
  "categoria",
  "duracion_min",
  "precio",
  "moneda",
  "anticipo_tipo",
  "anticipo_valor",
  "color",
  "activo",
  "permite_pago_online",
  "permite_reserva_publica",
  "imagen_url",
  "tiempo_prep_antes_min",
  "tiempo_prep_despues_min",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ servicioId: string }> }
) {
  try {
    const { servicioId } = await params;

    const auth = await requireOwnServicio(servicioId);
    if (auth.error) return auth.error;

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    for (const campo of CAMPOS_EDITABLES) {
      if (campo in body) updates[campo] = body[campo];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("servicios")
      .update(updates)
      .eq("id", servicioId)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando servicio:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ servicio: data });
  } catch (error: any) {
    console.error("Error en PATCH /api/negocios/servicios/[servicioId]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
