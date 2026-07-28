import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

// Ruta pública (sin login): Stripe redirige aquí cuando el cliente abandona
// el checkout. citaId viene del cancel_url que nosotros mismos generamos al
// crear la sesión — nadie más puede adivinarlo. Por seguridad extra, solo
// cancela si la cita sigue en estado_pago='pendiente' (nunca toca una cita
// ya pagada), así se libera su cupo de horario y deja de contar contra el
// límite mensual del negocio.
export async function POST(req: NextRequest) {
  try {
    const { citaId } = await req.json();

    if (!citaId) {
      return NextResponse.json({ error: "Falta citaId" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from("citas")
      .update({ estado_cita: "cancelada" })
      .eq("id", citaId)
      .eq("estado_pago", "pendiente");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
