import { redirect } from "next/navigation";

// El registro público está deshabilitado: las cuentas se crean solo por el
// administrador (tras aprobar un pago por Stripe o un comprobante de Nequi).
export default function RegistroPage() {
  redirect("/login");
}
