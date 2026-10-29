"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ResultadoDiagnostico,
  DocumentoRequerido,
} from "@/lib/tramitacionRules";
import {
  CheckCircle2,
  Circle,
  FileText,
  BookOpen,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Clock,
  FileCheck2,
  ArrowRight,
  ExternalLink,
  Scale,
} from "lucide-react";

interface ChecklistProps {
  resultado: ResultadoDiagnostico;
  onReconfigurar: () => void;
  onVerModelo: (doc: DocumentoRequerido) => void;
}

export default function ChecklistResultados({
  resultado,
  onReconfigurar,
  onVerModelo,
}: ChecklistProps) {
  // Estado local para checkboxes interactivos
  const [completados, setCompletados] = useState<Record<string, boolean>>({});
  const [panelObservacionesAbierto, setPanelObservacionesAbierto] =
    useState<boolean>(true);

  const toggleCheck = (id: string) => {
    setCompletados((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalCompletados = Object.values(completados).filter(Boolean).length;
  const porcentajeAvance = Math.round(
    (totalCompletados / resultado.documentos.length) * 100
  );

  // Agrupación por categoría
  const categoriasMap = new Map<string, DocumentoRequerido[]>();
  resultado.documentos.forEach((doc) => {
    const list = categoriasMap.get(doc.categoriaLabel) || [];
    list.push(doc);
    categoriasMap.set(doc.categoriaLabel, list);
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Tarjeta de Resumen del Diagnóstico */}
      <div className="bg-gradient-to-br from-[#0B1938] via-[#0038A8] to-[#0096C7] rounded-2xl py-3.5 px-5 text-white shadow-md relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          {/* Fila Superior: Título + Breve resumen y Botón Reconfigurar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <h2 className="text-lg font-bold tracking-tight leading-snug text-white">
                {resultado.tituloCircuito}
              </h2>
              <p className="text-xs text-blue-100/90 leading-relaxed font-normal">
                {resultado.resumenCircuito}
              </p>
            </div>

            <button
              type="button"
              onClick={onReconfigurar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer backdrop-blur-xs shrink-0 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reconfigurar Parámetros</span>
            </button>
          </div>

          {/* Barra de Progreso del Checklist al pie */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-blue-100 text-[11px] font-medium">
                Progreso de Compilación Documental:
              </span>
              <span className="text-white text-xs font-bold">
                {totalCompletados} de {resultado.documentos.length} reunidos ({porcentajeAvance}%)
              </span>
            </div>
            <div className="w-full h-2 bg-black/25 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-[#00B4D8] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${porcentajeAvance}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista del Checklist agrupada por categoría */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-[#0B1938]">
              Checklist Oficial de Documentación Requerida
            </h3>
            <p className="text-xs text-slate-500">
              Marcá los documentos a medida que se incorporen al expediente y hacé clic en &quot;Ver Modelo&quot; para consultar requisitos de firma y formato.
            </p>
          </div>
        </div>

        {Array.from(categoriasMap.entries()).map(([categoriaLabel, docs], catIdx) => (
          <div
            key={catIdx}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden"
          >
            {/* Cabecera de Categoría */}
            <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#0B1938] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#0038A8]" />
                {categoriaLabel}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {docs.length} {docs.length === 1 ? "documento" : "documentos"}
              </span>
            </div>

            {/* Lista de documentos de la categoría */}
            <div className="divide-y divide-slate-100">
              {docs.map((doc) => {
                const isChecked = !!completados[doc.id];
                return (
                  <div
                    key={doc.id}
                    className={`p-5 sm:p-6 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isChecked ? "bg-emerald-50/30" : "hover:bg-slate-50/60"
                    }`}
                  >
                    {/* Checkbox y Nombre */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleCheck(doc.id)}
                        className="mt-0.5 text-slate-400 hover:text-[#0038A8] transition-colors shrink-0"
                        title={isChecked ? "Marcar como pendiente" : "Marcar como reunido"}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300" />
                        )}
                      </button>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            onClick={() => toggleCheck(doc.id)}
                            className={`font-bold text-sm cursor-pointer select-none ${
                              isChecked
                                ? "text-emerald-950 line-through decoration-emerald-500/50"
                                : "text-slate-900"
                            }`}
                          >
                            {doc.nombre}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                            Obligatorio
                          </span>
                          {doc.tieneModelo && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#0038A8] border border-blue-200 shrink-0">
                              Tiene Modelo Legal
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                          {doc.descripcion}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-600">
                          <span>
                            <strong className="text-slate-700">Firma:</strong> {doc.firmadoPor}
                          </span>
                        </div>

                        {doc.reglaDestacada && (
                          <div className="mt-2.5 p-3 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 flex items-start gap-2.5 shadow-2xs">
                            <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-[11px] uppercase tracking-wide text-amber-900 block">
                                Regla de Correlación Temporal Obligatoria:
                              </span>
                              <p className="text-xs leading-relaxed text-amber-950 font-medium">
                                {doc.reglaDestacada}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botón Ver Modelo / Consultar Documentos */}
                    <div className="shrink-0 w-full sm:w-auto flex justify-end">
                      <button
                        type="button"
                        onClick={() => onVerModelo(doc)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-[#0038A8] text-slate-700 hover:text-white text-xs font-bold transition-all shadow-xs group"
                      >
                        {doc.id === "antecedentes-certificados" ? (
                          <>
                            <FileCheck2 className="w-3.5 h-3.5 text-[#0038A8] group-hover:text-white transition-colors" />
                            <span>Consultar Documentos Requeridos</span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-3.5 h-3.5 text-[#0038A8] group-hover:text-white transition-colors" />
                            <span>Ver Modelo y Recomendaciones</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* SECCIÓN FINAL DE OBSERVACIONES GENERALES DE CONTROL */}
      <div className="bg-white rounded-3xl border-2 border-amber-200/90 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setPanelObservacionesAbierto(!panelObservacionesAbierto)}
          className="w-full px-6 py-4 bg-amber-50/80 hover:bg-amber-100/70 border-b border-amber-200 flex items-center justify-between text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-amber-950 uppercase tracking-wide">
                Puntos de Control Crítico y Observaciones Generales de la Mesa
              </h4>
              <p className="text-xs text-amber-800/90">
                Reglas formales ineludibles para evitar la devolución del expediente por Asesoría Letrada o Tribunal de Cuentas
              </p>
            </div>
          </div>

          <div className="p-1 rounded-lg text-amber-800">
            {panelObservacionesAbierto ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </button>

        {panelObservacionesAbierto && (
          <div className="p-6 space-y-4 text-xs text-slate-700 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Advertencia 1: Foliatura ininterrumpida */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1.5">
                <span className="font-extrabold text-[#0B1938] block text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  1. Foliatura Ininterrumpida
                </span>
                <p className="text-slate-600 leading-relaxed">
                  El expediente debe guardar una <strong>foliatura correlativa estricta y sin saltos</strong> desde la foja 1 (Nota de inicio) hasta el pase final. Prohibido utilizar corrector blanco o enmiendas sin salvar formalmente.
                </p>
              </div>

              {/* Advertencia 2: Copia Fiel */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1.5">
                <span className="font-extrabold text-[#0B1938] block text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  2. Sello de Copia Fiel Obligatorio
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Todos los antecedentes fotocopiados (Contrato de obra, Decretos de adjudicación y Actas de replanteo) deben contener el <strong>sello de autenticación de &quot;Es Copia Fiel&quot;</strong> emitido por la autoridad competente de Despacho.
                </p>
              </div>

              {/* Advertencia 3: Pólizas de Garantía */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1.5">
                <span className="font-extrabold text-[#0B1938] block text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  3. Vigencia de Pólizas de Caución
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Toda ampliación de plazo o alteración de volumen requiere la <strong>presentación del endoso o certificado de prórroga</strong> de la póliza de garantía del contrato por parte de la empresa aseguradora, extendiendo su vigencia hasta el nuevo vencimiento.
                </p>
              </div>
            </div>

            {/* Advertencia Crítica Adicional */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>ATENCIÓN REGLAMENTARIA RIGUROSA:</strong> En los trámites de ampliación de plazo o reprogramación, el <strong>Plan de Trabajo y Curva de Inversiones de la alteración NO DEBE ser firmado por la contratista</strong> previo a la aprobación formal. Solo debe contar con las firmas de la Inspección de Obra y la Dirección Municipal.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Botón de Acción Principal para ir a generar */}
      <div className="bg-slate-100 rounded-3xl p-6 sm:p-8 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-base sm:text-lg font-black text-[#0B1938]">
            ¿Ya reuniste o tenés claros los antecedentes técnicos?
          </h4>
          <p className="text-xs text-slate-500">
            Avanzá directamente al generador unificado para redactar la Adenda, la Norma Legal y la Carátula de Control en simultáneo.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#0038A8] hover:bg-[#002b80] text-white text-xs font-bold shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-all shrink-0 cursor-pointer text-center"
        >
          <span>Ir a Generar Proyecto de Adenda / Norma</span>
          <ArrowRight className="w-4 h-4 text-cyan-300" />
        </Link>
      </div>
    </div>
  );
}
