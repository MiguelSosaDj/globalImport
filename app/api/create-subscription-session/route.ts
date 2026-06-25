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
    const { priceId, plan, periodo, nombre, email } = await req.json();

    if (!priceId || !email) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (priceId y email)" },
        { status: 400 }
      );
    }

    // Buscar o crear customer en Stripe por email
    let customerId: string;

    const existingCustomers = await stripe.customers.list({ email, limit: 1 });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        name: nombre ?? undefined,
        metadata: { plan },
      });
      customerId = customer.id;
    }

    // Si hay sesión de Supabase activa, vincular el customer al negocio
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (token) {
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        await supabaseAdmin
          .from("negocios")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", user.id)
          .is("stripe_customer_id", null);
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_update: { name: "auto" },
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?suscripcion=exitosa`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/precios`,
      metadata: { plan, periodo },
      subscription_data: {
        trial_period_days: 7,
        metadata: { plan, periodo },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creando sesión de suscripción:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}