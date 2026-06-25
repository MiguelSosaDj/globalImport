import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  console.log("WEBHOOK RECIBIDO");

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Falta stripe-signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error("Error verificando webhook:", error.message);
    return NextResponse.json({ error: "Webhook inválido" }, { status: 400 });
  }

  // ── Pago de cita individual ──────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const citaId = session.metadata?.citaId;

    console.log("Checkout completado");
    console.log("Cita ID:", citaId);
    console.log("Session ID:", session.id);

    // Solo actualizar cita si el checkout tenía citaId en metadata
    // (los checkouts de suscripción no lo tendrán)
    if (citaId) {
      const { error } = await supabaseAdmin
        .from("citas")
        .update({
          estado_pago: "pagado",
          estado_cita: "confirmada",
          stripe_session_id: session.id,
        })
        .eq("id", citaId);

      if (error) {
        console.error("Error actualizando cita:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("Cita actualizada como pagada");
    }
  }

  // ── Suscripción creada o actualizada ────────────────────────────────────
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const plan = subscription.metadata?.plan || "basico";
    const status =
      subscription.status === "active" || subscription.status === "trialing"
        ? "activo"
        : "inactivo";

    const { error } = await supabaseAdmin
      .from("negocios")
      .update({
        plan,
        subscription_status: status,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        subscription_start: new Date(
          subscription.current_period_start * 1000
        ).toISOString(),
        subscription_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
      })
      .eq("stripe_customer_id", subscription.customer as string);

    if (error) {
      console.error("Error actualizando suscripción en negocios:", error);
    } else {
      console.log(`Suscripción ${event.type} procesada — plan: ${plan}, status: ${status}`);
    }
  }

  // ── Suscripción cancelada ────────────────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    const { error } = await supabaseAdmin
      .from("negocios")
      .update({ plan: "gratuito", subscription_status: "inactivo" })
      .eq("stripe_subscription_id", subscription.id);

    if (error) {
      console.error("Error bajando plan a gratuito:", error);
    } else {
      console.log("Suscripción cancelada — negocio bajado a plan gratuito");
    }
  }

  return NextResponse.json({ received: true });
}