import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-admin";

// Público a propósito: la página de precios necesita saber si mostrar el
// flujo de Stripe o el modal de Nequi antes de que el visitante inicie sesión.
export async function GET() {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("app_config")
      .select("metodo_pago")
      .eq("id", 1)
      .single();

    if (error || !data) {
      return NextResponse.json({ metodoPago: "stripe" });
    }

    return NextResponse.json({ metodoPago: data.metodo_pago });
  } catch (error: any) {
    console.error("Error en GET /api/config/metodo-pago:", error);
    return NextResponse.json({ metodoPago: "stripe" });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { metodoPago } = await req.json();

    if (metodoPago !== "stripe" && metodoPago !== "nequi") {
      return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("app_config")
      .update({ metodo_pago: metodoPago, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (error) {
      console.error("Error actualizando método de pago:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ metodoPago });
  } catch (error: any) {
    console.error("Error en PATCH /api/config/metodo-pago:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
