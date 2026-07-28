import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createStripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  console.log("WEBHOOK RECIBIDO");

  try {
    const stripe = createStripe();
    const supabaseAdmin = createSupabaseAdmin();

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("Falta STRIPE_WEBHOOK_SECRET");
    }

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
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error: any) {
      console.error("Error verificando webhook:", error.message);

      return NextResponse.json(
        { error: "Webhook inválido" },
        { status: 400 }
      );
    }

    // ── Idempotencia ──────────────────────────────────────────────────────────
    // Stripe puede reenviar el mismo evento (reintentos por timeout, etc).
    // Insertamos el event.id antes de procesar; si ya existe (conflicto de
    // primary key), es un reintento y no se vuelve a aplicar el efecto.
    const { error: dedupeError } = await supabaseAdmin
      .from("stripe_webhook_events")
      .insert({ event_id: event.id, event_type: event.type });

    if (dedupeError) {
      if (dedupeError.code === "23505") {
        console.log("Evento duplicado, ya procesado:", event.id);
        return NextResponse.json({ received: true, duplicate: true });
      }

      console.error("Error registrando evento de webhook:", dedupeError);
      // Si la tabla de idempotencia falla por un motivo distinto a duplicado
      // (p.ej. la migración 0001 no se ha aplicado todavía), seguimos
      // procesando para no romper pagos reales — se corrige apenas se aplique
      // la migración.
    }

    // ── Pago de cita individual (o de todas las sesiones de un paquete) ─────
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const citaId = session.metadata?.citaId;
      // Si el cliente compró un paquete de varias sesiones, citaIds trae
      // todas las citas creadas para ese paquete (separadas por coma) — el
      // pago fue uno solo, pero hay que confirmar todas las sesiones.
      const citaIds = session.metadata?.citaIds
        ? session.metadata.citaIds.split(",").filter(Boolean)
        : citaId
        ? [citaId]
        : [];

      console.log("Checkout completado");
      console.log("Cita IDs:", citaIds);
      console.log("Session ID:", session.id);

      // Solo actualizar citas si el checkout tenía citaId(s) en metadata.
      // Los checkouts de suscripción no lo tendrán.
      if (citaIds.length > 0) {
        // stripe_session_id es único en la tabla — solo la primera cita del
        // grupo lo guarda, el resto solo se marca pagada/confirmada.
        const [primeraCitaId, ...restoCitaIds] = citaIds;

        const { error } = await supabaseAdmin
          .from("citas")
          .update({
            estado_pago: "pagado",
            estado_cita: "confirmada",
            stripe_session_id: session.id,
          })
          .eq("id", primeraCitaId);

        if (error) {
          console.error("Error actualizando cita:", error);

          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          );
        }

        if (restoCitaIds.length > 0) {
          const { error: errorResto } = await supabaseAdmin
            .from("citas")
            .update({
              estado_pago: "pagado",
              estado_cita: "confirmada",
            })
            .in("id", restoCitaIds);

          if (errorResto) {
            console.error("Error actualizando el resto de las sesiones:", errorResto);
          }
        }

        console.log(`${citaIds.length} cita(s) actualizada(s) como pagada(s)`);
      }
    }

    // ── Suscripción creada o actualizada ────────────────────────────────────
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const subscription = event.data.object as Stripe.Subscription;

      const subscriptionItem = subscription.items.data[0];

      const subscriptionStart = subscriptionItem?.current_period_start
        ? new Date(subscriptionItem.current_period_start * 1000).toISOString()
        : null;

      const subscriptionEnd = subscriptionItem?.current_period_end
        ? new Date(subscriptionItem.current_period_end * 1000).toISOString()
        : null;

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
          subscription_start: subscriptionStart,
          subscription_end: subscriptionEnd,
        })
        .eq("stripe_customer_id", subscription.customer as string);

      if (error) {
        console.error("Error actualizando suscripción en negocios:", error);
      } else {
        console.log(
          `Suscripción ${event.type} procesada — plan: ${plan}, status: ${status}`
        );
      }
    }

    // ── Suscripción cancelada ────────────────────────────────────────────────
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      const { error } = await supabaseAdmin
        .from("negocios")
        .update({
          plan: "gratuito",
          subscription_status: "inactivo",
        })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        console.error("Error bajando plan a gratuito:", error);
      } else {
        console.log("Suscripción cancelada — negocio bajado a plan gratuito");
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error general en /api/stripe-webhook:", error);

    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
