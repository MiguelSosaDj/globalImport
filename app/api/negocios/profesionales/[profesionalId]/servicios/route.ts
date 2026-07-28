import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireOwnProfesional } from "@/lib/auth-negocio";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ profesionalId: string }> }
) {
  try {
    const { profesionalId } = await params;

    const auth = await requireOwnProfesional(profesionalId);
    if (auth.error) return auth.error;

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("profesional_servicios")
      .select("servicio_id")
      .eq("profesional_id", profesionalId);

    if (error) {
      console.error("Error consultando servicios del profesional:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ servicioIds: (data || []).map((d) => d.servicio_id) });
  } catch (error: any) {
    console.error("Error en GET .../servicios:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Reemplaza el conjunto completo de servicios que puede realizar el profesional.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ profesionalId: string }> }
) {
  try {
    const { profesionalId } = await params;

    const auth = await requireOwnProfesional(profesionalId);
    if (auth.error) return auth.error;

    const { servicioIds } = await req.json();

    if (!Array.isArray(servicioIds)) {
      return NextResponse.json({ error: "servicioIds debe ser un array" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();

    const { error: deleteError } = await supabaseAdmin
      .from("profesional_servicios")
      .delete()
      .eq("profesional_id", profesionalId);

    if (deleteError) {
      console.error("Error limpiando servicios del profesional:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (servicioIds.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("profesional_servicios")
        .insert(servicioIds.map((servicioId: string) => ({ profesional_id: profesionalId, servicio_id: servicioId })));

      if (insertError) {
        console.error("Error asignando servicios al profesional:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error en PUT .../servicios:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
