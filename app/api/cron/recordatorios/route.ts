import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { enviarCorreo } from "@/lib/mailer";

// Cron diario (ver vercel.json) que manda el recordatorio de 1 día antes por
// correo, para las citas confirmadas de mañana que tengan cliente_correo
// capturado. Protegida con CRON_SECRET — Vercel Cron manda ese secreto en el
// header Authorization automáticamente si está configurado como env var;
// cualquier otro llamado sin el secreto correcto se rechaza.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  try {
    const supabaseAdmin = createSupabaseAdmin();

    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const mananaStr = manana.toISOString().slice(0, 10);

    const { data: citas, error } = await supabaseAdmin
      .from("citas")
      .select("id, cliente_nombre, cliente_correo, servicio, fecha, hora, negocio_id, negocios(nombre)")
      .eq("estado_cita", "confirmada")
      .eq("fecha", mananaStr)
.or(
  "recordatorio_email_enviado.eq.false,recordatorio_email_enviado.is.null"
)      .not("cliente_correo", "is", null);

    if (error) {
      console.error("Error consultando citas para recordatorio:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let enviados = 0;
    let fallidos = 0;

    for (const cita of citas || []) {
      const negocioNombre = (cita as any).negocios?.[0]?.nombre || "tu negocio";

      try {
        await enviarCorreo({
          to: cita.cliente_correo as string,
          subject: `Recordatorio: tu cita mañana en ${negocioNombre}`,
          html: `
            <p>Hola ${cita.cliente_nombre},</p>
            <p>Te recordamos tu cita <strong>mañana ${cita.fecha}</strong> a las <strong>${cita.hora}</strong>
            para <strong>${cita.servicio}</strong> en <strong>${negocioNombre}</strong>.</p>
            <p>¡Te esperamos! Si necesitas cambiar algo, contacta directamente al negocio.</p>
          `,
        });

        await supabaseAdmin
          .from("citas")
          .update({ recordatorio_email_enviado: true })
          .eq("id", cita.id);

        enviados++;
      } catch (mailError) {
        console.error(`Error enviando recordatorio a cita ${cita.id}:`, mailError);
        fallidos++;
      }
    }

    return NextResponse.json({ total: citas?.length || 0, enviados, fallidos });
  } catch (error: any) {
    console.error("Error en /api/cron/recordatorios:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
