"use strict";

import React from "react";
import { AdendaData, calcularValoresAdenda } from "@/lib/adendaGenerator";
import { determinarTipoNorma } from "@/lib/normaRules";
import {
  formatearMoneda,
  montoALetras,
  diasALetras,
  formatearPorcentaje,
  formatearFechaCorta,
} from "@/lib/formatters";
import {
  FileDown,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  Scale,
} from "lucide-react";

interface ResumenProps {
  data: AdendaData;
  isGenerating: boolean;
  moduloActivo?: "adenda" | "norma";
  onGenerar?: () => void;
  onGenerarNorma?: () => void;
  onOpenCaratula?: () => void;
}

export default function ResumenCalculosLateral({
  data,
  isGenerating,
  moduloActivo = "adenda",
  onGenerar,
  onGenerarNorma,
  onOpenCaratula,
}: ResumenProps) {
  const calc = calcularValoresAdenda(data);
  const modalidadTipo =
    data.modalidadContratoTipo || data.modalidadContrato || "Licitación Pública";
  const competencia = determinarTipoNorma(data.tipoAlteracion, modalidadTipo);
  const plantillaNombre = `${data.tipoAlteracion.toUpperCase()}.docx`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md shadow-slate-100 p-6 sticky top-24 space-y-5">
      {/* Header Resumen */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Control de Cálculos
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles className="w-3 h-3 text-emerald-600" /> En Tiempo Real
          </span>
        </div>
        <h3 className="text-lg font-bold text-[#0B1938]">
          Resumen de la Adenda
        </h3>

        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-[#0038A8] border border-blue-200">
            {data.modalidad}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
            {data.tipoAlteracion}
          </span>
        </div>
      </div>

      <div className="space-y-4 text-sm">
        {/* Sección Monto si aplica */}
        {calc.incluyeMonto ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {calc.estadoPrevio.tieneVariacionesPrevias
                  ? "Monto Actualizado Previo:"
                  : "Monto Original de Contrato:"}
              </span>
              <span className="font-semibold text-slate-700">
                {formatearMoneda(calc.estadoPrevio.montoPrevio)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                {calc.esDisminucion ? (
                  <>
                    <TrendingDown className="w-3.5 h-3.5 text-amber-500" /> Disminución:
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Aumento:
                  </>
                )}
              </span>
              <span
                className={`font-bold text-sm ${
                  calc.esDisminucion ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {calc.esDisminucion ? "- " : "+ "}
                {formatearMoneda(Math.abs(calc.varVolPesos))}
              </span>
            </div>

            {/* Nuevo Monto Principal */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase text-slate-600">
                  Monto Post Variación:
                </span>
                <span className="text-lg font-extrabold text-[#0038A8]">
                  {formatearMoneda(calc.montoPostVariacion)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-2 leading-tight">
                {montoALetras(calc.montoPostVariacion, true)}
              </p>
            </div>

            {/* Incidencia (%) */}
            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">
                  Incidencia s/ monto previo:
                </span>
                <span
                  className={`font-bold ${
                    calc.porcentajeVar > 20
                      ? "text-amber-600"
                      : "text-[#0038A8]"
                  }`}
                >
                  {formatearPorcentaje(calc.porcentajeVar)}
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    calc.porcentajeVar > 20
                      ? "bg-amber-500"
                      : "bg-[#0038A8]"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(0, calc.porcentajeVar))}%`,
                  }}
                />
              </div>

              {calc.porcentajeVar > 20 && (
                <div className="flex items-start gap-1 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    La variación supera el 20%. Verifique contar con la intervención jurídica y técnica pertinente.
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">Monto Invariable</div>
            <p>
              El monto contractual se mantiene en{" "}
              <strong>{formatearMoneda(calc.montoOrig)}</strong> sin alteraciones económicas.
            </p>
          </div>
        )}

        {/* Sección Plazos */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {calc.estadoPrevio.tieneVariacionesPrevias
                ? "Plazo Previo:"
                : "Plazo Original:"}
            </span>
            <span className="font-semibold text-slate-700">
              {calc.estadoPrevio.plazoPrevioDias} días corridos
            </span>
          </div>

          {calc.incluyePlazo && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-xs font-medium text-[#0038A8] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Ampliación Otorgada:
              </span>
              <span className="font-bold text-sm text-[#0038A8]">
                + {calc.diasAmp} días
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold uppercase text-slate-600">
                Plazo Post Variación:
              </span>
              <span className="text-base font-extrabold text-[#0B1938]">
                {calc.plazoPostVariacion} días corridos
              </span>
            </div>
            <p className="text-[11px] text-slate-500 italic mt-0.5">
              ({diasALetras(calc.plazoPostVariacion)} DÍAS)
            </p>
          </div>

          {calc.fechaVtoNuevaCalculada && (
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Nuevo Vencimiento:</span>
              <span className="font-bold text-[#0038A8] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                {formatearFechaCorta(calc.fechaVtoNuevaCalculada)}
              </span>
            </div>
          )}
        </div>

        {/* Póliza de Garantía del 5% (Fórmula exacta Excel) */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-900 uppercase">
              Garantía Contractual (5%)
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-xs text-emerald-700">Garantía Exigible:</span>
            <span className="text-base font-extrabold text-emerald-800">
              {calc.garantia > 0 ? formatearMoneda(calc.garantia) : "$ 0,00"}
            </span>
          </div>

          <p className="text-[11px] text-emerald-600 leading-tight">
            {calc.esConvalidacion
              ? "Exenta en Convalidación (obra ya concluida/convalidada ex-post)."
              : calc.varVolPesos > 0
              ? "Calculada como 5% del Monto Post Variación por incremento contractual."
              : "No requerida por no haber incremento de volumen contractual."}
          </p>
        </div>

        {/* Motor de Reglas de Competencia Oficial */}
        <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-cyan-100 text-[#0096C7]">
                <Scale className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Competencia Legal
              </span>
            </div>
            <span
              className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                competencia.tipoNorma === "Decreto"
                  ? "bg-blue-100 text-[#0038A8] border-blue-300"
                  : "bg-cyan-100 text-[#007ba3] border-cyan-300"
              }`}
            >
              {competencia.tipoNorma}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-700">
              Autoridad: <span className="font-bold text-[#0B1938]">{competencia.autoridad}</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              {competencia.motivo}
            </p>
          </div>
        </div>

        {/* Botón Carátula de Control */}
        {onOpenCaratula && (
          <button
            type="button"
            onClick={onOpenCaratula}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0038A8]" />
            Ver Carátula de Control (PDF)
          </button>
        )}

        {/* Metadata de Plantilla */}
        <div className="px-1 py-1 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" /> Plantilla Adenda:
            </span>
            <span
              className="font-mono text-slate-500 font-medium truncate max-w-[170px]"
              title={plantillaNombre}
            >
              {data.modalidad}/{plantillaNombre}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Scale className="w-3 h-3 text-[#0096C7]" /> Plantilla {competencia.tipoNorma}:
            </span>
            <span
              className="font-mono text-[#0096C7] font-medium truncate max-w-[170px]"
              title={`${competencia.tipoNorma}/${plantillaNombre}`}
            >
              {competencia.tipoNorma}/{plantillaNombre}
            </span>
          </div>
        </div>
      </div>

      {/* Botones Principales de Generación y Descarga */}
      <div className="pt-2 space-y-2.5">
        {/* Botón Proyecto de Norma Legal */}
        {onGenerarNorma && (
          <button
            type="button"
            onClick={onGenerarNorma}
            disabled={isGenerating}
            className={`w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none ${
              moduloActivo === "norma"
                ? "bg-gradient-to-r from-[#0096C7] via-[#007ba3] to-[#0038A8] text-white shadow-cyan-900/20 hover:from-[#007ba3] hover:to-[#002b80]"
                : "bg-white hover:bg-cyan-50/80 text-[#007ba3] border-2 border-cyan-300"
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando {competencia.tipoNorma}...
              </>
            ) : (
              <>
                <Scale className="w-4 h-4" />
                Generar Proyecto de {competencia.tipoNorma} (.docx)
              </>
            )}
          </button>
        )}

        {/* Botón Proyecto de Adenda */}
        {onGenerar && (
          <button
            type="button"
            onClick={onGenerar}
            disabled={isGenerating}
            className={`w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none ${
              moduloActivo !== "norma"
                ? "bg-gradient-to-r from-[#0038A8] via-[#0044CC] to-[#0096C7] text-white shadow-blue-900/20 hover:from-[#002b80] hover:to-[#007ba3]"
                : "bg-white hover:bg-blue-50/80 text-[#0038A8] border-2 border-blue-300"
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando Adenda...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Generar Proyecto de Adenda (.docx)
              </>
            )}
          </button>
        )}

        <p className="text-center text-[11px] text-slate-400 mt-2">
          Genera los documentos oficiales combinando las cláusulas legales y limpiando rastros de correspondencia.
        </p>
      </div>
    </div>
  );
}
