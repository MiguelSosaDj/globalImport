import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

// Ruta pública: cualquier visitante sin sesión puede enviar su comprobante
// de pago por Nequi para solicitar una suscripción. Sube el archivo y crea
// la solicitud usando el service role — el bucket `comprobantes` es privado
// y no tiene políticas públicas, así que esta ruta es la única forma de
// escribir ahí.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const nombre = formData.get("nombre") as string | null;
    const correo = formData.get("correo") as string | null;
    const telefono = formData.get("telefono") as string | null;
    const negocioNombre = formData.get("negocioNombre") as string | null;
    const tipoNegocio = formData.get("tipoNegocio") as string | null;
    const plan = formData.get("plan") as string | null;
    const periodo = (formData.get("periodo") as string | null) || "mensual";
    const comprobante = formData.get("comprobante") as File | null;

    if (
      !nombre?.trim() ||
      !correo?.trim() ||
      !telefono?.trim() ||
      !negocioNombre?.trim() ||
      !tipoNegocio ||
      !plan ||
      !comprobante
    ) {
      return NextResponse.json(
        { error: "Faltan datos o el comprobante de pago" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdmin();

    const ext = comprobante.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = await comprobante.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from("comprobantes")
      .upload(path, buffer, { contentType: comprobante.type, upsert: false });

    if (uploadError) {
      console.error("Error subiendo comprobante:", uploadError);
      return NextResponse.json({ error: "Error al subir el comprobante" }, { status: 500 });
    }

    const { error: insertError } = await supabaseAdmin.from("solicitudes_suscripcion").insert({
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase(),
      telefono: telefono.trim(),
      negocio_nombre: negocioNombre.trim(),
      tipo_negocio: tipoNegocio,
      plan,
      periodo,
      comprobante_path: path,
    });

    if (insertError) {
      console.error("Error creando solicitud:", insertError);
      return NextResponse.json({ error: "Error al crear la solicitud" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error en POST /api/suscripciones/solicitar:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
