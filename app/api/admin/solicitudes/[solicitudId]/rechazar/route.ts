import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-admin";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ solicitudId: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { solicitudId } = await params;

    const supabaseAdmin = createSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("solicitudes_suscripcion")
      .update({ estado: "rechazada", procesada_at: new Date().toISOString() })
      .eq("id", solicitudId)
      .eq("estado", "pendiente");

    if (error) {
      console.error("Error rechazando solicitud:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error en POST .../rechazar:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
