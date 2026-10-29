'use client';

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HeaderInstitucional from "@/components/HeaderInstitucional";
import AsistenteWizard from "@/components/asistente/AsistenteWizard";
import ChecklistResultados from "@/components/asistente/ChecklistResultados";
import DrawerModeloDocumento from "@/components/asistente/DrawerModeloDocumento";
import {
  DiagnosticoTramiteParams,
  ResultadoDiagnostico,
  DocumentoRequerido,
  obtenerDiagnosticoTramitacion,
} from "@/lib/tramitacionRules";
import {
  ArrowLeft,
  Sparkles,
  ClipboardCheck,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

export default function AsistenteTramitacionPage() {
  const router = useRouter();

  // Estado del diagnóstico
  const [params, setParams] = useState<DiagnosticoTramiteParams | null>(null);
  const [resultado, setResultado] = useState<ResultadoDiagnostico | null>(null);

  // Estado del Drawer lateral
  const [documentoSeleccionado, setDocumentoSeleccionado] =
    useState<DocumentoRequerido | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleDiagnosticar = (nuevosParams: DiagnosticoTramiteParams) => {
    setParams(nuevosParams);
    const res = obtenerDiagnosticoTramitacion(nuevosParams);
    setResultado(res);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReconfigurar = () => {
    setResultado(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleVerModelo = (doc: DocumentoRequerido) => {
    setDocumentoSeleccionado(doc);
    setIsDrawerOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Cabecera Institucional Oficial */}
      <HeaderInstitucional
        onGoHome={() => router.push("/")}
        showHomeButton={true}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Barra superior de navegación */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0038A8] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Panel Principal (SIGAC)
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
              <ClipboardCheck className="w-3.5 h-3.5 text-amber-600" />
              Guía Metodológica Oficial
            </span>
          </div>
        </div>

        {/* Encabezado y Contexto */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#0038A8] to-[#0096C7] text-white shadow-md shadow-blue-900/10">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1938] tracking-tight">
                Asistente de Tramitación de Alteraciones Contractuales
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Diagnóstico procedimental y checklist documental exhaustivo según el marco normativo de la Ley N° 687
              </p>
            </div>
          </div>
        </div>

        {/* Contenido Dinámico: Wizard o Checklist de Resultados */}
        {!resultado ? (
          <div className="space-y-6">
            {/* Banner de Bienvenida del Asistente */}
            <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-cyan-50/60 p-5 rounded-3xl border border-blue-200/80 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 border-2 border-[#FF7A00] p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/alty.png"
                  alt="Alty"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF7A00] block">
                  Alty te orienta en el circuito
                </span>
                <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
                  Respondé estas 3 preguntas sobre el estado de la obra y el tipo de modificación requerida. Te prepararé el listado exacto de fojas, informes y firmas obligatorias para que el expediente ingrese completo y sin demoras.
                </p>
              </div>
            </div>

            <AsistenteWizard
              onDiagnosticar={handleDiagnosticar}
              initialParams={params || undefined}
            />
          </div>
        ) : (
          <ChecklistResultados
            resultado={resultado}
            onReconfigurar={handleReconfigurar}
            onVerModelo={handleVerModelo}
          />
        )}
      </main>

      {/* Drawer lateral para visualizar modelo y recomendaciones del documento */}
      <DrawerModeloDocumento
        documento={documentoSeleccionado}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        tipoAlteracion={params?.tipoAlteracion || resultado?.tipoAlteracion}
        naturalezaContratacion={params?.naturalezaContratacion || resultado?.naturalezaContratacion || "obra"}
        tieneItemsNuevos={params?.incorporaItemsNuevos ?? resultado?.incorporaItemsNuevos ?? false}
        modalidad={params?.modalidad || resultado?.modalidad || "aprobacion"}
      />
    </div>
  );
}
