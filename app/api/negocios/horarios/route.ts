import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { negocioId, horarios, duracionCita } = await req.json();

    if (!negocioId || !horarios) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    // Actualiza duración de cita en el negocio
    if (duracionCita) {
      await supabaseAdmin
        .from("negocios")
        .update({ duracion_cita: duracionCita })
        .eq("id", negocioId);
    }

    // Upsert de cada día
    for (const h of horarios) {
      await supabaseAdmin
        .from("horarios_disponibilidad")
        .upsert(
          {
            negocio_id: negocioId,
            dia_semana: h.dia_semana,
            hora_inicio: h.hora_inicio,
            hora_fin: h.hora_fin,
            activo: h.activo,
          },
          { onConflict: "negocio_id,dia_semana" }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const negocioId = req.nextUrl.searchParams.get("negocioId");
    if (!negocioId) {
      return NextResponse.json({ error: "Falta negocioId" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("horarios_disponibilidad")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("dia_semana", { ascending: true });

    if (error) throw new Error(error.message);

    return NextResponse.json({ horarios: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}