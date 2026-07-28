import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireOwnCita } from "@/lib/auth-negocio";

export async function POST(req: NextRequest) {
  try {
    const { citaId, monto } = await req.json();

    const auth = await requireOwnCita(citaId);
    if (auth.error) return auth.error;

    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("citas")
      .update({ estado_pago: "pagado", monto: montoNum })
      .eq("id", citaId)
      .select()
      .single();

    if (error) {
      console.error("Error marcando pago:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cita: data });
  } catch (error: any) {
    console.error("Error en /api/citas/marcar-pago:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
