import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireOwnPaquete, requireOwnPaciente } from "@/lib/auth-negocio";

// Vende (asigna) un paquete a un paciente: crea el registro de sesiones
// disponibles en paquetes_pacientes.
export async function POST(req: NextRequest) {
  try {
    const { paqueteId, pacienteId } = await req.json();

    const authPaquete = await requireOwnPaquete(paqueteId);
    if (authPaquete.error) return authPaquete.error;

    const authPaciente = await requireOwnPaciente(pacienteId);
    if (authPaciente.error) return authPaciente.error;

    // Ambos deben pertenecer al mismo negocio del usuario autenticado.
    if (authPaquete.paquete.negocio_id !== authPaciente.paciente.negocio_id) {
      return NextResponse.json(
        { error: "El paquete y el paciente no pertenecen al mismo negocio" },
        { status: 400 }
      );
    }

    const numeroSesiones = authPaquete.paquete.numero_sesiones as number;
    const vigenciaDias = (authPaquete.paquete.vigencia_dias as number) || 90;
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + vigenciaDias);

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("paquetes_pacientes")
      .insert({
        paquete_id: paqueteId,
        paciente_id: pacienteId,
        sesiones_restantes: numeroSesiones,
        fecha_vencimiento: fechaVencimiento.toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (error) {
      console.error("Error vendiendo paquete:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ paquetePaciente: data });
  } catch (error: any) {
    console.error("Error en POST /api/negocios/paquetes/vender:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
