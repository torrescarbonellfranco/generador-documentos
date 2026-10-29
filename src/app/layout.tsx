import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SIGAC | Sistema Integral de Gestión de Alteraciones Contractuales | Municipalidad de Neuquén",
  description:
    "Subsecretaría de Gestión de Contrataciones de Obras Públicas - Sistema Integral de Gestión de Alteraciones Contractuales (SIGAC) - Municipalidad de Neuquén.",
};

// Desactiva la validación estricta de instant navigation de Turbopack para evitar advertencias de hidratación
export const instant = false;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
