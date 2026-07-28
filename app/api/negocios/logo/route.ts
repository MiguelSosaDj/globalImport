import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireOwnNegocio } from "@/lib/auth-negocio";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const negocioId = formData.get("negocioId") as string | null;

    const auth = await requireOwnNegocio(negocioId);
    if (auth.error) return auth.error;

    if (!file) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();

    const ext = file.name.split(".").pop() || "png";
    const fileName = `${negocioId}-${Date.now()}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from("logos")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Error subiendo logo:", uploadError);

      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("logos")
      .getPublicUrl(fileName);

    const { error: updateError } = await supabaseAdmin
      .from("negocios")
      .update({ logo_url: urlData.publicUrl })
      .eq("id", negocioId);

    if (updateError) {
      console.error("Error actualizando logo_url:", updateError);

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ logoUrl: urlData.publicUrl });
  } catch (error: any) {
    console.error("Error en /api/negocios/logo:", error);

    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
