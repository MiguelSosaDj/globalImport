import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireOwnNegocio } from "@/lib/auth-negocio";

export async function POST(req: NextRequest) {
  try {
    const { negocioId, requierePago } = await req.json();

    const auth = await requireOwnNegocio(negocioId);
    if (auth.error) return auth.error;

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("negocios")
      .update({ requiere_pago: requierePago })
      .eq("id", negocioId)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando requiere_pago:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ negocio: data });
  } catch (error: any) {
    console.error("Error en /api/negocios/toggle-pago:", error);

    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
