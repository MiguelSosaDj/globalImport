import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireOwnNegocio } from "@/lib/auth-negocio";

export async function POST(req: NextRequest) {
  try {
    const { negocioId, horarios, duracionCita } = await req.json();

    const auth = await requireOwnNegocio(negocioId);
    if (auth.error) return auth.error;

    if (!horarios) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    if (!Array.isArray(horarios)) {
      return NextResponse.json(
        { error: "horarios debe ser un array" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdmin();

    // Actualiza duración de cita en el negocio
    if (duracionCita) {
      const { error: duracionError } = await supabaseAdmin
        .from("negocios")
        .update({ duracion_cita: duracionCita })
        .eq("id", negocioId);

      if (duracionError) {
        console.error("Error actualizando duración de cita:", duracionError);

        return NextResponse.json(
          { error: duracionError.message },
          { status: 500 }
        );
      }
    }

    // Upsert de horarios
    const horariosPayload = horarios.map((h) => ({
      negocio_id: negocioId,
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      activo: h.activo,
    }));

    const { error: horariosError } = await supabaseAdmin
      .from("horarios_disponibilidad")
      .upsert(horariosPayload, {
        onConflict: "negocio_id,dia_semana",
      });

    if (horariosError) {
      console.error("Error guardando horarios:", horariosError);

      return NextResponse.json(
        { error: horariosError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error en POST /api/negocios/horarios:", error);

    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const negocioId = req.nextUrl.searchParams.get("negocioId");

    const auth = await requireOwnNegocio(negocioId);
    if (auth.error) return auth.error;

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("horarios_disponibilidad")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("dia_semana", { ascending: true });

    if (error) {
      console.error("Error consultando horarios:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ horarios: data });
  } catch (error: any) {
    console.error("Error en GET /api/negocios/horarios:", error);

    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
