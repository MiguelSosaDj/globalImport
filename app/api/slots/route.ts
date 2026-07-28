import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();

    const negocioId = req.nextUrl.searchParams.get("negocioId");
    const fecha = req.nextUrl.searchParams.get("fecha");

    if (!negocioId || !fecha) {
      return NextResponse.json(
        { error: "Faltan parámetros" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc("get_available_slots", {
      p_negocio_id: negocioId,
      p_fecha: fecha,
    });

    if (error) {
      console.error("Error consultando slots disponibles:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ slots: data || [] });
  } catch (error: any) {
    console.error("Error en /api/slots:", error);

    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}