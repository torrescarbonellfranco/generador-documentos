"use client";

import React from "react";
import {
  FileSignature,
  Scale,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Layers,
  Wrench,
} from "lucide-react";

interface PantallaInicioProps {
  onSelectModuloAdenda: () => void;
  onSelectModuloNorma: () => void;
}

export default function PantallaInicioModulos({
  onSelectModuloAdenda,
  onSelectModuloNorma,
}: PantallaInicioProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner de Bienvenida */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#0038A8] border border-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-[#00B4D8]" />
          Portal de Instrumentos de Contratación
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1938] tracking-tight">
          ¿Qué proyecto administrativo deseás redactar?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Seleccioná el instrumento correspondiente para iniciar la generación automatizada con las plantillas oficiales de la Municipalidad de Neuquén.
        </p>
      </div>

      {/* Grid de las 2 tarjetas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
        {/* Tarjeta A: Generar Proyecto de Adenda (ACTIVA) */}
        <div
          onClick={onSelectModuloAdenda}
          className="group relative bg-white rounded-3xl border-2 border-slate-200/90 hover:border-[#0038A8] p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-blue-900/10 transition-all cursor-pointer transform hover:-translate-y-1"
        >
          {/* Badge superior */}
          <div className="flex items-center justify-between mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-[#0038A8] text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
              <FileSignature className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Módulo Disponible
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-[#0B1938] group-hover:text-[#0038A8] transition-colors mb-2.5">
              Generar Proyecto de Adenda
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Redacción automatizada de proyectos de adenda según tipo de alteración y modalidad administrativa.
            </p>

            {/* Lista de características */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>5 Tipos de alteración de plazo y volumen (aumentos y disminuciones).</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Modalidades de Aprobación Previa y Convalidación Posterior.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cálculos en tiempo real de nuevo monto, incidencia (%) y póliza del 5%.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Descarga directa en formato Word (.docx) listo para firmar.</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0038A8] group-hover:underline">
              Iniciar Asistente de Adendas
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0038A8] flex items-center justify-center group-hover:bg-[#0038A8] group-hover:text-white transition-all shadow-xs">
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Tarjeta B: Generar Proyecto de Norma Legal (EN DESARROLLO) */}
        {/* Tarjeta B: Generar Proyecto de Norma Legal (ACTIVA) */}
        <div
          onClick={onSelectModuloNorma}
          className="group relative bg-white rounded-3xl border-2 border-slate-200/90 hover:border-[#0096C7] p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-cyan-900/10 transition-all cursor-pointer transform hover:-translate-y-1"
        >
          {/* Badge superior */}
          <div className="flex items-center justify-between mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0096C7] to-[#0038A8] text-white flex items-center justify-center shadow-md shadow-cyan-600/20 group-hover:scale-105 transition-transform">
              <Scale className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              Módulo Disponible
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-[#0B1938] group-hover:text-[#0096C7] transition-colors mb-2.5">
              Generar Proyecto de Norma Legal
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Redacción automática de Proyectos de Decreto y Resolución con motor de reglas de competencia según modalidad y alteración.
            </p>

            {/* Lista de características oficiales */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Determinación automática de competencia (Decreto del Ejecutivo vs. Resolución de Secretaría).</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Modalidades de Aprobación y Convalidación con plantillas oficiales .docx.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Inyección completa de montos, plazos, cuadro comparativo y considerandos previos.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Descarga directa del proyecto limpio listo para tramitación y firma.</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0096C7] group-hover:underline">
              Iniciar Asistente de Normas Legales
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#0096C7] flex items-center justify-center group-hover:bg-[#0096C7] group-hover:text-white transition-all shadow-xs">
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
