import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireOwnProfesional } from "@/lib/auth-negocio";

const CAMPOS_EDITABLES = [
  "nombre",
  "apellidos",
  "foto_url",
  "telefono",
  "correo",
  "especialidad",
  "descripcion",
  "color",
  "activo",
  "tiempo_preparacion_min",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ profesionalId: string }> }
) {
  try {
    const { profesionalId } = await params;

    const auth = await requireOwnProfesional(profesionalId);
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
      .from("profesionales")
      .update(updates)
      .eq("id", profesionalId)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando profesional:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profesional: data });
  } catch (error: any) {
    console.error("Error en PATCH /api/negocios/profesionales/[profesionalId]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
