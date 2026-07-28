import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireOwnProfesional } from "@/lib/auth-negocio";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ profesionalId: string }> }
) {
  try {
    const { profesionalId } = await params;

    const auth = await requireOwnProfesional(profesionalId);
    if (auth.error) return auth.error;

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("profesional_horarios")
      .select("*")
      .eq("profesional_id", profesionalId)
      .order("dia_semana", { ascending: true });

    if (error) {
      console.error("Error consultando horarios del profesional:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ horarios: data });
  } catch (error: any) {
    console.error("Error en GET .../horarios:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ profesionalId: string }> }
) {
  try {
    const { profesionalId } = await params;

    const auth = await requireOwnProfesional(profesionalId);
    if (auth.error) return auth.error;

    const { horarios } = await req.json();

    if (!Array.isArray(horarios)) {
      return NextResponse.json({ error: "horarios debe ser un array" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const payload = horarios.map((h) => ({
      profesional_id: profesionalId,
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      activo: h.activo,
    }));

    const { error } = await supabaseAdmin
      .from("profesional_horarios")
      .upsert(payload, { onConflict: "profesional_id,dia_semana" });

    if (error) {
      console.error("Error guardando horarios del profesional:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error en POST .../horarios:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
