import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-admin";

// El admin ajusta, por negocio: cuántas citas simultáneas puede tener un
// mismo horario, y (opcional) un override del límite mensual de citas que
// reemplaza el default de su plan (planes_limites). Ambos los aplica el
// trigger citas_validar_y_asignar_ordinal en cada insert — esta ruta solo
// guarda los valores, no valida disponibilidad ni nada relacionado a citas.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ negocioId: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const { negocioId } = await params;
    const body = await req.json();

    const update: Record<string, number | null> = {};

    if ("citasSimultaneas" in body) {
      const valor = Number(body.citasSimultaneas);
      if (!Number.isInteger(valor) || valor < 1) {
        return NextResponse.json(
          { error: "citasSimultaneas debe ser un entero mayor o igual a 1" },
          { status: 400 }
        );
      }
      update.citas_simultaneas = valor;
    }

    if ("limiteCitasMes" in body) {
      if (body.limiteCitasMes === null || body.limiteCitasMes === "") {
        update.limite_citas_mes = null;
      } else {
        const valor = Number(body.limiteCitasMes);
        if (!Number.isInteger(valor) || valor < 0) {
          return NextResponse.json(
            { error: "limiteCitasMes debe ser un entero mayor o igual a 0" },
            { status: 400 }
          );
        }
        update.limite_citas_mes = valor;
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("negocios")
      .update(update)
      .eq("id", negocioId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
