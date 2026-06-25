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

    const { citaId } = await req.json();

    if (!citaId) {
      return NextResponse.json({ error: "Falta citaId" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("citas")
      .update({ estado_cita: "confirmada" })
      .eq("id", citaId)
      .select()
      .single();

    if (error) {
      console.error("Error confirmando cita:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cita: data });
  } catch (error: any) {
    console.error("Error en /api/citas/confirmar:", error);

    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}