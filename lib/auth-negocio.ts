import { NextResponse } from "next/server";
import { getServerUser } from "./supabase-server";
import { createSupabaseAdmin } from "./supabase-admin";

interface NegocioRow {
  id: string;
  user_id: string;
  [key: string]: unknown;
}

interface CitaRow {
  id: string;
  negocio_id: string;
  [key: string]: unknown;
}

interface ServicioRow {
  id: string;
  negocio_id: string;
  [key: string]: unknown;
}

interface ProfesionalRow {
  id: string;
  negocio_id: string;
  [key: string]: unknown;
}

interface PacienteRow {
  id: string;
  negocio_id: string;
  [key: string]: unknown;
}

interface PaqueteRow {
  id: string;
  negocio_id: string;
  [key: string]: unknown;
}

type OwnNegocioResult =
  | { error: NextResponse; user?: undefined; negocio?: undefined }
  | { error?: undefined; user: NonNullable<Awaited<ReturnType<typeof getServerUser>>>; negocio: NegocioRow };

type OwnCitaResult =
  | { error: NextResponse; user?: undefined; cita?: undefined }
  | { error?: undefined; user: NonNullable<Awaited<ReturnType<typeof getServerUser>>>; cita: CitaRow };

type OwnServicioResult =
  | { error: NextResponse; user?: undefined; servicio?: undefined }
  | { error?: undefined; user: NonNullable<Awaited<ReturnType<typeof getServerUser>>>; servicio: ServicioRow };

type OwnProfesionalResult =
  | { error: NextResponse; user?: undefined; profesional?: undefined }
  | { error?: undefined; user: NonNullable<Awaited<ReturnType<typeof getServerUser>>>; profesional: ProfesionalRow };

type OwnPacienteResult =
  | { error: NextResponse; user?: undefined; paciente?: undefined }
  | { error?: undefined; user: NonNullable<Awaited<ReturnType<typeof getServerUser>>>; paciente: PacienteRow };

type OwnPaqueteResult =
  | { error: NextResponse; user?: undefined; paquete?: undefined }
  | { error?: undefined; user: NonNullable<Awaited<ReturnType<typeof getServerUser>>>; paquete: PaqueteRow };

// Verifica que el usuario autenticado sea dueño del negocio con este id.
export async function requireOwnNegocio(negocioId: string | null): Promise<OwnNegocioResult> {
  if (!negocioId) {
    return { error: NextResponse.json({ error: "Falta negocioId" }, { status: 400 }) };
  }

  const user = await getServerUser();
  if (!user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  const supabaseAdmin = createSupabaseAdmin();
  const { data: negocio, error } = await supabaseAdmin
    .from("negocios")
    .select("*")
    .eq("id", negocioId)
    .single();

  if (error || !negocio) {
    return { error: NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 }) };
  }

  if (negocio.user_id !== user.id) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }

  return { user, negocio };
}

// Verifica que la cita pertenezca a un negocio del usuario autenticado.
export async function requireOwnCita(citaId: string | null): Promise<OwnCitaResult> {
  if (!citaId) {
    return { error: NextResponse.json({ error: "Falta citaId" }, { status: 400 }) };
  }

  const user = await getServerUser();
  if (!user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  const supabaseAdmin = createSupabaseAdmin();
  const { data: cita, error } = await supabaseAdmin
    .from("citas")
    .select("*")
    .eq("id", citaId)
    .single();

  if (error || !cita) {
    return { error: NextResponse.json({ error: "Cita no encontrada" }, { status: 404 }) };
  }

  const { data: negocio, error: negocioError } = await supabaseAdmin
    .from("negocios")
    .select("id, user_id")
    .eq("id", cita.negocio_id)
    .single();

  if (negocioError || !negocio || negocio.user_id !== user.id) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }

  return { user, cita };
}

// Verifica que el servicio pertenezca a un negocio del usuario autenticado.
export async function requireOwnServicio(servicioId: string | null): Promise<OwnServicioResult> {
  if (!servicioId) {
    return { error: NextResponse.json({ error: "Falta servicioId" }, { status: 400 }) };
  }

  const user = await getServerUser();
  if (!user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  const supabaseAdmin = createSupabaseAdmin();
  const { data: servicio, error } = await supabaseAdmin
    .from("servicios")
    .select("*")
    .eq("id", servicioId)
    .single();

  if (error || !servicio) {
    return { error: NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 }) };
  }

  const { data: negocio, error: negocioError } = await supabaseAdmin
    .from("negocios")
    .select("id, user_id")
    .eq("id", servicio.negocio_id)
    .single();

  if (negocioError || !negocio || negocio.user_id !== user.id) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }

  return { user, servicio };
}

// Verifica que el profesional pertenezca a un negocio del usuario autenticado.
export async function requireOwnProfesional(profesionalId: string | null): Promise<OwnProfesionalResult> {
  if (!profesionalId) {
    return { error: NextResponse.json({ error: "Falta profesionalId" }, { status: 400 }) };
  }

  const user = await getServerUser();
  if (!user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  const supabaseAdmin = createSupabaseAdmin();
  const { data: profesional, error } = await supabaseAdmin
    .from("profesionales")
    .select("*")
    .eq("id", profesionalId)
    .single();

  if (error || !profesional) {
    return { error: NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 }) };
  }

  const { data: negocio, error: negocioError } = await supabaseAdmin
    .from("negocios")
    .select("id, user_id")
    .eq("id", profesional.negocio_id)
    .single();

  if (negocioError || !negocio || negocio.user_id !== user.id) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }

  return { user, profesional };
}

// Verifica que el paciente pertenezca a un negocio del usuario autenticado.
export async function requireOwnPaciente(pacienteId: string | null): Promise<OwnPacienteResult> {
  if (!pacienteId) {
    return { error: NextResponse.json({ error: "Falta pacienteId" }, { status: 400 }) };
  }

  const user = await getServerUser();
  if (!user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  const supabaseAdmin = createSupabaseAdmin();
  const { data: paciente, error } = await supabaseAdmin
    .from("pacientes")
    .select("*")
    .eq("id", pacienteId)
    .single();

  if (error || !paciente) {
    return { error: NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 }) };
  }

  const { data: negocio, error: negocioError } = await supabaseAdmin
    .from("negocios")
    .select("id, user_id")
    .eq("id", paciente.negocio_id)
    .single();

  if (negocioError || !negocio || negocio.user_id !== user.id) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }

  return { user, paciente };
}

// Verifica que el paquete pertenezca a un negocio del usuario autenticado.
export async function requireOwnPaquete(paqueteId: string | null): Promise<OwnPaqueteResult> {
  if (!paqueteId) {
    return { error: NextResponse.json({ error: "Falta paqueteId" }, { status: 400 }) };
  }

  const user = await getServerUser();
  if (!user) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }

  const supabaseAdmin = createSupabaseAdmin();
  const { data: paquete, error } = await supabaseAdmin
    .from("paquetes")
    .select("*")
    .eq("id", paqueteId)
    .single();

  if (error || !paquete) {
    return { error: NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 }) };
  }

  const { data: negocio, error: negocioError } = await supabaseAdmin
    .from("negocios")
    .select("id, user_id")
    .eq("id", paquete.negocio_id)
    .single();

  if (negocioError || !negocio || negocio.user_id !== user.id) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }

  return { user, paquete };
}
