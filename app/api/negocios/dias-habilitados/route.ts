import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const negocioId = req.nextUrl.searchParams.get("negocioId");
    if (!negocioId) {
      return NextResponse.json({ error: "Falta negocioId" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("horarios_disponibilidad")
      .select("dia_semana, activo")
      .eq("negocio_id", negocioId);

    if (error) throw new Error(error.message);

    // Devuelve array de dia_semana activos: [1,2,3,4,5]
    const diasActivos = (data || [])
      .filter((d) => d.activo)
      .map((d) => d.dia_semana);

    return NextResponse.json({ diasActivos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}