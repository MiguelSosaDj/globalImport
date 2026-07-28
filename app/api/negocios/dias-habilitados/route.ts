import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();

    const negocioId = req.nextUrl.searchParams.get("negocioId");

    if (!negocioId) {
      return NextResponse.json(
        { error: "Falta negocioId" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("horarios_disponibilidad")
      .select("dia_semana, activo")
      .eq("negocio_id", negocioId);

    if (error) {
      console.error("Error consultando días habilitados:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const diasActivos = (data || [])
      .filter((d) => d.activo)
      .map((d) => d.dia_semana);

    return NextResponse.json({ diasActivos });
  } catch (error: any) {
    console.error("Error en /api/negocios/dias-habilitados:", error);

    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}