import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ solicitudId: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { solicitudId } = await params;

    const supabaseAdmin = createSupabaseAdmin();
    const { data: solicitud, error } = await supabaseAdmin
      .from("solicitudes_suscripcion")
      .select("comprobante_path")
      .eq("id", solicitudId)
      .single();

    if (error || !solicitud) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from("comprobantes")
      .createSignedUrl(solicitud.comprobante_path, 60 * 5);

    if (signedError || !signed) {
      console.error("Error generando URL firmada:", signedError);
      return NextResponse.json({ error: "Error al generar el enlace" }, { status: 500 });
    }

    return NextResponse.json({ url: signed.signedUrl });
  } catch (error: any) {
    console.error("Error en GET .../comprobante:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
