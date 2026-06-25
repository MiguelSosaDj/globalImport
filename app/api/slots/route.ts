import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const negocioId = req.nextUrl.searchParams.get("negocioId");
    const fecha = req.nextUrl.searchParams.get("fecha");

    if (!negocioId || !fecha) {
      return NextResponse.json({ error: "Faltan parametros" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc("get_available_slots", {
      p_negocio_id: negocioId,
      p_fecha: fecha,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ slots: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}