import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireOwnNegocio } from "@/lib/auth-negocio";

// Marca como "enviado" el recordatorio de WhatsApp de una o varias citas
// (individual o el botón "Enviar a todos"). Solo actualiza citas que
// pertenezcan al negocio autenticado — negocioId + requireOwnNegocio
// aseguran que no se puedan marcar citas de otro negocio aunque se
// adivinen los ids.
export async function POST(req: NextRequest) {
  try {
    const { negocioId, citaIds } = await req.json();

    const auth = await requireOwnNegocio(negocioId);
    if (auth.error) return auth.error;

    if (!Array.isArray(citaIds) || citaIds.length === 0) {
      return NextResponse.json({ error: "Faltan citaIds" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("citas")
      .update({ recordatorio_enviado: true })
      .eq("negocio_id", negocioId)
      .in("id", citaIds);

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
