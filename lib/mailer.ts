import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

export function getMailTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error(
      "Faltan variables SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS"
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export async function enviarCorreo(opciones: {
  to: string;
  subject: string;
  html: string;
}) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const t = getMailTransporter();

  await t.verify();

  const info = await t.sendMail({
    from,
    to: opciones.to,
    subject: opciones.subject,
    html: opciones.html,
  });

  console.log("Correo enviado:", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  });

  return info;
}