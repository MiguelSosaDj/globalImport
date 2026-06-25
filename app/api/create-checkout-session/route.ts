import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const {
      negocioId,
      clienteNombre,
      clienteTelefono,
      servicio,
      fecha,
      hora,
      monto,
    } = await req.json();

    if (
      !negocioId ||
      !clienteNombre ||
      !clienteTelefono ||
      !servicio ||
      !fecha ||
      !hora
    ) {
      return NextResponse.json(
        { error: "Faltan datos para crear la cita" },
        { status: 400 }
      );
    }

    if (!monto || Number(monto) <= 0) {
      return NextResponse.json(
        { error: "Monto inválido" },
        { status: 400 }
      );
    }

    console.log("Creando cita pendiente...");

    const { data: cita, error: citaError } = await supabaseAdmin
      .from("citas")
      .insert({
        negocio_id: negocioId,
        cliente_nombre: clienteNombre,
        cliente_telefono: clienteTelefono,
        servicio,
        fecha,
        hora,
        monto: Number(monto),
        estado_pago: "pendiente",
        estado_cita: "pendiente",
      })
      .select("id")
      .single();

    if (citaError) {
      console.error("Error creando cita pendiente:", citaError);

      return NextResponse.json(
        { error: citaError.message },
        { status: 500 }
      );
    }

    console.log("Cita pendiente creada:", cita.id);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${servicio} - ${clienteNombre}`,
              description: `Cita para ${servicio} el ${fecha} a las ${hora}`,
            },
            unit_amount: Math.round(Number(monto) * 100),
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel?cita_id=${cita.id}`,

      metadata: {
        citaId: cita.id,
        negocioId,
        clienteNombre,
        clienteTelefono,
        servicio,
        fecha,
        hora,
        monto: String(monto),
      },
    });

    const { error: updateError } = await supabaseAdmin
      .from("citas")
      .update({
        stripe_session_id: session.id,
      })
      .eq("id", cita.id);

    if (updateError) {
      console.error("Error guardando stripe_session_id:", updateError);
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);

    return NextResponse.json(
      { error: error.message || "Error al crear la sesión de pago" },
      { status: 500 }
    );
  }
}