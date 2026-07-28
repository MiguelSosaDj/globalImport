import nodemailer from "nodemailer";

// Credenciales SMTP para el envío automático de recordatorios por correo.
// No hay un proveedor de email contratado todavía en este proyecto — el
// dueño de CitasYa debe configurar estas variables (por ejemplo con un SMTP
// de Gmail, Resend, SendGrid o Mailgun) para que el cron de recordatorios
// realmente pueda enviar correos.
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

export function getMailTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error(
      "Faltan variables SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS para enviar correos"
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  return transporter;
}

export async function enviarCorreo(opciones: { to: string; subject: string; html: string }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const t = getMailTransporter();
  await t.sendMail({ from, to: opciones.to, subject: opciones.subject, html: opciones.html });
}
