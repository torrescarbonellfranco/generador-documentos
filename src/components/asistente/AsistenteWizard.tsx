"use client";

import React, { useState } from "react";
import {
  Clock,
  Layers,
  ArrowRight,
  ArrowLeft,
  PauseCircle,
  TrendingUp,
  Sparkles,
  Check,
  AlertCircle,
  HardHat,
  Package,
} from "lucide-react";
import {
  TipoAlteracionTramite,
  ModalidadTramite,
  NaturalezaContratacion,
  DiagnosticoTramiteParams,
} from "@/lib/tramitacionRules";

interface WizardProps {
  onDiagnosticar: (params: DiagnosticoTramiteParams) => void;
  initialParams?: DiagnosticoTramiteParams;
}

export default function AsistenteWizard({
  onDiagnosticar,
  initialParams,
}: WizardProps) {
  const [pasoActual, setPasoActual] = useState<number>(1);
  const [tipo, setTipo] = useState<TipoAlteracionTramite>(
    initialParams?.tipoAlteracion || "volumen_y_plazo"
  );
  const [naturaleza, setNaturaleza] = useState<NaturalezaContratacion>(
    initialParams?.naturalezaContratacion || "obra"
  );
  const [itemsNuevos, setItemsNuevos] = useState<boolean>(
    initialParams?.incorporaItemsNuevos ?? false
  );
  const [modalidad, setModalidad] = useState<ModalidadTramite>(
    initialParams?.modalidad || "aprobacion"
  );

  const requierePasoItemsNuevos =
    tipo === "modificacion_volumen" || tipo === "volumen_y_plazo";
  const requierePasoModalidad = tipo !== "paralizacion";

  const handleAvanzar = () => {
    if (tipo === "paralizacion") {
      onDiagnosticar({
        tipoAlteracion: "paralizacion",
        naturalezaContratacion: naturaleza,
        incorporaItemsNuevos: false,
      });
      return;
    }

    if (pasoActual === 1) {
      if (requierePasoItemsNuevos) {
        setPasoActual(2);
      } else {
        setPasoActual(3);
      }
      return;
    }

    if (pasoActual === 2) {
      setPasoActual(3);
      return;
    }

    if (pasoActual === 3) {
      onDiagnosticar({
        tipoAlteracion: tipo,
        naturalezaContratacion: naturaleza,
        incorporaItemsNuevos: requierePasoItemsNuevos ? itemsNuevos : false,
        modalidad,
      });
    }
  };

  const handleRetroceder = () => {
    if (pasoActual === 3) {
      if (requierePasoItemsNuevos) {
        setPasoActual(2);
      } else {
        setPasoActual(1);
      }
    } else if (pasoActual === 2) {
      setPasoActual(1);
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-xl overflow-hidden transition-all duration-300">
      {/* Barra de progreso superior */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0038A8] flex items-center justify-center font-black text-sm">
            {pasoActual}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0B1938]">
              {pasoActual === 1 && "Paso 1: Naturaleza y Tipo de Alteración"}
              {pasoActual === 2 && "Paso 2: Incorporación de Ítems Nuevos"}
              {pasoActual === 3 && "Paso 3: Modalidad Administrativa y Plazos"}
            </h3>
            <p className="text-xs text-slate-500">
              Configurá las variables del expediente para emitir la lista obligatoria
            </p>
          </div>
        </div>

        {/* Indicador visual de pasos */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              pasoActual >= 1 ? "w-8 bg-[#0038A8]" : "w-2 bg-slate-200"
            }`}
          />
          {requierePasoItemsNuevos && (
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                pasoActual >= 2 ? "w-8 bg-[#0038A8]" : "w-2 bg-slate-200"
              }`}
            />
          )}
          {requierePasoModalidad && (
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                pasoActual === 3 ? "w-8 bg-[#0038A8]" : "w-2 bg-slate-200"
              }`}
            />
          )}
        </div>
      </div>

      {/* Cuerpo del Asistente con transiciones suaves (Fade & Slide) */}
      <div className="p-6 sm:p-8">
        {/* PASO 1: NATURALEZA Y TIPO DE ALTERACIÓN */}
        {pasoActual === 1 && (
          <div
            key="paso-1"
            className="space-y-6 transition-all duration-500 ease-in-out opacity-100 transform translate-y-0 animate-in fade-in slide-in-from-right-4"
          >
            {/* 3. Condicional para Croquis: Selector de Naturaleza de la Contratación */}
            <div className="bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-3">
              <div>
                <span className="text-xs sm:text-sm font-extrabold text-[#0B1938] block">
                  ¿La contratación es de Ejecución de Obra o de Provisión?
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  Define si se exige croquis territorial de ubicación en el expediente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNaturaleza("obra")}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer hover:-translate-y-0.5 hover:shadow-xs ${
                    naturaleza === "obra"
                      ? "border-[#0038A8] bg-white text-[#0038A8] shadow-xs ring-2 ring-blue-500/10"
                      : "border-slate-200 bg-white/70 hover:bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg ${
                        naturaleza === "obra"
                          ? "bg-blue-100 text-[#0038A8]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <HardHat className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-slate-900">
                        Ejecución de Obra
                      </span>
                      <span className="text-[10px] text-slate-500 block font-medium">
                        Requiere croquis de ubicación geográfica
                      </span>
                    </div>
                  </div>
                  {naturaleza === "obra" && (
                    <Check className="w-4 h-4 text-[#0038A8] shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setNaturaleza("provision")}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer hover:-translate-y-0.5 hover:shadow-xs ${
                    naturaleza === "provision"
                      ? "border-[#0038A8] bg-white text-[#0038A8] shadow-xs ring-2 ring-blue-500/10"
                      : "border-slate-200 bg-white/70 hover:bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg ${
                        naturaleza === "provision"
                          ? "bg-blue-100 text-[#0038A8]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-slate-900">
                        Provisión / Suministro
                      </span>
                      <span className="text-[10px] text-slate-500 block font-medium">
                        No requiere croquis territorial
                      </span>
                    </div>
                  </div>
                  {naturaleza === "provision" && (
                    <Check className="w-4 h-4 text-[#0038A8] shrink-0" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-extrabold text-[#0B1938]">
                ¿Qué tipo de alteración contractual se pretende tramitar?
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Seleccioná el objeto principal de la modificación conforme a la Ley de Obras Públicas N° 687.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opción 1: Ampliación de Plazo */}
              <div
                onClick={() => setTipo("ampliacion_plazo")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 hover:-translate-y-0.5 hover:shadow-md ${
                  tipo === "ampliacion_plazo"
                    ? "border-[#0038A8] bg-blue-50/50 shadow-md ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80"
                }`}
              >
                <div
                  className={`p-3 rounded-xl shrink-0 transition-colors ${
                    tipo === "ampliacion_plazo"
                      ? "bg-[#0038A8] text-white"
                      : "bg-blue-100 text-[#0038A8]"
                  }`}
                >
                  <Clock className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#0B1938]">
                      Ampliación de Plazo
                    </span>
                    {tipo === "ampliacion_plazo" && (
                      <Check className="w-4 h-4 text-[#0038A8]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Extensión de días corridos sin variación del monto del contrato. Se sustenta en causales meteorológicas o interferencias.
                  </p>
                </div>
              </div>

              {/* Opción 2: Modificación de Volumen */}
              <div
                onClick={() => setTipo("modificacion_volumen")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 hover:-translate-y-0.5 hover:shadow-md ${
                  tipo === "modificacion_volumen"
                    ? "border-[#0038A8] bg-blue-50/50 shadow-md ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80"
                }`}
              >
                <div
                  className={`p-3 rounded-xl shrink-0 transition-colors ${
                    tipo === "modificacion_volumen"
                      ? "bg-[#0038A8] text-white"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#0B1938]">
                      Modificación de Volumen
                    </span>
                    {tipo === "modificacion_volumen" && (
                      <Check className="w-4 h-4 text-[#0038A8]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Variación económica con aumento o disminución de ítems contractuales sin alterar el plazo vigente.
                  </p>
                </div>
              </div>

              {/* Opción 3: Modificación de Volumen y Ampliación de Plazo (DENOMINACIÓN FORMAL OFICIAL) */}
              <div
                onClick={() => setTipo("volumen_y_plazo")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 hover:-translate-y-0.5 hover:shadow-md ${
                  tipo === "volumen_y_plazo"
                    ? "border-[#0038A8] bg-blue-50/50 shadow-md ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80"
                }`}
              >
                <div
                  className={`p-3 rounded-xl shrink-0 transition-colors ${
                    tipo === "volumen_y_plazo"
                      ? "bg-[#0038A8] text-white"
                      : "bg-cyan-100 text-[#0096C7]"
                  }`}
                >
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#0B1938]">
                      Modificación de Volumen y Ampliación de Plazo
                    </span>
                    {tipo === "volumen_y_plazo" && (
                      <Check className="w-4 h-4 text-[#0038A8]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Combinación de variación presupuestaria y prórroga temporal de ejecución. Requiere cuadro comparativo y plan de trabajo.
                  </p>
                </div>
              </div>

              {/* Opción 4: Paralización / Desparalización */}
              <div
                onClick={() => setTipo("paralizacion")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 hover:-translate-y-0.5 hover:shadow-md ${
                  tipo === "paralizacion"
                    ? "border-[#0038A8] bg-blue-50/50 shadow-md ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80"
                }`}
              >
                <div
                  className={`p-3 rounded-xl shrink-0 transition-colors ${
                    tipo === "paralizacion"
                      ? "bg-[#0038A8] text-white"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <PauseCircle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#0B1938]">
                      Paralización / Desparalización
                    </span>
                    {tipo === "paralizacion" && (
                      <Check className="w-4 h-4 text-[#0038A8]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Suspensión formal de los plazos por causales de fuerza mayor y posterior reinicio con balance de días netos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: ÍTEMS NUEVOS (CONDICIONAL PARA VOLUMEN) */}
        {pasoActual === 2 && requierePasoItemsNuevos && (
          <div
            key="paso-2"
            className="space-y-6 transition-all duration-500 ease-in-out opacity-100 transform translate-y-0 animate-in fade-in slide-in-from-right-4"
          >
            <div>
              <h4 className="text-lg font-extrabold text-[#0B1938]">
                ¿La alteración incorpora Ítems Nuevos no previstos en el cómputo original?
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                La creación de ítems nuevos exige el análisis de precios unitarios desglosado y la aplicación del coeficiente de pase contractual.
              </p>
            </div>

            {/* Toggle Card */}
            <div
              onClick={() => setItemsNuevos(!itemsNuevos)}
              className={`p-6 rounded-3xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between gap-6 hover:-translate-y-0.5 hover:shadow-md ${
                itemsNuevos
                  ? "border-[#0038A8] bg-blue-50/40 shadow-md ring-2 ring-blue-500/10"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="space-y-1">
                <span className="text-sm font-extrabold text-[#0B1938] block">
                  {itemsNuevos
                    ? "SÍ, incorpora Ítems Nuevos fuera del pliego original"
                    : "NO, solo modifica volúmenes de ítems contractuales existentes"}
                </span>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                  {itemsNuevos
                    ? "Se requerirá el Informe de Análisis de Precios Unitarios firmado por la Inspección y la conformidad de la contratista con el Coeficiente de Pase (k)."
                    : "Solo se alteran cantidades en más o en menos de ítems que ya contaban con precio unitario básico en la oferta adjudicada."}
                </p>
              </div>

              {/* Switch Visual */}
              <div
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  itemsNuevos ? "bg-[#0038A8]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    itemsNuevos ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </div>
            </div>

            {itemsNuevos && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Requisito normativo:</strong> Los precios de ítems nuevos deben formularse al mes base de la licitación original para no generar distorsiones frente a las fórmulas de redeterminación.
                </p>
              </div>
            )}
          </div>
        )}

        {/* PASO 3: MODALIDAD ADMINISTRATIVA */}
        {pasoActual === 3 && requierePasoModalidad && (
          <div
            key="paso-3"
            className="space-y-6 transition-all duration-500 ease-in-out opacity-100 transform translate-y-0 animate-in fade-in slide-in-from-right-4"
          >
            <div>
              <h4 className="text-lg font-extrabold text-[#0B1938]">
                ¿Cuál es la modalidad administrativa del trámite?
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                El estado de avance físico y la vigencia temporal determinan la documentación probatoria requerida.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opción A: Por Aprobación Previa */}
              <div
                onClick={() => setModalidad("aprobacion")}
                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md ${
                  modalidad === "aprobacion"
                    ? "border-[#0038A8] bg-blue-50/50 shadow-md ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Obra en curso
                    </span>
                    {modalidad === "aprobacion" && (
                      <Check className="w-4 h-4 text-[#0038A8]" />
                    )}
                  </div>
                  <h5 className="font-bold text-base text-[#0B1938] mb-1.5">
                    Por Aprobación Previa
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Corresponde cuando la obra se encuentra en pleno desarrollo y el plazo contractual está vigente al día.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-700">Competencia:</span> Decreto o Resolución según delegación de facultades.
                </div>
              </div>

              {/* Opción B: Por Convalidación Posterior */}
              <div
                onClick={() => setModalidad("convalidacion")}
                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md ${
                  modalidad === "convalidacion"
                    ? "border-[#0038A8] bg-blue-50/50 shadow-md ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      Hecho consumado
                    </span>
                    {modalidad === "convalidacion" && (
                      <Check className="w-4 h-4 text-[#0038A8]" />
                    )}
                  </div>
                  <h5 className="font-bold text-base text-[#0B1938] mb-1.5">
                    Por Convalidación Posterior
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Corresponde con carácter obligatorio si la fecha de finalización o vencimiento contractual de la obra ya se cumplió.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-purple-900 font-semibold">
                  Competencia exclusiva: Decreto del Órgano Ejecutivo Municipal.
                </div>
              </div>
            </div>

            {/* 2. Cuadro de Alerta Procesal Destacado de Alty */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50/95 via-orange-50/90 to-red-50/80 border-2 border-amber-500/90 text-slate-800 space-y-2 shadow-xs animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-300 p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/alty.png"
                    alt="Alty"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FF7A00] block">
                    Alerta de Alty
                  </span>
                  <div className="text-amber-950 font-black text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>OBSERVACIÓN CRÍTICA DE PLAZOS:</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium pl-1 sm:pl-12">
                Si la obra está próxima a su vencimiento, se recomienda tramitar el expediente con máxima celeridad. Si el plazo contractual vence mientras el expediente está en curso bajo la modalidad de aprobación, la tramitación se retrotrae para reconvertirse en convalidación, lo que exige renovar la documentación e incorporar obligatoriamente el <strong>Acta de Recepción Provisoria</strong> y la <strong>Foja de Medición Final</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Barra de navegación inferior */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <div>
          {pasoActual > 1 && (
            <button
              type="button"
              onClick={handleRetroceder}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleAvanzar}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0038A8] hover:bg-[#002b80] text-white text-xs font-bold shadow-md shadow-blue-900/10 hover:scale-[1.01] transition-all cursor-pointer"
        >
          {tipo === "paralizacion" || pasoActual === 3 ? (
            <>
              <Sparkles className="w-4 h-4 text-[#00B4D8]" />
              Ver Diagnóstico y Requisitos &rarr;
            </>
          ) : (
            <>
              Continuar al siguiente paso
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
