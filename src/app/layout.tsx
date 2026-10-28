import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Generador de Proyectos | Municipalidad de Neuquén",
  description:
    "Subsecretaría de Gestión de Contrataciones de Obras Públicas - Sistema oficial de redacción y emisión de proyectos de Adenda y Normas Legales en formato Word (.docx).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
