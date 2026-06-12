import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
    <html lang="es" className={`${geistSans.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-[#0A0A0F] text-white">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
