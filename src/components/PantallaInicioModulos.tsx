"use client";

import React from "react";
import Link from "next/link";
import {
  FileSignature,
  ClipboardCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  CheckSquare,
  FileSpreadsheet,
} from "lucide-react";

interface PantallaInicioProps {
  onSelectModuloAdenda: () => void;
  onSelectModuloNorma?: () => void;
}

export default function PantallaInicioModulos({
  onSelectModuloAdenda,
}: PantallaInicioProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner de Bienvenida y Contexto */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#0038A8] border border-blue-200 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#00B4D8]" />
          Área de Alteraciones Contractuales &bull; Sistema Activo
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1938] tracking-tight">
          ¿Qué gestión administrativa deseás realizar?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Seleccioná el módulo correspondiente para operar con el marco normativo oficial de la Municipalidad de Neuquén.
        </p>
      </div>

      {/* Grid de las 3 tarjetas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* TARJETA 1 (ACTIVA): Generación Integral de Proyectos */}
        <div
          onClick={onSelectModuloAdenda}
          className="group relative bg-white rounded-3xl border-2 border-slate-200/90 hover:border-[#0038A8] p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-blue-900/10 transition-all cursor-pointer transform hover:-translate-y-1"
        >
          {/* Badge superior */}
          <div className="flex items-center justify-between mb-5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600 to-[#0038A8] text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
              <FileSignature className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#0038A8] border border-blue-200 flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0038A8] animate-pulse" />
              Módulo Redacción
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#0B1938] group-hover:text-[#0038A8] transition-colors mb-2">
              Generación Integral de Proyectos
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
              Carga unificada de datos para redactar y exportar en simultáneo todo el paquete documental oficial del expediente en un solo circuito.
            </p>

            {/* Lista de características */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Proyecto de Adenda Modificatoria</strong> (.docx con montos y plazos).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Proyecto de Norma Legal</strong> (Decreto o Resolución oficial).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Carátula de Control</strong> en una hoja A4 con firma (PDF).
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-[#0038A8] group-hover:underline">
              Iniciar Generación &rarr;
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0038A8] flex items-center justify-center group-hover:bg-[#0038A8] group-hover:text-white transition-all shadow-xs">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* TARJETA 2 (ACTIVA): Asistente de Tramitación de Alteraciones */}
        <Link
          href="/asistente-tramitacion"
          className="group relative bg-white rounded-3xl border-2 border-slate-200/90 hover:border-[#FF7A00] p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-orange-900/10 transition-all cursor-pointer transform hover:-translate-y-1 block"
        >
          {/* Badge superior */}
          <div className="flex items-center justify-between mb-5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 to-[#FF7A00] text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-[#FF7A00] border border-orange-200 flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] animate-pulse" />
              Guía Metodológica
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#0B1938] group-hover:text-[#FF7A00] transition-colors mb-2">
              Asistente de Tramitación de Alteraciones
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
              Guía interactiva y seguimiento metodológico paso a paso para el trámite y circuito administrativo de expedientes de obra pública.
            </p>

            {/* Lista de características oficiales */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Checklist documental interactivo</strong> según modalidad.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Control de vigencia de pólizas</strong> y plazos legales (Ley 687).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Modelos oficiales y recomendaciones</strong> asistidas por Alty.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-[#FF7A00] group-hover:underline">
              Ingresar al Asistente &rarr;
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF7A00] flex items-center justify-center group-hover:bg-[#FF7A00] group-hover:text-white transition-all shadow-xs">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>

        {/* TARJETA 3 (NUEVA): Consulta y Rastreo de Expedientes */}
        <Link
          href="/rastreador-expedientes"
          className="group relative bg-white rounded-3xl border-2 border-slate-200/90 hover:border-emerald-600 p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-emerald-900/10 transition-all cursor-pointer transform hover:-translate-y-1 block"
        >
          {/* Badge superior */}
          <div className="flex items-center justify-between mb-5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Google Sheets en Vivo
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#0B1938] group-hover:text-emerald-700 transition-colors mb-2">
              Consulta y Rastreo de Expedientes
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
              Seguimiento en tiempo real de expedientes de obras y alteraciones clasificados por inspector y área de tramitación.
            </p>

            {/* Lista de características oficiales */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Filtro por inspector individual</strong> o visualización integral.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Área actual de permanencia</strong> y conteo de días en el sector.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Seguimiento de estados</strong>: En Trámite o Aprobados con norma.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 group-hover:underline">
              Consultar Expedientes &rarr;
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
