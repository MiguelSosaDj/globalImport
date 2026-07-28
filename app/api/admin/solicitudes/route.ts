import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-admin";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("solicitudes_suscripcion")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error consultando solicitudes:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ solicitudes: data });
  } catch (error: any) {
    console.error("Error en GET /api/admin/solicitudes:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
