import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireOwnPaciente } from "@/lib/auth-negocio";

const CAMPOS_EDITABLES = [
  "nombre",
  "apellidos",
  "tipo_documento",
  "numero_documento",
  "telefono",
  "correo",
  "fecha_nacimiento",
  "direccion",
  "contacto_emergencia_nombre",
  "contacto_emergencia_telefono",
  "notas",
  "preferencia_comunicacion",
  "activo",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ pacienteId: string }> }
) {
  try {
    const { pacienteId } = await params;

    const auth = await requireOwnPaciente(pacienteId);
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
      .from("pacientes")
      .update(updates)
      .eq("id", pacienteId)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando paciente:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ paciente: data });
  } catch (error: any) {
    console.error("Error en PATCH /api/negocios/pacientes/[pacienteId]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
