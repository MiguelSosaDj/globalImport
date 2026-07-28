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
      .from("pacientes")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error consultando pacientes:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pacientes: data });
  } catch (error: any) {
    console.error("Error en GET /api/negocios/pacientes:", error);
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

    // Detección simple de posible duplicado por teléfono o documento.
    let posibleDuplicado = null;
    if (body.telefono || body.numero_documento) {
      const orFilters: string[] = [];
      if (body.telefono) orFilters.push(`telefono.eq.${body.telefono}`);
      if (body.numero_documento) orFilters.push(`numero_documento.eq.${body.numero_documento}`);

      const { data: existentes } = await supabaseAdmin
        .from("pacientes")
        .select("id, nombre, telefono, numero_documento")
        .eq("negocio_id", negocioId)
        .or(orFilters.join(","));

      if (existentes && existentes.length > 0) posibleDuplicado = existentes[0];
    }

    const { data, error } = await supabaseAdmin
      .from("pacientes")
      .insert({
        negocio_id: negocioId,
        nombre: nombre.trim(),
        apellidos: body.apellidos || null,
        tipo_documento: body.tipo_documento || null,
        numero_documento: body.numero_documento || null,
        telefono: body.telefono || null,
        correo: body.correo || null,
        fecha_nacimiento: body.fecha_nacimiento || null,
        direccion: body.direccion || null,
        contacto_emergencia_nombre: body.contacto_emergencia_nombre || null,
        contacto_emergencia_telefono: body.contacto_emergencia_telefono || null,
        notas: body.notas || null,
        preferencia_comunicacion: body.preferencia_comunicacion || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creando paciente:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ paciente: data, posibleDuplicado });
  } catch (error: any) {
    console.error("Error en POST /api/negocios/pacientes:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
