import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireOwnPaquete } from "@/lib/auth-negocio";

const CAMPOS_EDITABLES = [
  "nombre",
  "numero_sesiones",
  "precio",
  "vigencia_dias",
  "condiciones",
  "activo",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ paqueteId: string }> }
) {
  try {
    const { paqueteId } = await params;

    const auth = await requireOwnPaquete(paqueteId);
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
      .from("paquetes")
      .update(updates)
      .eq("id", paqueteId)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando paquete:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ paquete: data });
  } catch (error: any) {
    console.error("Error en PATCH /api/negocios/paquetes/[paqueteId]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
