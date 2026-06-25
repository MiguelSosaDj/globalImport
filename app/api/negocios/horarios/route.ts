import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();

    const { negocioId, horarios, duracionCita } = await req.json();

    if (!negocioId || !horarios) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    if (!Array.isArray(horarios)) {
      return NextResponse.json(
        { error: "horarios debe ser un array" },
        { status: 400 }
      );
    }

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
    const supabaseAdmin = createSupabaseAdmin();

    const negocioId = req.nextUrl.searchParams.get("negocioId");

    if (!negocioId) {
      return NextResponse.json({ error: "Falta negocioId" }, { status: 400 });
    }

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