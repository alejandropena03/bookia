import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Display serif — voz editorial cálida, apropiada para el mundo de la estética.
// Contrasta con Geist (UI/datos) y se usa con restricción: solo títulos y la cifra
// grande de KPI, para que el dashboard se lea como "reporte premium", no "dev tool".
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  // Fuente variable: sin weight explícito para poder pedir ejes (opsz/SOFT).
  // Los pesos se controlan por CSS (font-weight) sobre el rango variable.
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "Bookia — Convierte cada mensaje en una cita.",
  description:
    "Conecta WhatsApp, Instagram y Facebook con IA para convertir conversaciones en citas agendadas automáticamente. Sin errores, sin demoras.",
  openGraph: {
    title: "Bookia — Agenda automática con IA",
    description:
      "Convierte conversaciones de WhatsApp, Instagram y Facebook en citas agendadas automáticamente.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
