import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireOwnCita } from "@/lib/auth-negocio";

export async function POST(req: NextRequest) {
  try {
    const { citaId } = await req.json();

    const auth = await requireOwnCita(citaId);
    if (auth.error) return auth.error;

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("citas")
      .update({ estado_cita: "cancelada" })
      .eq("id", citaId)
      .select()
      .single();

    if (error) {
      console.error("Error cancelando cita:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cita: data });
  } catch (error: any) {
    console.error("Error en /api/citas/cancelar:", error);

    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
