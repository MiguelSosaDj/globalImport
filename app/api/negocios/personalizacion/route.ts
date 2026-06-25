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

    const { negocioId, colorPrimario, colorSecundario } = await req.json();

    if (!negocioId) {
      return NextResponse.json({ error: "Falta negocioId" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("negocios")
      .update({
        color_primario: colorPrimario,
        color_secundario: colorSecundario,
      })
      .eq("id", negocioId)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando personalización:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ negocio: data });
  } catch (error: any) {
    console.error("Error en /api/negocios/personalizacion:", error);

    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}