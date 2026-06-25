import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("Falta STRIPE_SECRET_KEY");
  }

  return new Stripe(stripeSecretKey);
}

function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(req: NextRequest) {
  try {
    const stripe = createStripe();
    const supabaseAdmin = createSupabaseAdmin();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      throw new Error("Falta NEXT_PUBLIC_APP_URL");
    }

    const { priceId, plan, periodo, nombre, email } = await req.json();

    if (!priceId || !email) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (priceId y email)" },
        { status: 400 }
      );
    }

    // Buscar o crear customer en Stripe por email
    let customerId: string;

    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        name: nombre ?? undefined,
        metadata: {
          plan: plan ?? "",
          periodo: periodo ?? "",
        },
      });

      customerId = customer.id;
    }

    // Si hay sesión de Supabase activa, vincular el customer al negocio
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (token) {
      const {
        data: { user },
        error: userError,
      } = await supabaseAdmin.auth.getUser(token);

      if (userError) {
        console.error("Error obteniendo usuario desde token:", userError);
      }

      if (user) {
        const { error: negocioError } = await supabaseAdmin
          .from("negocios")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", user.id)
          .is("stripe_customer_id", null);

        if (negocioError) {
          console.error("Error vinculando stripe_customer_id:", negocioError);
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_update: { name: "auto" },
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],

      success_url: `${appUrl}/dashboard?suscripcion=exitosa`,
      cancel_url: `${appUrl}/precios`,

      metadata: {
        plan: plan ?? "",
        periodo: periodo ?? "",
      },

      subscription_data: {
        trial_period_days: 7,
        metadata: {
          plan: plan ?? "",
          periodo: periodo ?? "",
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creando sesión de suscripción:", error);

    return NextResponse.json(
      { error: error.message || "Error al crear la sesión de suscripción" },
      { status: 500 }
    );
  }
}