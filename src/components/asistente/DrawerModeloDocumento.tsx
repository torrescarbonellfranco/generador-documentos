"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  UserCheck,
  PenTool,
  Scale,
  Sparkles,
  BookOpen,
  Clock,
  Layers,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import { DocumentoRequerido } from "@/lib/tramitacionRules";
import { MODELOS_TRAMITACION, ModeloItem } from "@/data/modelosTramitacion";

interface DrawerProps {
  documento: DocumentoRequerido | null;
  isOpen: boolean;
  onClose: () => void;
  tipoAlteracion?: string;
  naturalezaContratacion?: string;
  tieneItemsNuevos?: boolean;
  modalidad?: string;
}

// Normalización de parámetros del Wizard
function normalizarTipo(tipo?: string): "plazo" | "volumen" | "volumen_plazo" | "paralizacion" {
  if (!tipo) return "volumen_plazo";
  if (tipo === "ampliacion_plazo" || tipo === "plazo") return "plazo";
  if (tipo === "modificacion_volumen" || tipo === "volumen") return "volumen";
  if (tipo === "volumen_y_plazo" || tipo === "volumen_plazo") return "volumen_plazo";
  if (tipo === "paralizacion") return "paralizacion";
  return "volumen_plazo";
}

export default function DrawerModeloDocumento({
  documento,
  isOpen,
  onClose,
  tipoAlteracion,
  naturalezaContratacion = "obra",
  tieneItemsNuevos = false,
  modalidad = "aprobacion",
}: DrawerProps) {
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedCaso4, setCopiedCaso4] = useState(false);
  const [activeModeloId, setActiveModeloId] = useState<string>("");
  const [mostrarCaso4, setMostrarCaso4] = useState(false);

  const tipoNorm = normalizarTipo(tipoAlteracion);
  const modNorm = modalidad === "convalidacion" ? "convalidacion" : "aprobacion";
  const esProvision = naturalezaContratacion === "provision";

  // Identificación estricta de cada tipo de documento (sin solapamientos de categoría)
  const esOrdenesYNotas =
    documento?.id === "ordenes-notas-pedido" ||
    documento?.id === "comunicaciones-paralizacion" ||
    documento?.id === "comunicaciones-desparalizacion";

  const esMemoria = documento?.id === "memoria-descriptiva";
  const esNotaInicio = documento?.id === "nota-inicio";
  const esNotaInspector = documento?.id === "nota-inspector-croquis";
  const esAntecedentes = documento?.id === "antecedentes-certificados";

  // Identificar el caso exacto sugerido según las respuestas del Wizard
  const casoSugeridoOrdenesId = (() => {
    if (tipoNorm === "plazo") return "caso-1-plazo";
    if (tipoNorm === "paralizacion") return "caso-paralizacion";
    if (tipoNorm === "volumen" || tipoNorm === "volumen_plazo") {
      return tieneItemsNuevos ? "caso-2-volumen-items-nuevos" : "caso-3-volumen-sin-items-nuevos";
    }
    return "caso-2-volumen-items-nuevos";
  })();

  const casoSugeridoMemoriaId =
    modNorm === "convalidacion" ? "memoria-convalidacion" : "memoria-aprobacion";

  const casoSugeridoNotaInspectorId =
    tipoNorm === "paralizacion"
      ? "nota-inspector-paralizacion"
      : "nota-inspector-alteracion";

  // Efecto para auto-seleccionar el modelo exacto dinámico al abrir o cambiar parámetros
  useEffect(() => {
    if (!documento) {
      setActiveModeloId("");
      return;
    }

    if (esOrdenesYNotas) {
      setActiveModeloId(casoSugeridoOrdenesId);
    } else if (esMemoria) {
      setActiveModeloId(casoSugeridoMemoriaId);
    } else if (esNotaInicio) {
      setActiveModeloId("nota-inicio");
    } else if (esNotaInspector) {
      setActiveModeloId(casoSugeridoNotaInspectorId);
    } else {
      setActiveModeloId("");
    }
    setCopiedMain(false);
    setCopiedCaso4(false);
  }, [
    documento?.id,
    tipoNorm,
    tieneItemsNuevos,
    modNorm,
    isOpen,
    casoSugeridoOrdenesId,
    casoSugeridoMemoriaId,
    casoSugeridoNotaInspectorId,
    esOrdenesYNotas,
    esMemoria,
    esNotaInicio,
    esNotaInspector,
    esAntecedentes,
  ]);

  if (!isOpen || !documento) return null;

  // Modelos disponibles para el documento activo
  let modelosDisponibles: ModeloItem[] = [];
  if (esOrdenesYNotas) {
    modelosDisponibles = MODELOS_TRAMITACION.ordenes_y_notas || [];
  } else if (esMemoria) {
    modelosDisponibles = MODELOS_TRAMITACION.memoria || [];
  } else if (esNotaInicio) {
    modelosDisponibles = MODELOS_TRAMITACION.nota_inicio || [];
  } else if (esNotaInspector) {
    modelosDisponibles = MODELOS_TRAMITACION.nota_inspector || [];
  }

  // Modelo activo seleccionado
  const activeModelo =
    modelosDisponibles.find((m) => m.id === activeModeloId) ||
    modelosDisponibles[0] ||
    null;

  // Modelo del Caso 4 para desplegable secundario en Órdenes y Notas
  const caso4Item = MODELOS_TRAMITACION.ordenes_y_notas?.find(
    (m) => m.id === "caso-4-iniciativa-inspeccion"
  );

  const textoPrincipal = activeModelo?.texto || documento.modeloTexto || "";

  const handleCopyMain = () => {
    if (textoPrincipal) {
      navigator.clipboard.writeText(textoPrincipal);
      setCopiedMain(true);
      setTimeout(() => setCopiedMain(false), 2500);
    }
  };

  const handleCopyCaso4 = () => {
    if (caso4Item?.texto) {
      navigator.clipboard.writeText(caso4Item.texto);
      setCopiedCaso4(true);
      setTimeout(() => setCopiedCaso4(false), 2500);
    }
  };

  // Etiqueta del trámite configurado en el Wizard
  const tipoLabel =
    tipoNorm === "plazo"
      ? "Ampliación de Plazo"
      : tipoNorm === "volumen"
      ? "Modificación de Volumen"
      : tipoNorm === "volumen_plazo"
      ? "Volumen y Plazo"
      : "Paralización";

  const modalidadLabel = modNorm === "aprobacion" ? "Aprobación Previa" : "Convalidación Posterior";

  // Título dinámico para el encabezado
  const tituloHeader = esNotaInspector
    ? esProvision
      ? "Nota del inspector de obra"
      : "Nota del inspector y croquis de ubicación"
    : documento.nombre;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Cerrar panel lateral"
      />

      {/* Drawer lateral */}
      <div
        className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 border-l border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Encabezado del Drawer */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0038A8] border border-blue-200 inline-block">
                {documento.categoriaLabel}
              </span>
              {!esAntecedentes && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block">
                  Modelo Oficial SIGAC
                </span>
              )}
              {esAntecedentes && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 inline-block">
                  Legajo Antecedente Certificado
                </span>
              )}
              {esNotaInspector && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300 inline-block">
                  {esProvision ? "Provisión / Suministro" : "Ejecución de Obra"}
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#0B1938] leading-tight">
              {tituloHeader}
            </h3>
            {documento.fundamentoLegal && (
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 pt-0.5">
                <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Base legal: {documento.fundamentoLegal}</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
            title="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
          {/* Banner de Sincronización Dinámica con el Wizard (Oculto para Antecedentes) */}
          {!esAntecedentes && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-blue-100 text-[#0038A8] shrink-0">
                  <Sparkles className="w-4 h-4 text-[#0038A8]" />
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-[#0B1938] block">
                    Ejemplo ajustado a las respuestas del Inspector:
                  </span>
                  <p className="text-slate-600 font-medium">
                    {tipoLabel} &bull; {modalidadLabel} {tieneItemsNuevos ? "&bull; Con Ítems Nuevos" : ""}{" "}
                    &bull; {esProvision ? "Provisión" : "Obra"}
                  </p>
                </div>
              </div>

              <a
                href="/Manuales/Ejemplos.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-[#0038A8] text-xs font-bold transition-all border border-blue-200 shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#0038A8]" />
                <span>Ver manual PDF</span>
                <ExternalLink className="w-3 h-3 text-blue-400" />
              </a>
            </div>
          )}

          {/* Finalidad Administrativa (Oculto para Antecedentes) */}
          {!esAntecedentes && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#0038A8]" />
                Finalidad Administrativa
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {esNotaInspector
                  ? "Nota del Inspector de Obra dirigida a la Dirección General de Inspecciones solicitando la apertura y giro del expediente para la tramitación de la alteración."
                  : documento.descripcion}
              </p>
            </div>
          )}

          {/* CASO A: ÓRDENES DE SERVICIO Y NOTAS DE PEDIDO */}
          {esOrdenesYNotas && (
            <div className="space-y-4">
              {/* Selector de Casos con indicación del sugerido */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#0B1938] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#0038A8]" />
                    Casos de Órdenes de Servicio y Notas de Pedido:
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    4 Casos Oficiales
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {modelosDisponibles
                    .filter((m) => m.id !== "caso-4-iniciativa-inspeccion")
                    .map((m) => {
                      const isSelected = m.id === activeModeloId;
                      const isSuggested = m.id === casoSugeridoOrdenesId;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setActiveModeloId(m.id);
                            setCopiedMain(false);
                          }}
                          className={`text-left p-3 rounded-2xl text-xs font-bold transition-all flex flex-col justify-between cursor-pointer border ${
                            isSelected
                              ? "bg-[#0038A8] text-white border-[#0038A8] shadow-md shadow-blue-900/10 ring-2 ring-blue-500/20"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1 w-full mb-1">
                            <span className="leading-snug">{m.titulo}</span>
                            {isSelected && (
                              <Check className="w-4 h-4 shrink-0 text-cyan-300" />
                            )}
                          </div>
                          {isSuggested && (
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md inline-block w-fit mt-1 ${
                                isSelected
                                  ? "bg-white/20 text-cyan-200"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              ⭐ Sugerido por Wizard
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Observaciones destacadas del caso activo */}
              {activeModelo?.observaciones && (
                <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 text-sky-950 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0038A8] block">
                    Observaciones Técnicas del Caso:
                  </span>
                  <p className="text-xs font-semibold leading-relaxed text-sky-950">
                    {activeModelo.observaciones}
                  </p>
                </div>
              )}

              {/* Regla Temporal del Modelo */}
              {activeModelo?.reglaTemporal && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-amber-200 text-amber-900">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                      Regla de Correlación Temporal Obligatoria
                    </h4>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-amber-950">
                    {activeModelo.reglaTemporal}
                  </p>
                </div>
              )}

              {/* Bloque de Texto del Modelo Principal */}
              {textoPrincipal && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#0096C7]" />
                      {activeModelo?.titulo || "Texto Oficial"}
                    </h4>
                    <button
                      type="button"
                      onClick={handleCopyMain}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0038A8] hover:bg-[#002b80] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      {copiedMain ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          📋 Copiar modelo
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto border border-slate-700 shadow-inner">
                      {textoPrincipal}
                    </pre>
                  </div>
                </div>
              )}

              {/* DESPLEGABLE SECUNDARIO: CASO 4 (INICIATIVA COMITENTE) */}
              {caso4Item && (
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMostrarCaso4(!mostrarCaso4)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#0038A8]" />
                      <span>{caso4Item.titulo}</span>
                    </div>
                    {mostrarCaso4 ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {mostrarCaso4 && (
                    <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-200">
                      {caso4Item.observaciones && (
                        <p className="text-xs text-slate-600 font-medium">
                          <strong>Observaciones:</strong> {caso4Item.observaciones}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                          Modelo Orden de Servicio + Nota de Pedido de Conformidad:
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCaso4}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0038A8] hover:bg-[#002b80] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          {copiedCaso4 ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-300" />
                              ¡Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              📋 Copiar Caso 4
                            </>
                          )}
                        </button>
                      </div>

                      <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto border border-slate-700 shadow-inner">
                        {caso4Item.texto}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Firmantes Obligatorios al pie */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Firmantes Obligatorios al Pie
                </span>
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  Representante Técnico de la Empresa, Inspector de Obra, y sello de copia fiel del Director General de Inspecciones.
                </p>
              </div>
            </div>
          )}

          {/* CASO B: MEMORIA DEL CUADRO COMPARATIVO */}
          {esMemoria && (
            <div className="space-y-4">
              {/* Selector de Modalidad (Aprobación Previa vs Convalidación) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {modelosDisponibles.map((m) => {
                  const isSelected = m.id === activeModeloId;
                  const isSuggested = m.id === casoSugeridoMemoriaId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setActiveModeloId(m.id);
                        setCopiedMain(false);
                      }}
                      className={`text-left p-3.5 rounded-2xl text-xs font-bold transition-all flex flex-col justify-between cursor-pointer border ${
                        isSelected
                          ? "bg-[#0038A8] text-white border-[#0038A8] shadow-md shadow-blue-900/10 ring-2 ring-blue-500/20"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 w-full mb-1">
                        <span className="leading-snug">{m.titulo}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 shrink-0 text-cyan-300" />
                        )}
                      </div>
                      {isSuggested && (
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md inline-block w-fit mt-1 ${
                            isSelected
                              ? "bg-white/20 text-cyan-200"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          ⭐ Sugerido para tu Modalidad
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Callout Destacado de Terminología Obligatoria */}
              {activeModelo?.calloutDestacado && (
                <div
                  className={`p-4 rounded-2xl border-2 space-y-1.5 shadow-xs ${
                    activeModelo.modalidad === "convalidacion"
                      ? "bg-purple-50/90 border-purple-300 text-purple-950"
                      : "bg-amber-50/90 border-amber-400 text-amber-950"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 ${
                        activeModelo.modalidad === "convalidacion"
                          ? "text-purple-700"
                          : "text-amber-700"
                      }`}
                    />
                    <span className="text-xs font-black uppercase tracking-wider">
                      {activeModelo.modalidad === "convalidacion"
                        ? "Enfoque de Hecho Consumado Obligatorio"
                        : "Regla Terminológica Obligatoria"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed">
                    {activeModelo.calloutDestacado}
                  </p>
                </div>
              )}

              {/* Observaciones de la Memoria */}
              {activeModelo?.observaciones && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs">
                  <p className="leading-relaxed">
                    <strong>Punto de Control:</strong> {activeModelo.observaciones}
                  </p>
                </div>
              )}

              {/* Texto de la Memoria con Copiado */}
              {textoPrincipal && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#0096C7]" />
                      {activeModelo?.titulo || "Texto Oficial de la Memoria"}
                    </h4>
                    <button
                      type="button"
                      onClick={handleCopyMain}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0038A8] hover:bg-[#002b80] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      {copiedMain ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          📋 Copiar modelo
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto border border-slate-700 shadow-inner">
                      {textoPrincipal}
                    </pre>
                  </div>
                </div>
              )}

              {/* Firmantes según Modalidad */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Firmantes Reglamentarios de la Memoria
                </span>
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  {activeModelo?.firmantes ||
                    (modNorm === "convalidacion"
                      ? "Firma original de Inspector de Obra, Director General de Obras e intervención del Representante Técnico."
                      : "Inspector de Obra y Director General de Inspecciones.")}
                </p>
              </div>
            </div>
          )}

          {/* CASO C: NOTA DE INICIO DE ACTUACIONES */}
          {esNotaInicio && (
            <div className="space-y-4">
              {/* Observaciones destacadas de Nota de Inicio */}
              <div className="p-4 rounded-2xl bg-blue-50/90 border-2 border-blue-200 text-blue-950 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0038A8] shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#0038A8]">
                    Finalidad Administrativa y Observaciones
                  </span>
                </div>
                <p className="text-xs font-semibold leading-relaxed text-blue-950">
                  Nota formal que encabeza el expediente y eleva la solicitud a la Dirección General de Mesa de Entradas y Salidas, detallando el objeto y sintetizando los antecedentes, con la suscripción de la Subsecretaría de Planificación y Elaboración de Proyectos.
                </p>
              </div>

              {/* Recomendación Estratégica del Área */}
              {activeModelo?.recomendacion && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-amber-950 text-xs space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                    Recomendación Estratégica del Área:
                  </span>
                  <p className="leading-relaxed font-medium">
                    {activeModelo.recomendacion}
                  </p>
                </div>
              )}

              {/* Texto de la Nota con Botón Copiar */}
              {textoPrincipal && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#0096C7]" />
                      {activeModelo?.titulo || "Nota de Elevación y Solicitud de Alcance"}
                    </h4>
                    <button
                      type="button"
                      onClick={handleCopyMain}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0038A8] hover:bg-[#002b80] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      {copiedMain ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          📋 Copiar modelo
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto border border-slate-700 shadow-inner">
                      {textoPrincipal}
                    </pre>
                  </div>
                </div>
              )}

              {/* Firmantes Obligatorios */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Firmantes Obligatorios
                </span>
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  Director General de Inspecciones y Subsecretario de Planificación y Elaboración de Proyectos.
                </p>
              </div>
            </div>
          )}

          {/* CASO D: NOTA DEL INSPECTOR (Y CROQUIS DE UBICACIÓN CONDICIONAL) */}
          {esNotaInspector && (
            <div className="space-y-4">
              {/* Encabezado formal: Destinatario */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                  Destinatario Oficial:
                </span>
                <span className="font-black text-[#0B1938] uppercase">
                  AL DIRECTOR GENERAL DE INSPECCIONES:
                </span>
              </div>

              {/* Observaciones de la Nota del Inspector */}
              <div className="p-4 rounded-2xl bg-blue-50/90 border-2 border-blue-200 text-blue-950 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0038A8] shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#0038A8]">
                    Observaciones Técnicas y Alcance
                  </span>
                </div>
                <ul className="text-xs font-medium space-y-1.5 text-blue-950">
                  <li className="leading-relaxed">
                    <strong>• Genérica y abierta:</strong> No limita el trámite a una sola causal. Permite tramitar conjuntamente modificaciones de volumen (aumentos/disminuciones), ítems nuevos y ampliación de plazos en un mismo expediente.
                  </li>
                  <li className="leading-relaxed">
                    <strong>• Firma exclusiva:</strong> Es suscripta únicamente por el Inspector de Obra.
                  </li>
                </ul>
              </div>

              {/* Condicional de Croquis: Solo para Ejecución de Obra */}
              {!esProvision && (
                <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 text-amber-950 space-y-1 shadow-2xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                      Requisito de Adjunción Obligatorio
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-amber-950">
                    📎 REQUISITO DE ADJUNCIÓN: La nota debe ser acompañada obligatoriamente por el croquis de ubicación geográfica y progresivas de la obra en escala.
                  </p>
                </div>
              )}

              {/* Texto de la Nota con Botón Copiar */}
              {textoPrincipal && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#0096C7]" />
                      {activeModelo?.titulo || "Nota del Inspector al Director General"}
                    </h4>
                    <button
                      type="button"
                      onClick={handleCopyMain}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0038A8] hover:bg-[#002b80] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      {copiedMain ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          📋 Copiar modelo
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto border border-slate-700 shadow-inner">
                      {textoPrincipal}
                    </pre>
                  </div>
                </div>
              )}

              {/* Firmante exclusivo */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Firmante Obligatorio
                </span>
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  Inspector de Obra (firma exclusiva).
                </p>
              </div>
            </div>
          )}

          {/* CASO E: DOCUMENTACIÓN ANTECEDENTE CERTIFICADA (LEGAJO PREEXISTENTE) */}
          {esAntecedentes && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#0B1938] flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-[#0038A8]" />
                  Detalle de Documentos que Componen el Legajo Antecedente
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  4 Documentos Requeridos
                </span>
              </div>

              <div className="space-y-2.5">
                {/* 1. Norma Legal de Adjudicación */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition-colors flex items-start gap-3.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0038A8] flex items-center justify-center shrink-0 font-extrabold text-xs">
                    1
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h5 className="font-extrabold text-sm text-[#0B1938]">
                      Norma Legal de Adjudicación
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Disposición, Resolución o Decreto según el tipo de contratación.
                    </p>
                  </div>
                </div>

                {/* 2. Contrato de Obra Pública */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition-colors flex items-start gap-3.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0038A8] flex items-center justify-center shrink-0 font-extrabold text-xs">
                    2
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h5 className="font-extrabold text-sm text-[#0B1938]">
                      Contrato de Obra Pública
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Contrato de Obra Pública suscrito por la empresa contratista.
                    </p>
                  </div>
                </div>

                {/* 3. Acta de Replanteo */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition-colors flex items-start gap-3.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0038A8] flex items-center justify-center shrink-0 font-extrabold text-xs">
                    3
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h5 className="font-extrabold text-sm text-[#0B1938]">
                      Acta de Replanteo de la obra
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Acta de Replanteo de la obra que fija la fecha cierta del cómputo contractual.
                    </p>
                  </div>
                </div>

                {/* 4. Normas legales de alteraciones anteriores */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition-colors flex items-start gap-3.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0038A8] flex items-center justify-center shrink-0 font-extrabold text-xs">
                    4
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h5 className="font-extrabold text-sm text-[#0B1938]">
                      Normas legales de aprobación de alteraciones anteriores
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Normas legales de aprobación de alteraciones anteriores (si la obra cuenta con variaciones o adendas previas).
                    </p>
                  </div>
                </div>
              </div>

              {/* Recordatorio de Sello de Copia Fiel */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-amber-950 text-xs space-y-1">
                <span className="font-extrabold uppercase tracking-wide text-amber-900 block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  Sello Obligatorio de Autenticación
                </span>
                <p className="leading-relaxed font-semibold">
                  Todos los antecedentes fotocopiados deben contar con el sello y firma original de <strong>&quot;Es Copia Fiel del Original&quot;</strong> otorgado por la Dirección de Despacho o autoridad competente de Mesa General de Entradas.
                </p>
              </div>
            </div>
          )}

          {/* OTROS DOCUMENTOS (Fallback para ítems generales sin modelo específico) */}
          {!esOrdenesYNotas && !esMemoria && !esNotaInicio && !esNotaInspector && !esAntecedentes && (
            <div className="space-y-4">
              {documento.reglaDestacada && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 shadow-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-800 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      Regla de Control
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed">
                    {documento.reglaDestacada}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0038A8] flex items-center gap-1 mb-1">
                    <PenTool className="w-3.5 h-3.5" />
                    Área Responsable
                  </span>
                  <p className="text-xs font-bold text-slate-900 leading-snug">
                    {documento.redactadoPor}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1 mb-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    Firmantes
                  </span>
                  <p className="text-xs font-bold text-slate-900 leading-snug">
                    {documento.firmadoPor}
                  </p>
                </div>
              </div>

              {textoPrincipal && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#0096C7]" />
                      Modelo Recomendado
                    </h4>
                    <button
                      type="button"
                      onClick={handleCopyMain}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0038A8] hover:bg-[#002b80] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      {copiedMain ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          📋 Copiar modelo
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto border border-slate-700 shadow-inner">
                      {textoPrincipal}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Errores comunes a evitar (Oculto para Antecedentes) */}
          {!esAntecedentes && documento.erroresComunes && documento.erroresComunes.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Errores Frecuentes a Evitar (Motivos de Devolución)
              </h4>
              <ul className="space-y-1.5 text-xs text-amber-950">
                {documento.erroresComunes.map((err, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span className="leading-relaxed">{err}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Consejo de Alty (Oculto para Antecedentes) */}
          {!esAntecedentes && documento.consejoAlty && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-blue-50 border border-orange-200 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-300 p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/alty.png"
                  alt="Alty"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7A00] block mb-0.5">
                  Consejo de Alty
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {documento.consejoAlty}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Drawer */}
        <div
          className={`p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center gap-3 ${
            esAntecedentes ? "justify-end" : "justify-between"
          }`}
        >
          {!esAntecedentes && (
            <a
              href="/Manuales/Ejemplos.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-[#0038A8] text-slate-700 hover:text-white text-xs font-bold transition-all border border-slate-300 hover:border-[#0038A8] shadow-2xs group cursor-pointer w-full sm:w-auto justify-center"
            >
              <FileText className="w-3.5 h-3.5 text-[#0038A8] group-hover:text-white transition-colors" />
              <span>Ver manual PDF completo</span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center ${
              esAntecedentes
                ? "bg-[#0038A8] hover:bg-[#002b80] text-white shadow-xs"
                : "bg-slate-200 hover:bg-slate-300 text-slate-700"
            }`}
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
