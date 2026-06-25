import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const negocioId = formData.get("negocioId") as string;

    if (!file || !negocioId) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const ext = file.name.split(".").pop();
    const fileName = `${negocioId}-${Date.now()}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from("logos")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabaseAdmin.storage
      .from("logos")
      .getPublicUrl(fileName);

    const { error: updateError } = await supabaseAdmin
      .from("negocios")
      .update({ logo_url: urlData.publicUrl })
      .eq("id", negocioId);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ logoUrl: urlData.publicUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}