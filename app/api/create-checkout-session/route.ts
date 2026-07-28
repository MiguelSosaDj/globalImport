import { NextRequest, NextResponse } from "next/server";
import { createStripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

// Fix interino (Fase 1) hasta que exista la tabla `servicios` (Fase 2):
// el precio real vive aquí, en el servidor, nunca se confía en el monto
// que manda el cliente. Debe mantenerse en sync con PRECIOS_POR_SERVICIO
// de app/agendar/[negocioId]/AgendarForm.tsx hasta la migración a BD.
const PRECIOS_POR_SERVICIO: Record<string, number> = {
  "Corte de cabello": 15,
  "Barba": 10,
  "Corte + barba": 22,
  "Tinte": 30,
  "Consulta general": 50,
  "Control": 40,
  "Examen": 60,
  "Urgencia": 80,
  "Cambio de aceite": 35,
  "Frenos": 45,
  "Suspension": 55,
  "Diagnostico": 75,
  "Masaje relajante": 45,
  "Masaje deportivo": 50,
  "Reflexologia": 40,
  "Sesión de fisioterapia": 60,
  "Masaje terapéutico": 55,
  "Evaluación inicial": 50,
};

// Suma `dias` a una fecha "YYYY-MM-DD" sin problemas de zona horaria.
function addDays(fechaStr: string, dias: number) {
  const [y, m, d] = fechaStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + dias);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export async function POST(req: NextRequest) {
  try {
    const stripe = createStripe();
    const supabaseAdmin = createSupabaseAdmin();

    const {
      negocioId,
      clienteNombre,
      clienteTelefono,
      servicio,
      fecha,
      hora,
      profesionalId,
      paqueteId,
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

    // Precio autoritativo: si el cliente eligió un paquete, se valida ese
    // paquete (debe pertenecer a este negocio y estar activo). El cliente
    // paga el precio COMPLETO del paquete en un solo cobro, pero cada
    // sesión individual queda registrada con el precio del paquete
    // dividido entre el número de sesiones (para que los reportes de
    // ingresos no cuenten el mismo pago varias veces).
    // Si no eligió paquete, se busca el servicio en el catálogo real del
    // negocio (tabla `servicios`); si el negocio todavía no tiene su propio
    // catálogo cargado, cae al catálogo genérico hardcodeado. Nunca se
    // confía en un monto enviado por el cliente.
    let montoTotal: number | null = null;
    let numeroSesiones = 1;

    if (paqueteId) {
      const { data: paqueteDb } = await supabaseAdmin
        .from("paquetes")
        .select("precio, numero_sesiones")
        .eq("id", paqueteId)
        .eq("negocio_id", negocioId)
        .eq("activo", true)
        .maybeSingle();

      if (!paqueteDb) {
        return NextResponse.json({ error: "Paquete no válido" }, { status: 400 });
      }
      montoTotal = paqueteDb.precio;
      numeroSesiones = paqueteDb.numero_sesiones;
    } else {
      const { data: servicioDb } = await supabaseAdmin
        .from("servicios")
        .select("precio")
        .eq("negocio_id", negocioId)
        .eq("nombre", servicio)
        .eq("activo", true)
        .maybeSingle();

      montoTotal = servicioDb ? servicioDb.precio : PRECIOS_POR_SERVICIO[servicio];
    }

    if (!montoTotal || montoTotal <= 0) {
      return NextResponse.json(
        { error: "Servicio no reconocido" },
        { status: 400 }
      );
    }

    const montoPorSesion = Math.round(montoTotal / numeroSesiones);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      throw new Error("Falta NEXT_PUBLIC_APP_URL");
    }

    // Si es un paquete, la fecha elegida es la primera sesión — las demás
    // se agendan automáticamente el mismo día de la semana, una vez por
    // semana, hasta completar todas las sesiones del paquete.
    const fechas = Array.from({ length: numeroSesiones }, (_, i) => addDays(fecha, i * 7));

    console.log(`Creando ${fechas.length} cita(s) pendiente(s)...`);

    const { data: citasCreadas, error: citaError } = await supabaseAdmin
      .from("citas")
      .insert(
        fechas.map((f) => ({
          negocio_id: negocioId,
          cliente_nombre: clienteNombre,
          cliente_telefono: clienteTelefono,
          servicio,
          fecha: f,
          hora,
          monto: montoPorSesion,
          profesional_id: profesionalId || null,
          paquete_id: paqueteId || null,
          estado_pago: "pendiente",
          estado_cita: "pendiente",
        }))
      )
      .select("id");

    if (citaError || !citasCreadas || citasCreadas.length === 0) {
      if (citaError?.code === "23505") {
        return NextResponse.json(
          {
            error:
              fechas.length > 1
                ? "Uno de los días de tus sesiones ya está reservado. Elige otra fecha de inicio."
                : "Ese horario ya fue reservado. Elige otro.",
          },
          { status: 409 }
        );
      }

      console.error("Error creando cita(s) pendiente(s):", citaError);

      return NextResponse.json(
        { error: citaError?.message || "Error al crear la cita" },
        { status: 500 }
      );
    }

    console.log(`${citasCreadas.length} cita(s) pendiente(s) creada(s)`);

    const primeraCita = citasCreadas[0];
    const citaIds = citasCreadas.map((c) => c.id);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "cop",
            product_data: {
              name: `${servicio} - ${clienteNombre}`,
              description:
                fechas.length > 1
                  ? `${numeroSesiones} sesiones de ${servicio}, empezando el ${fecha} a las ${hora}`
                  : `Cita para ${servicio} el ${fecha} a las ${hora}`,
            },
            unit_amount: Math.round(montoTotal * 100),
          },
          quantity: 1,
        },
      ],

      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel?cita_id=${primeraCita.id}`,

      metadata: {
        citaId: primeraCita.id,
        citaIds: citaIds.join(","),
        negocioId,
        clienteNombre,
        clienteTelefono,
        servicio,
        fecha,
        hora,
        monto: String(montoTotal),
      },
    });

    const { error: updateError } = await supabaseAdmin
      .from("citas")
      .update({
        stripe_session_id: session.id,
      })
      .eq("id", primeraCita.id);

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
