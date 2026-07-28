import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "./components/ui/Toast";
import { ConfirmDialogContainer } from "./components/ui/ConfirmDialog";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CitasYa — Agenda tus citas sin complicaciones",
  description:
    "La herramienta de agendamiento para barberías, clínicas y negocios en Colombia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ToastContainer />
        <ConfirmDialogContainer />
      </body>
    </html>
  );
}
