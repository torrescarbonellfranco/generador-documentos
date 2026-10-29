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

      {/* Grid de las 2 tarjetas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
        {/* TARJETA 1 (ACTIVA): Generación Integral de Proyectos */}
        <div
          onClick={onSelectModuloAdenda}
          className="group relative bg-white rounded-3xl border-2 border-slate-200/90 hover:border-[#0038A8] p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-blue-900/10 transition-all cursor-pointer transform hover:-translate-y-1"
        >
          {/* Badge superior */}
          <div className="flex items-center justify-between mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-[#0038A8] text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
              <FileSignature className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Área de Alteraciones Contractuales &bull; Módulo Disponible
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-[#0B1938] group-hover:text-[#0038A8] transition-colors mb-2.5">
              Generación Integral de Proyectos
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Carga unificada de datos para redactar y exportar en simultáneo todo el paquete documental oficial del expediente en un solo circuito.
            </p>

            {/* Lista de características */}
            <div className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Proyecto de Adenda Modificatoria</strong> (.docx con cálculo de montos netos y nuevos plazos).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Proyecto de Norma Legal</strong> (.docx - Decreto o Resolución según competencia automática).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Carátula de Control de Expediente</strong> en una sola hoja A4 con sello y firma (PDF oficial).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Antecedentes cronológicos</strong>, VISTO concatenado y considerandos con IA para Notas de Pedido y Órdenes de Servicio.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-[#0038A8] group-hover:underline">
              Iniciar Generación de Proyectos &rarr;
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0038A8] flex items-center justify-center group-hover:bg-[#0038A8] group-hover:text-white transition-all shadow-xs">
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* TARJETA 2 (ACTIVA): Asistente de Tramitación de Alteraciones */}
        <Link
          href="/asistente-tramitacion"
          className="group relative bg-white rounded-3xl border-2 border-slate-200/90 hover:border-[#FF7A00] p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-orange-900/10 transition-all cursor-pointer transform hover:-translate-y-1 block"
        >
          {/* Badge superior */}
          <div className="flex items-center justify-between mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-[#FF7A00] text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <ClipboardCheck className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-50 text-[#FF7A00] border border-orange-200 flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] animate-pulse" />
              Herramienta Oficial &bull; Asistente Activo
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-[#0B1938] group-hover:text-[#FF7A00] transition-colors mb-2.5">
              Asistente de Tramitación de Alteraciones
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Guía interactiva y seguimiento metodológico paso a paso para el trámite y circuito administrativo de expedientes de obra pública.
            </p>

            {/* Lista de características oficiales */}
            <div className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <CheckSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Verificación de requisitos y checklist documental</strong> según modalidad de alteración.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Control de vigencia de pólizas de caución</strong> y plazos legales (Ley 687 y decretos reglamentarios).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Diagnóstico procedimental</strong> y recomendaciones de elevación asistidas por Alty.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-[#FF7A00] group-hover:underline">
              Ingresar al Asistente &rarr;
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF7A00] flex items-center justify-center group-hover:bg-[#FF7A00] group-hover:text-white transition-all shadow-xs">
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
