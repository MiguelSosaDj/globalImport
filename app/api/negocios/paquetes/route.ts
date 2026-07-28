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
      .from("paquetes")
      .select("*, servicios(nombre)")
      .eq("negocio_id", negocioId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error consultando paquetes:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ paquetes: data });
  } catch (error: any) {
    console.error("Error en GET /api/negocios/paquetes:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { negocioId, nombre, servicioId, numeroSesiones, precio } = body;

    const auth = await requireOwnNegocio(negocioId);
    if (auth.error) return auth.error;

    if (!nombre || !nombre.trim() || !servicioId || !numeroSesiones || !precio) {
      return NextResponse.json(
        { error: "Nombre, servicio, número de sesiones y precio son requeridos" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("paquetes")
      .insert({
        negocio_id: negocioId,
        servicio_id: servicioId,
        nombre: nombre.trim(),
        numero_sesiones: numeroSesiones,
        precio,
        vigencia_dias: body.vigenciaDias || 90,
        condiciones: body.condiciones || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creando paquete:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ paquete: data });
  } catch (error: any) {
    console.error("Error en POST /api/negocios/paquetes:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
