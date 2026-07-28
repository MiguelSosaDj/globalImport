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
      .update({ estado_cita: "atendida" })
      .eq("id", citaId)
      .select()
      .single();

    if (error) {
      console.error("Error marcando cita como atendida:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Si la cita usa un paquete de sesiones, descuenta una sesión.
    if (data?.paquete_paciente_id) {
      const { data: paquetePaciente } = await supabaseAdmin
        .from("paquetes_pacientes")
        .select("sesiones_usadas, sesiones_restantes")
        .eq("id", data.paquete_paciente_id)
        .single();

      if (paquetePaciente && paquetePaciente.sesiones_restantes > 0) {
        const restantes = paquetePaciente.sesiones_restantes - 1;
        await supabaseAdmin
          .from("paquetes_pacientes")
          .update({
            sesiones_usadas: paquetePaciente.sesiones_usadas + 1,
            sesiones_restantes: restantes,
            estado: restantes === 0 ? "agotado" : "activo",
          })
          .eq("id", data.paquete_paciente_id);
      }
    }

    return NextResponse.json({ cita: data });
  } catch (error: any) {
    console.error("Error en /api/citas/atendida:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
