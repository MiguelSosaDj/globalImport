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
      .from("servicios")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error consultando servicios:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ servicios: data });
  } catch (error: any) {
    console.error("Error en GET /api/negocios/servicios:", error);
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
      .from("servicios")
      .insert({
        negocio_id: negocioId,
        nombre: nombre.trim(),
        descripcion: body.descripcion || null,
        categoria: body.categoria || null,
        duracion_min: body.duracion_min || 30,
        precio: body.precio || 0,
        moneda: body.moneda || "COP",
        anticipo_tipo: body.anticipo_tipo || "ninguno",
        anticipo_valor: body.anticipo_valor || null,
        color: body.color || null,
        permite_pago_online: !!body.permite_pago_online,
        permite_reserva_publica: body.permite_reserva_publica !== false,
        tiempo_prep_antes_min: body.tiempo_prep_antes_min || 0,
        tiempo_prep_despues_min: body.tiempo_prep_despues_min || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creando servicio:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ servicio: data });
  } catch (error: any) {
    console.error("Error en POST /api/negocios/servicios:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
