import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireOwnNegocio } from "@/lib/auth-negocio";

export async function GET(req: NextRequest) {
  try {
    const negocioId = req.nextUrl.searchParams.get("negocioId");

    const auth = await requireOwnNegocio(negocioId);
    if (auth.error) return auth.error;

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("profesionales")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error consultando profesionales:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profesionales: data });
  } catch (error: any) {
    console.error("Error en GET /api/negocios/profesionales:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { negocioId, nombre } = body;

    const auth = await requireOwnNegocio(negocioId);
    if (auth.error) return auth.error;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("profesionales")
      .insert({
        negocio_id: negocioId,
        nombre: nombre.trim(),
        apellidos: body.apellidos || null,
        telefono: body.telefono || null,
        correo: body.correo || null,
        especialidad: body.especialidad || null,
        descripcion: body.descripcion || null,
        color: body.color || null,
        tiempo_preparacion_min: body.tiempo_preparacion_min || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creando profesional:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profesional: data });
  } catch (error: any) {
    console.error("Error en POST /api/negocios/profesionales:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
