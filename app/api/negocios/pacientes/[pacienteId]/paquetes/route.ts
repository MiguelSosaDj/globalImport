import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireOwnPaciente } from "@/lib/auth-negocio";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pacienteId: string }> }
) {
  try {
    const { pacienteId } = await params;

    const auth = await requireOwnPaciente(pacienteId);
    if (auth.error) return auth.error;

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("paquetes_pacientes")
      .select("id, sesiones_usadas, sesiones_restantes, fecha_vencimiento, estado, paquetes(nombre)")
      .eq("paciente_id", pacienteId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error consultando paquetes del paciente:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ paquetesPaciente: data });
  } catch (error: any) {
    console.error("Error en GET .../paquetes:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
