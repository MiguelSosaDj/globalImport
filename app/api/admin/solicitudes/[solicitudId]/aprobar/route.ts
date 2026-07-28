import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-admin";

const PASSWORD_GENERICA = "1234567";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ solicitudId: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { solicitudId } = await params;

    const supabaseAdmin = createSupabaseAdmin();
    const { data: solicitud, error: solicitudError } = await supabaseAdmin
      .from("solicitudes_suscripcion")
      .select("*")
      .eq("id", solicitudId)
      .single();

    if (solicitudError || !solicitud) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    if (solicitud.estado !== "pendiente") {
      return NextResponse.json(
        { error: "Esta solicitud ya fue procesada" },
        { status: 400 }
      );
    }

    // 1) Crear la cuenta del negocio con contraseña genérica.
    const { data: nuevoUsuario, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: solicitud.correo,
      password: PASSWORD_GENERICA,
      email_confirm: true,
    });

    if (authError || !nuevoUsuario.user) {
      console.error("Error creando usuario:", authError);
      return NextResponse.json(
        {
          error:
            authError?.message?.includes("already") || authError?.code === "email_exists"
              ? "Ya existe una cuenta con ese correo"
              : authError?.message || "Error al crear la cuenta",
        },
        { status: 400 }
      );
    }

    // 2) Crear el negocio asociado, ya con el plan pagado activo.
    const { error: negocioError } = await supabaseAdmin.from("negocios").insert({
      nombre: solicitud.negocio_nombre,
      tipo: solicitud.tipo_negocio,
      user_id: nuevoUsuario.user.id,
      plan: solicitud.plan,
      subscription_status: "activo",
    });

    if (negocioError) {
      console.error("Error creando negocio:", negocioError);
      return NextResponse.json(
        { error: "Cuenta creada pero hubo un error creando el negocio: " + negocioError.message },
        { status: 500 }
      );
    }

    // 3) Marcar la solicitud como aprobada.
    await supabaseAdmin
      .from("solicitudes_suscripcion")
      .update({ estado: "aprobada", procesada_at: new Date().toISOString() })
      .eq("id", solicitudId);

    return NextResponse.json({
      nombre: solicitud.nombre,
      correo: solicitud.correo,
      telefono: solicitud.telefono,
      password: PASSWORD_GENERICA,
    });
  } catch (error: any) {
    console.error("Error en POST .../aprobar:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
