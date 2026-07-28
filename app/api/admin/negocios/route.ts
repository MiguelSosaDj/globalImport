import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-admin";

// Lista de negocios registrados para el panel de administrador de la
// plataforma — no confundir con el listado de citas de un negocio
// individual. Incluye el correo del dueño (viene de auth.users, no de la
// tabla negocios) para que el admin identifique la cuenta.
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const supabaseAdmin = createSupabaseAdmin();

    const { data: negocios, error } = await supabaseAdmin
      .from("negocios")
      .select(
        "id, nombre, tipo, plan, subscription_status, subscription_end, citas_simultaneas, limite_citas_mes, user_id, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const negociosConCorreo = await Promise.all(
      (negocios || []).map(async (n) => {
        if (!n.user_id) return { ...n, correo: null };
        const { data } = await supabaseAdmin.auth.admin.getUserById(n.user_id);
        return { ...n, correo: data.user?.email || null };
      })
    );

    return NextResponse.json({ negocios: negociosConCorreo });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
