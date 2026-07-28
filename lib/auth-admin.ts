import { NextResponse } from "next/server";
import { getServerUser } from "./supabase-server";

// Email del administrador de la plataforma (no de un negocio individual).
// Se puede sobreescribir con la variable de entorno ADMIN_EMAIL.
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "lmsg829@gmail.com";

type RequireAdminResult =
  | { error: NextResponse; user?: undefined }
  | { error?: undefined; user: NonNullable<Awaited<ReturnType<typeof getServerUser>>> };

export async function requireAdmin(): Promise<RequireAdminResult> {
  const user = await getServerUser();

  if (!user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  if (user.email !== ADMIN_EMAIL) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }

  return { user };
}
