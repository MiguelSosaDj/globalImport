import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cita: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}