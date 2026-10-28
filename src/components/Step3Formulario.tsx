"use strict";

import React, { useState, useEffect } from "react";
import {
  AdendaData,
  VariacionAnterior,
  TipoAlteracionAnterior,
  OPCIONES_REPRESENTANTE_MUNICIPAL,
  calcularValoresAdenda,
  calcularDiasEntreFechas,
  TIPOS_MODALIDAD_CONTRATO,
  TipoModalidadContrato,
  parseModalidadContrato,
  ensamblarModalidadContrato,
  TIPOS_NORMA_LEGAL,
  TipoNormaLegal,
  parseNormaLegal,
  ensamblarNormaLegal,
  parseExpedientePartes,
  ensamblarExpediente,
  obtenerFechaBaseCalculo,
  TipoComunicacionObra,
  ComunicacionObra,
  reformularComunicacionLegal,
} from "@/lib/adendaGenerator";
import {
  formatearMoneda,
  montoALetras,
  diasALetras,
  calcularVtoOriginal,
  formatearFechaCorta,
  formatearFechaTexto,
  sumarDias,
} from "@/lib/formatters";
import {
  Building2,
  FileSpreadsheet,
  Layers,
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  History,
  Calculator,
  HelpCircle,
  Scale,
  FileText,
  Calendar,
  MessageSquareQuote,
  Loader2,
} from "lucide-react";

interface NormaLegalFieldProps {
  label: string;
  sublabel?: string;
  tipoActual?: string;
  numeroActual?: string;
  valorFallback?: string;
  defaultTipo?: TipoNormaLegal;
  placeholder?: string;
  borderTheme?: "default" | "amber";
  onChange: (tipo: string, numero: string, completo: string) => void;
}

function NormaLegalField({
  label,
  sublabel,
  tipoActual,
  numeroActual,
  valorFallback,
  defaultTipo = "Decreto",
  placeholder = "ej. 0342/2024",
  borderTheme = "default",
  onChange,
}: NormaLegalFieldProps) {
  const parsed = parseNormaLegal(valorFallback, defaultTipo);
  const tipo = tipoActual || parsed.tipo || defaultTipo;
  const numero = numeroActual !== undefined ? numeroActual : parsed.numero;

  const handleTipoChange = (newTipo: string) => {
    const ensamblado = ensamblarNormaLegal(newTipo, numero);
    onChange(newTipo, numero, ensamblado);
  };

  const handleNumeroChange = (newNum: string) => {
    const ensamblado = ensamblarNormaLegal(tipo, newNum);
    onChange(tipo, newNum, ensamblado);
  };

  const isAmber = borderTheme === "amber";

  return (
    <div>
      <label
        className={`block font-semibold mb-1 ${
          isAmber ? "text-[11px] font-bold text-amber-900" : "text-xs text-slate-700"
        }`}
      >
        {label}
      </label>
      <div className="grid grid-cols-12 gap-1.5">
        <div className="col-span-5 sm:col-span-5">
          <select
            value={tipo}
            onChange={(e) => handleTipoChange(e.target.value)}
            className={`w-full px-2.5 py-2 text-xs rounded-xl border bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 ${
              isAmber
                ? "border-amber-200 focus:ring-amber-500/20 focus:border-amber-600"
                : "border-slate-200 focus:ring-blue-500/20 focus:border-[#0038A8]"
            }`}
          >
            {TIPOS_NORMA_LEGAL.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-7 sm:col-span-7">
          <div
            className={`inline-flex items-center w-full rounded-xl border bg-white shadow-2xs overflow-hidden focus-within:ring-2 ${
              isAmber
                ? "border-amber-200 focus-within:ring-amber-500/20 focus-within:border-amber-600"
                : "border-slate-200 focus-within:ring-blue-500/20 focus-within:border-[#0038A8]"
            }`}
          >
            <span
              className={`px-2.5 py-2 border-r font-bold text-xs select-none ${
                isAmber
                  ? "bg-amber-100/60 border-amber-200 text-amber-800"
                  : "bg-slate-100 border-slate-200 text-slate-600"
              }`}
            >
              N°
            </span>
            <input
              type="text"
              value={numero}
              onChange={(e) => handleNumeroChange(e.target.value)}
              placeholder={placeholder}
              className="w-full min-w-0 px-2.5 py-2 text-xs bg-transparent focus:outline-none font-semibold text-[#0B1938]"
            />
          </div>
        </div>
      </div>
      <span
        className={`mt-1 block ${
          isAmber ? "text-[10px] text-amber-700" : "text-[10px] text-slate-500"
        }`}
      >
        {sublabel || "Texto oficial:"}{" "}
        <strong className={isAmber ? "text-amber-900" : "text-[#0038A8]"}>
          {ensamblarNormaLegal(tipo, numero) || `${defaultTipo} N° ...`}
        </strong>
      </span>
    </div>
  );
}

interface ExpedienteAlcanceFieldsProps {
  expedienteNumero?: string;
  expedienteAnio?: string;
  expedienteFallback?: string;
  alcance?: string;
  alcancePlaceholder?: string;
  labelExpediente?: string;
  labelAlcance?: string;
  helpText?: string;
  compact?: boolean;
  onChange: (patch: {
    expedienteNumero: string;
    expedienteAnio: string;
    expediente: string;
    alcance: string;
  }) => void;
}

function ExpedienteAlcanceFields({
  expedienteNumero,
  expedienteAnio,
  expedienteFallback,
  alcance = "",
  alcancePlaceholder = "ej. 02/2025",
  labelExpediente = "N° de Expediente Municipal *",
  labelAlcance = "Alcance *",
  helpText,
  compact = false,
  onChange,
}: ExpedienteAlcanceFieldsProps) {
  const parsed = parseExpedientePartes(expedienteFallback);
  const num = expedienteNumero !== undefined ? expedienteNumero : parsed.numero;
  const yr = expedienteAnio !== undefined ? expedienteAnio : parsed.anio;

  const handleNumChange = (newNum: string) => {
    const ensamblado = ensamblarExpediente(newNum, yr);
    onChange({
      expedienteNumero: newNum,
      expedienteAnio: yr,
      expediente: ensamblado,
      alcance,
    });
  };

  const handleYrChange = (newYr: string) => {
    const ensamblado = ensamblarExpediente(num, newYr);
    onChange({
      expedienteNumero: num,
      expedienteAnio: newYr,
      expediente: ensamblado,
      alcance,
    });
  };

  const handleAlcanceChange = (newAlc: string) => {
    const ensamblado = ensamblarExpediente(num, yr);
    onChange({
      expedienteNumero: num,
      expedienteAnio: yr,
      expediente: ensamblado,
      alcance: newAlc,
    });
  };

  const expVisual = ensamblarExpediente(num, yr);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
      {/* Expediente Compuesto: [ OE ] - [ Num ] - [ -M- ] - [ Año ] */}
      <div className="sm:col-span-8">
        <label
          className={`block font-semibold text-slate-700 mb-1 ${
            compact ? "text-[11px]" : "text-xs"
          }`}
        >
          {labelExpediente}
        </label>
        <div className="inline-flex items-center w-full rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-[#0038A8]">
          <span className="px-3 py-2 bg-slate-100 border-r border-slate-200 text-slate-700 font-extrabold text-xs select-none">
            OE
          </span>
          <input
            type="text"
            value={num}
            onChange={(e) => handleNumChange(e.target.value)}
            placeholder="ej. 4250"
            className={`w-full min-w-0 px-3 py-2 bg-transparent focus:outline-none font-semibold text-[#0B1938] ${
              compact ? "text-xs" : "text-sm"
            }`}
          />
          <span className="px-2.5 py-2 bg-slate-100 border-x border-slate-200 text-slate-600 font-bold text-xs select-none">
            -M-
          </span>
          <input
            type="text"
            maxLength={4}
            value={yr}
            onChange={(e) => handleYrChange(e.target.value)}
            placeholder="2026"
            className={`w-20 px-2 py-2 bg-transparent focus:outline-none font-semibold text-[#0B1938] text-center ${
              compact ? "text-xs" : "text-sm"
            }`}
          />
        </div>
        <span className="text-[11px] text-slate-400 mt-1 block">
          Formato Word:{" "}
          <strong className="text-[#0038A8]">{expVisual || "OE ____-M-____"}</strong>
          {helpText ? ` • ${helpText}` : ""}
        </span>
      </div>

      {/* Alcance Compuesto: [ Alcance: ] [ Input ] */}
      <div className="sm:col-span-4">
        <label
          className={`block font-semibold text-slate-700 mb-1 ${
            compact ? "text-[11px]" : "text-xs"
          }`}
        >
          {labelAlcance}
        </label>
        <div className="inline-flex items-center w-full rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-[#0038A8]">
          <span className="px-3 py-2 bg-slate-100 border-r border-slate-200 text-slate-600 font-bold text-xs select-none whitespace-nowrap">
            Alcance:
          </span>
          <input
            type="text"
            value={alcance}
            onChange={(e) => handleAlcanceChange(e.target.value)}
            placeholder={alcancePlaceholder}
            className={`w-full min-w-0 px-3 py-2 bg-transparent focus:outline-none font-semibold text-[#0B1938] ${
              compact ? "text-xs" : "text-sm"
            }`}
          />
        </div>
        <span className="text-[11px] text-slate-400 mt-1 block">
          Ej: 0, 01/2025, 02/2026
        </span>
      </div>
    </div>
  );
}

interface Step3Props {
  data: AdendaData;
  onChange: (patch: Partial<AdendaData>) => void;
  onPrev: () => void;
  onLoadDemo: () => void;
  onOpenCaratula?: () => void;
}

export default function Step3Formulario({
  data,
  onChange,
  onPrev,
  onLoadDemo,
  onOpenCaratula,
}: Step3Props) {
  const calc = calcularValoresAdenda(data);
  const [showVariacionesPrevias, setShowVariacionesPrevias] = useState(
    Boolean(data.variacionesAnteriores && data.variacionesAnteriores.length > 0)
  );

  // Sincronizar automáticamente fecha de vencimiento original según la Fecha Base definida por "Cómputo a partir de"
  useEffect(() => {
    const fechaBase = obtenerFechaBaseCalculo(
      data.aPartirDe,
      data.fechaContrato,
      data.fechaReplanteo
    );
    if (fechaBase && data.plazoOriginalDias > 0) {
      const vtoCalc = calcularVtoOriginal(fechaBase, data.plazoOriginalDias);
      if (vtoCalc && vtoCalc !== data.fechaVtoOriginal) {
        onChange({ fechaVtoOriginal: vtoCalc });
      }
    }
  }, [data.aPartirDe, data.fechaContrato, data.fechaReplanteo, data.plazoOriginalDias]);

  // Sincronizar automáticamente fecha de vencimiento resultante
  useEffect(() => {
    if (
      calc.fechaVtoNuevaCalculada &&
      data.fechaVtoNueva !== calc.fechaVtoNuevaCalculada
    ) {
      onChange({ fechaVtoNueva: calc.fechaVtoNuevaCalculada });
    }
  }, [calc.fechaVtoNuevaCalculada]);

  // Manejo de selección de Representante Municipal
  const handleSelectRepMun = (opcionId: string) => {
    const selected = OPCIONES_REPRESENTANTE_MUNICIPAL.find((o) => o.id === opcionId);
    if (selected) {
      onChange({
        repMunId: selected.id,
        repMun: selected.textoLegal,
      });
    }
  };

  // Manejo de Variaciones Anteriores
  const handleAddVariacionAnterior = () => {
    const list = data.variacionesAnteriores || [];
    const nextNum = list.length + 1;
    const baseExp = parseExpedientePartes(data.expediente);
    const expNum = data.expedienteNumero || baseExp.numero || "";
    const expYr = data.expedienteAnio || baseExp.anio || "";
    const expStr = ensamblarExpediente(expNum, expYr) || data.expediente || "";

    const nueva: VariacionAnterior = {
      id: String(Date.now()),
      nroVariacion: `Variación ${nextNum}`,
      expediente: expStr,
      expedienteNumero: expNum,
      expedienteAnio: expYr,
      alcance: "",
      tipoAlteracion: "Ampliación de Plazo",
      normaLegal: "",
      normaLegalTipo: "Decreto",
      normaLegalNumero: "",
      fechaNorma: "",
      diasAmpliacion: 0,
      montoAumento: 0,
      montoDisminucion: 0,
      normaParalizacion: "",
      normaParalizacionTipo: "Disposición",
      normaParalizacionNumero: "",
      primerDiaParalizacion: "",
      normaReanudacion: "",
      normaReanudacionTipo: "Disposición",
      normaReanudacionNumero: "",
      fechaReanudacion: "",
      diasParalizacionNetos: 0,
    };
    onChange({ variacionesAnteriores: [...list, nueva] });
  };

  const handleUpdateVariacionAnterior = (
    id: string,
    patch: Partial<VariacionAnterior>
  ) => {
    const list = data.variacionesAnteriores || [];
    const updated = list.map((item) => (item.id === id ? { ...item, ...patch } : item));
    onChange({ variacionesAnteriores: updated });
  };

  const handleRemoveVariacionAnterior = (id: string) => {
    const list = data.variacionesAnteriores || [];
    onChange({ variacionesAnteriores: list.filter((item) => item.id !== id) });
  };

  const [formattingId, setFormattingId] = useState<string | null>(null);

  const handleAddComunicacion = () => {
    const list = data.comunicacionesObra || [];
    const nextNum = list.length + 1;
    const newCom: ComunicacionObra = {
      id: `com-${Date.now()}`,
      tipo: nextNum % 2 === 1 ? "Nota de Pedido" : "Orden de Servicio",
      numero: String(nextNum),
      textoOriginal: "",
      textoConsiderando: "",
    };
    onChange({ comunicacionesObra: [...list, newCom] });
  };

  const handleUpdateComunicacion = (
    id: string,
    partial: Partial<ComunicacionObra>
  ) => {
    const list = data.comunicacionesObra || [];
    onChange({
      comunicacionesObra: list.map((item) =>
        item.id === id ? { ...item, ...partial } : item
      ),
    });
  };

  const handleRemoveComunicacion = (id: string) => {
    const list = data.comunicacionesObra || [];
    onChange({ comunicacionesObra: list.filter((item) => item.id !== id) });
  };

  const handleFormatWithAI = async (id: string) => {
    const list = data.comunicacionesObra || [];
    const com = list.find((item) => item.id === id);
    if (!com) return;

    setFormattingId(id);
    try {
      const response = await fetch("/api/format-comunicacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: com.tipo,
          numero: com.numero,
          textoOriginal: com.textoOriginal,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.textoConsiderando) {
          handleUpdateComunicacion(id, {
            textoConsiderando: json.textoConsiderando,
          });
          return;
        }
      }
      const localReformulado = reformularComunicacionLegal(
        com.tipo,
        com.numero,
        com.textoOriginal
      );
      handleUpdateComunicacion(id, { textoConsiderando: localReformulado });
    } catch (err) {
      console.warn("Fallback to client-side reformulator:", err);
      const localReformulado = reformularComunicacionLegal(
        com.tipo,
        com.numero,
        com.textoOriginal
      );
      handleUpdateComunicacion(id, { textoConsiderando: localReformulado });
    } finally {
      setFormattingId(null);
    }
  };

  // Labels adaptativos según Modalidad
  const labelFechaCulminacion =
    data.modalidad === "Convalidación"
      ? "Fecha de Finalización Efectiva"
      : "Nueva Fecha Prevista";

  const placeholderFechaCulminacion =
    data.modalidad === "Convalidación"
      ? "Fecha en la que efectivamente concluyeron los trabajos"
      : "Fecha proyectada o estimada para culminar la obra";

  const esConvalidacion = data.modalidad === "Convalidación";
  const placeholderNroCuadro = esConvalidacion ? "FINAL" : "Ej: 1";

  return (
    <div className="space-y-6">
      {/* Encabezado del paso */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-[#0038A8] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Paso 3 de 3
          </span>
          <h2 className="text-2xl font-bold text-[#0B1938] mt-2">
            Carga de Datos de la Adenda y Control
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Formulario unificado con la lógica técnica y de seguimiento de la planilla oficial de control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCaratula && (
            <button
              type="button"
              onClick={onOpenCaratula}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition-colors shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-300" />
              Ver Carátula de Control
            </button>
          )}

          <button
            type="button"
            onClick={onLoadDemo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0038A8] border border-blue-200 transition-colors shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00B4D8]" />
            Cargar datos de ejemplo
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* SECCIÓN 1: IDENTIFICACIÓN DE LA OBRA Y CONTRATO ORIGINAL */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#0038A8]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0B1938] text-base">
                SECCIÓN 1: Identificación de la Obra y Contrato Original
              </h3>
              <p className="text-xs text-slate-500">
                Información técnica del contrato, partes intervinientes y cómputos originales.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Nombre de la Obra */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre Oficial de la Obra *
              </label>
              <textarea
                rows={2}
                value={data.obra}
                onChange={(e) => onChange({ obra: e.target.value })}
                placeholder="Ej: PAVIMENTACIÓN Y DESAGÜES PLUVIALES EN B° SAN LORENZO"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-slate-50/50"
              />
            </div>

            {/* Empresa Contratista */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Empresa Contratista *
              </label>
              <input
                type="text"
                value={data.empresa}
                onChange={(e) => onChange({ empresa: e.target.value })}
                placeholder="Ej: NEUQUÉN VIAL Y CONSTRUCCIONES S.A."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-slate-50/50"
              />
            </div>

            {/* CUIT */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                C.U.I.T. de la Empresa *
              </label>
              <input
                type="text"
                value={data.cuit}
                onChange={(e) => onChange({ cuit: e.target.value })}
                placeholder="Ej: 30-71458921-9"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-slate-50/50"
              />
            </div>

            {/* Representante Legal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Representante Legal de la Empresa *
              </label>
              <input
                type="text"
                value={data.repL}
                onChange={(e) => onChange({ repL: e.target.value })}
                placeholder="Ej: Carlos Alberto Fernández"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-slate-50/50"
              />
            </div>

            {/* Cargo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo del Representante Legal *
              </label>
              <input
                type="text"
                value={data.cargoRepL}
                onChange={(e) => onChange({ cargoRepL: e.target.value })}
                placeholder="Ej: Presidente / Socio Gerente / Apoderado"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-slate-50/50"
              />
            </div>

            {/* DNI */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                D.N.I. del Representante Legal *
              </label>
              <input
                type="text"
                value={data.dniRepL}
                onChange={(e) => onChange({ dniRepL: e.target.value })}
                placeholder="Ej: 22.345.678"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-slate-50/50"
              />
            </div>

            {/* 1. REPRESENTANTE MUNICIPAL (SELECTOR CON TEXTO LEGAL AUTOMÁTICO) */}
            <div className="md:col-span-2 lg:col-span-3 bg-blue-50/40 p-3.5 rounded-xl border border-blue-200">
              <label className="block text-xs font-bold text-[#0038A8] mb-1.5 flex items-center justify-between">
                <span>Representante Municipal Firmante *</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Inyecta automáticamente el texto legal del decreto
                </span>
              </label>
              <select
                value={data.repMunId || (data.repMun.includes("DEN HARTOG") ? "viviana" : "alejandro")}
                onChange={(e) => handleSelectRepMun(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-white font-medium text-slate-800 mb-2"
              >
                {OPCIONES_REPRESENTANTE_MUNICIPAL.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.nombreCorto}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-blue-100 italic">
                <strong>Texto legal a insertar:</strong> &quot;{data.repMun || OPCIONES_REPRESENTANTE_MUNICIPAL[0].textoLegal}&quot;
              </p>
            </div>

            {/* Fecha de Firma del Contrato */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de Firma del Contrato *
              </label>
              <input
                type="date"
                value={data.fechaContrato}
                onChange={(e) => onChange({ fechaContrato: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-slate-50/50"
              />
            </div>

            {/* Norma Legal de Adjudicación (Desacoplada) */}
            <NormaLegalField
              label="Norma Legal de Adjudicación *"
              sublabel="Inyecta en «Norma_Adj»:"
              tipoActual={data.normaAdjTipo}
              numeroActual={data.normaAdjNumero}
              valorFallback={data.normaAdj}
              defaultTipo="Decreto"
              placeholder="ej. 0342/2024"
              onChange={(tipo, numero, completo) =>
                onChange({
                  normaAdjTipo: tipo,
                  normaAdjNumero: numero,
                  normaAdj: completo,
                })
              }
            />

            {/* Fecha de Norma Legal de Adjudicación (Excel) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de Norma de Adjudicación
              </label>
              <input
                type="date"
                value={data.fechaNormaAdj || ""}
                onChange={(e) => onChange({ fechaNormaAdj: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-slate-50/50"
              />
            </div>

            {/* Modalidad de Contratación (Desacoplada) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Modalidad de Contratación *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <select
                    value={
                      data.modalidadContratoTipo ||
                      parseModalidadContrato(data.modalidadContrato).tipo
                    }
                    onChange={(e) => {
                      const nuevoTipo = e.target.value;
                      const num =
                        data.modalidadContratoNumero !== undefined
                          ? data.modalidadContratoNumero
                          : parseModalidadContrato(data.modalidadContrato).numero;
                      const ensamblado = ensamblarModalidadContrato(nuevoTipo, num);
                      onChange({
                        modalidadContratoTipo: nuevoTipo,
                        modalidadContratoNumero: num,
                        modalidadContrato: ensamblado,
                      });
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8]"
                  >
                    {TIPOS_MODALIDAD_CONTRATO.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-6">
                  <div className="inline-flex items-center w-full rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-[#0038A8]">
                    <span className="px-3 py-2 bg-slate-100 border-r border-slate-200 text-slate-600 font-bold text-xs select-none">
                      N°
                    </span>
                    <input
                      type="text"
                      value={
                        data.modalidadContratoNumero !== undefined
                          ? data.modalidadContratoNumero
                          : parseModalidadContrato(data.modalidadContrato).numero
                      }
                      onChange={(e) => {
                        const nuevoNum = e.target.value;
                        const tipo =
                          data.modalidadContratoTipo ||
                          parseModalidadContrato(data.modalidadContrato).tipo;
                        const ensamblado = ensamblarModalidadContrato(tipo, nuevoNum);
                        onChange({
                          modalidadContratoTipo: tipo,
                          modalidadContratoNumero: nuevoNum,
                          modalidadContrato: ensamblado,
                        });
                      }}
                      placeholder="ej. 08/2023 o 01/2026"
                      className="w-full min-w-0 px-3 py-2 text-sm bg-transparent focus:outline-none font-semibold text-[#0B1938]"
                    />
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Inyecta en «Modalidad»:{" "}
                <strong className="text-[#0038A8]">
                  {ensamblarModalidadContrato(
                    data.modalidadContratoTipo ||
                      parseModalidadContrato(data.modalidadContrato).tipo,
                    data.modalidadContratoNumero !== undefined
                      ? data.modalidadContratoNumero
                      : parseModalidadContrato(data.modalidadContrato).numero
                  ) || "Licitación Pública N° ..."}
                </strong>
              </span>
            </div>

            {/* Inspector de Obra (Excel) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inspector de Obra
              </label>
              <input
                type="text"
                value={data.inspectorObra || ""}
                onChange={(e) => onChange({ inspectorObra: e.target.value })}
                placeholder="Ej: Ing. Mario Gómez"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-slate-50/50"
              />
            </div>

            {/* Representante Técnico (Excel) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Representante Técnico
              </label>
              <input
                type="text"
                value={data.representanteTecnico || ""}
                onChange={(e) => onChange({ representanteTecnico: e.target.value })}
                placeholder="Ej: Ing. Jorge Rossi"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-slate-50/50"
              />
            </div>

            {/* Fecha de Acta de Replanteo (Inicio) (Excel) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de Acta de Replanteo (Inicio) *
              </label>
              <input
                type="date"
                value={data.fechaReplanteo || ""}
                onChange={(e) => onChange({ fechaReplanteo: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-slate-50/50"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Fecha del acta de replanteo e inicio de obra.
              </span>
            </div>

            {/* Monto Original de Contrato */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monto Original del Contrato *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.montoOriginal || ""}
                  onChange={(e) =>
                    onChange({ montoOriginal: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-slate-50/50 font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 italic">
                {formatearMoneda(data.montoOriginal)} &bull; {montoALetras(data.montoOriginal, true)}
              </p>
            </div>

            {/* Cómputo de Plazos a partir de */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cómputo de Plazos a partir de *
              </label>
              <select
                value={data.aPartirDe || "Acta de Replanteo"}
                onChange={(e) => onChange({ aPartirDe: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-blue-50/20 font-medium text-slate-800"
              >
                <option value="Firma del Contrato">Firma del Contrato</option>
                <option value="Acta de Replanteo">Acta de Replanteo</option>
              </select>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Fecha Base activa:{" "}
                <strong className="text-[#0038A8]">
                  {formatearFechaCorta(calc.fechaBaseCalculo) !== "-"
                    ? `${formatearFechaCorta(calc.fechaBaseCalculo)} (${
                        data.aPartirDe === "Contrato" ||
                        data.aPartirDe === "Firma del Contrato"
                          ? "Firma Contrato"
                          : "Acta Replanteo"
                      })`
                    : "No ingresada"}
                </strong>
              </span>
            </div>

            {/* Plazo Original en Días Corridos */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plazo Original de Ejecución (Días Corridos) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={data.plazoOriginalDias || ""}
                onChange={(e) =>
                  onChange({
                    plazoOriginalDias: parseInt(e.target.value, 10) || 0,
                  })
                }
                placeholder="Ej: 180"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-slate-50/50 font-medium"
              />
              <p className="text-[11px] text-slate-500 mt-1 italic">
                {diasALetras(data.plazoOriginalDias)} DÍAS CORRIDOS
              </p>
            </div>

            {/* Fecha Vencimiento Original Calculada */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Fecha Vto. Original (Calculada)</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                  Base + Plazo - 1 d
                </span>
              </label>
              <input
                type="text"
                readOnly
                value={
                  calc.fechaVtoOriginal
                    ? `${formatearFechaCorta(calc.fechaVtoOriginal)} (${calc.fechaVtoOriginal})`
                    : `Requiere ${
                        data.aPartirDe === "Contrato" ||
                        data.aPartirDe === "Firma del Contrato"
                          ? "Fecha de Contrato"
                          : "Fecha de Replanteo"
                      } y Plazo`
                }
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-blue-200 bg-blue-50/30 font-bold text-[#0038A8] cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Calculada dinámicamente según la Fecha Base seleccionada.
              </span>
            </div>
          </div>

          {/* SUBSECCIÓN COLAPSABLE: VARIACIONES CONTRACTUALES ANTERIORES */}
          <div className="pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowVariacionesPrevias(!showVariacionesPrevias)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#0038A8]" />
                <span className="font-bold text-xs text-[#0B1938]">
                  Historial de Variaciones Contractuales Anteriores (Opcional - Excel)
                </span>
                {data.variacionesAnteriores && data.variacionesAnteriores.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#0038A8]">
                    {data.variacionesAnteriores.length} registradas
                  </span>
                )}
              </div>
              <div className="text-slate-400">
                {showVariacionesPrevias ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {showVariacionesPrevias && (
              <div className="mt-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-600">
                  <p>
                    Registre las alteraciones previas en orden cronológico. El sistema encadena automáticamente los cálculos fila por fila y redacta los párrafos de <strong>CONSIDERANDO</strong> correspondientes.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddVariacionAnterior}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0038A8] text-white rounded-lg font-bold text-xs hover:bg-[#002b80] transition-colors shrink-0 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Variación
                  </button>
                </div>

                {(!data.variacionesAnteriores || data.variacionesAnteriores.length === 0) ? (
                  <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                    No se han registrado variaciones anteriores. El Estado Previo toma directamente las condiciones originales del contrato.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.variacionesAnteriores.map((v, index) => {
                      const row = calc.estadoPrevio.rows[index];
                      const tipo = v.tipoAlteracion || "Ampliación de Plazo";
                      const incluyePlazo =
                        tipo === "Ampliación de Plazo" ||
                        tipo === "Ampliación de Plazo y Volumen";
                      const incluyeVolumen =
                        tipo === "Modificación de Volumen" ||
                        tipo === "Ampliación de Plazo y Volumen";
                      const esParalizacion =
                        tipo === "Paralización / Desparalización";

                      const diasNetosParalizacion =
                        v.primerDiaParalizacion && v.fechaReanudacion
                          ? calcularDiasEntreFechas(
                              v.primerDiaParalizacion,
                              v.fechaReanudacion
                            )
                          : Number(v.diasParalizacionNetos || v.diasParalizacion) || 0;

                      return (
                        <div
                          key={v.id}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs"
                        >
                          {/* Cabecera de la tarjeta: Título, Selector de Tipo y Eliminar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#0038A8] text-white">
                                #{index + 1}
                              </span>
                              <input
                                type="text"
                                value={v.nroVariacion || `Variación ${index + 1}`}
                                onChange={(e) =>
                                  handleUpdateVariacionAnterior(v.id, {
                                    nroVariacion: e.target.value,
                                  })
                                }
                                className="font-bold text-slate-800 text-xs px-2 py-1 border border-transparent hover:border-slate-300 focus:border-[#0038A8] rounded-md bg-transparent"
                                placeholder={`Variación ${index + 1}`}
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                                Tipo de Alteración:
                              </label>
                              <select
                                value={tipo}
                                onChange={(e) =>
                                  handleUpdateVariacionAnterior(v.id, {
                                    tipoAlteracion: e.target.value as TipoAlteracionAnterior,
                                  })
                                }
                                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] text-[#0038A8]"
                              >
                                <option value="Ampliación de Plazo">
                                  1. Ampliación de Plazo
                                </option>
                                <option value="Modificación de Volumen">
                                  2. Modificación de Volumen (Aumento / Disminución)
                                </option>
                                <option value="Ampliación de Plazo y Volumen">
                                  3. Ampliación de Plazo y Volumen
                                </option>
                                <option value="Paralización / Desparalización">
                                  4. Paralización / Desparalización
                                </option>
                              </select>

                              <button
                                type="button"
                                onClick={() => handleRemoveVariacionAnterior(v.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-1"
                                title="Eliminar variación"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Campos de Identificación: Expediente y Alcance */}
                          <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                            <ExpedienteAlcanceFields
                              expedienteNumero={v.expedienteNumero}
                              expedienteAnio={v.expedienteAnio}
                              expedienteFallback={v.expediente || data.expediente}
                              alcance={v.alcance}
                              alcancePlaceholder="ej. 01/2024"
                              labelExpediente="Expediente de la Alteración:"
                              labelAlcance="Alcance:"
                              helpText="Modifíquelo si tramitó por expediente propio"
                              compact={true}
                              onChange={({
                                expedienteNumero,
                                expedienteAnio,
                                expediente,
                                alcance,
                              }) =>
                                handleUpdateVariacionAnterior(v.id, {
                                  expedienteNumero,
                                  expedienteAnio,
                                  expediente,
                                  alcance,
                                })
                              }
                            />
                          </div>

                          {/* Campos Condicionales según el Tipo Elegido */}
                          {!esParalizacion && (
                            <div className="space-y-3">
                              {/* Norma Legal y Fecha de Norma */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <NormaLegalField
                                    label="Norma Legal de Alteración:"
                                    sublabel="Inyecta:"
                                    tipoActual={v.normaLegalTipo}
                                    numeroActual={v.normaLegalNumero}
                                    valorFallback={v.normaLegal || v.normaExpediente}
                                    defaultTipo="Decreto"
                                    placeholder="ej. 0512/2026"
                                    onChange={(tipo, numero, completo) =>
                                      handleUpdateVariacionAnterior(v.id, {
                                        normaLegalTipo: tipo,
                                        normaLegalNumero: numero,
                                        normaLegal: completo,
                                        normaExpediente: completo,
                                      })
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Fecha de Norma Legal:
                                  </label>
                                  <input
                                    type="date"
                                    value={v.fechaNorma || ""}
                                    onChange={(e) =>
                                      handleUpdateVariacionAnterior(v.id, {
                                        fechaNorma: e.target.value,
                                      })
                                    }
                                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#0038A8]"
                                  />
                                </div>
                              </div>

                              {/* Parámetros de Plazo y/o Volumen */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                                {incluyePlazo && (
                                  <div className={incluyeVolumen ? "" : "sm:col-span-3"}>
                                    <label className="block text-[11px] font-bold text-blue-800 mb-1">
                                      Plazo (+) Días:
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={v.diasAmpliacion || ""}
                                      onChange={(e) =>
                                        handleUpdateVariacionAnterior(v.id, {
                                          diasAmpliacion:
                                            parseInt(e.target.value, 10) || 0,
                                        })
                                      }
                                      className="w-full px-2.5 py-1.5 border border-blue-200 bg-blue-50/30 rounded-lg text-xs font-semibold text-blue-900 focus:outline-none focus:border-[#0038A8]"
                                      placeholder="0"
                                    />
                                    <span className="text-[10px] text-blue-700 mt-0.5 block italic">
                                      Equivale a: {diasALetras(v.diasAmpliacion)} DÍAS
                                    </span>
                                  </div>
                                )}

                                {incluyeVolumen && (
                                  <>
                                    <div className={incluyePlazo ? "" : "sm:col-span-1"}>
                                      <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                                        Modif. (+) $:
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={v.montoAumento || ""}
                                        onChange={(e) =>
                                          handleUpdateVariacionAnterior(v.id, {
                                            montoAumento:
                                              parseFloat(e.target.value) || 0,
                                          })
                                        }
                                        className="w-full px-2.5 py-1.5 border border-emerald-300 bg-emerald-50/30 rounded-lg text-xs font-bold text-emerald-800 focus:outline-none focus:border-emerald-600"
                                        placeholder="0.00"
                                      />
                                      <span className="text-[10px] text-emerald-700 mt-0.5 block">
                                        {formatearMoneda(v.montoAumento)}
                                      </span>
                                    </div>

                                    <div className={incluyePlazo ? "" : "sm:col-span-1"}>
                                      <label className="block text-[11px] font-bold text-amber-800 mb-1">
                                        Modif. (-) $:
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={v.montoDisminucion || ""}
                                        onChange={(e) =>
                                          handleUpdateVariacionAnterior(v.id, {
                                            montoDisminucion:
                                              parseFloat(e.target.value) || 0,
                                          })
                                        }
                                        className="w-full px-2.5 py-1.5 border border-amber-300 bg-amber-50/30 rounded-lg text-xs font-bold text-amber-800 focus:outline-none focus:border-amber-600"
                                        placeholder="0.00"
                                      />
                                      <span className="text-[10px] text-amber-700 mt-0.5 block">
                                        {formatearMoneda(v.montoDisminucion)}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Campos para Paralización / Desparalización */}
                          {esParalizacion && (
                            <div className="space-y-3 p-3 bg-amber-50/50 rounded-lg border border-amber-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <NormaLegalField
                                    label="Norma Legal de Paralización:"
                                    sublabel="Inyecta:"
                                    tipoActual={v.normaParalizacionTipo}
                                    numeroActual={v.normaParalizacionNumero}
                                    valorFallback={v.normaParalizacion}
                                    defaultTipo="Disposición"
                                    placeholder="ej. 12/2025"
                                    borderTheme="amber"
                                    onChange={(tipo, numero, completo) =>
                                      handleUpdateVariacionAnterior(v.id, {
                                        normaParalizacionTipo: tipo,
                                        normaParalizacionNumero: numero,
                                        normaParalizacion: completo,
                                      })
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                                    Primer Día de Paralización:
                                  </label>
                                  <input
                                    type="date"
                                    value={v.primerDiaParalizacion || ""}
                                    onChange={(e) => {
                                      const nuevoInicio = e.target.value;
                                      const dias = calcularDiasEntreFechas(
                                        nuevoInicio,
                                        v.fechaReanudacion
                                      );
                                      handleUpdateVariacionAnterior(v.id, {
                                        primerDiaParalizacion: nuevoInicio,
                                        diasParalizacionNetos: dias,
                                        diasParalizacion: dias,
                                      });
                                    }}
                                    className="w-full px-2.5 py-1.5 border border-amber-200 bg-white rounded-lg text-xs focus:outline-none focus:border-amber-600"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <NormaLegalField
                                    label="Norma Legal de Desparalización / Reanudación:"
                                    sublabel="Inyecta:"
                                    tipoActual={v.normaReanudacionTipo}
                                    numeroActual={v.normaReanudacionNumero}
                                    valorFallback={v.normaReanudacion}
                                    defaultTipo="Disposición"
                                    placeholder="ej. 18/2025"
                                    borderTheme="amber"
                                    onChange={(tipo, numero, completo) =>
                                      handleUpdateVariacionAnterior(v.id, {
                                        normaReanudacionTipo: tipo,
                                        normaReanudacionNumero: numero,
                                        normaReanudacion: completo,
                                      })
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                                    Fecha de Reanudación:
                                  </label>
                                  <input
                                    type="date"
                                    value={v.fechaReanudacion || ""}
                                    onChange={(e) => {
                                      const nuevaRean = e.target.value;
                                      const dias = calcularDiasEntreFechas(
                                        v.primerDiaParalizacion,
                                        nuevaRean
                                      );
                                      handleUpdateVariacionAnterior(v.id, {
                                        fechaReanudacion: nuevaRean,
                                        diasParalizacionNetos: dias,
                                        diasParalizacion: dias,
                                      });
                                    }}
                                    className="w-full px-2.5 py-1.5 border border-amber-200 bg-white rounded-lg text-xs focus:outline-none focus:border-amber-600"
                                  />
                                </div>
                              </div>

                              {/* Cálculo de Días Netos de Paralización */}
                              <div className="flex items-center justify-between p-2 rounded-md bg-amber-100/70 border border-amber-200 text-xs">
                                <span className="font-semibold text-amber-900">
                                  Días netos calculados (Fecha Reanudación - Primer Día):
                                </span>
                                <span className="font-extrabold text-amber-950 bg-white px-2.5 py-0.5 rounded border border-amber-300">
                                  {diasNetosParalizacion} días corridos
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Barra de Resultados Encadenados tras esta Fila */}
                          <div className="pt-2 border-t border-slate-100">
                            <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-100/70 rounded-lg text-[11px]">
                              <div>
                                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                                  Plazo Acumulado:
                                </span>
                                <span className="font-extrabold text-slate-800">
                                  {row?.plazoAcumulado ?? "-"} días corridos
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                                  Monto Acumulado:
                                </span>
                                <span className="font-extrabold text-slate-800">
                                  {row ? formatearMoneda(row.montoAcumulado) : "-"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                                  Vto. Resultante:
                                </span>
                                <span className="font-extrabold text-[#0038A8]">
                                  {row ? formatearFechaCorta(row.fechaVtoResultante) : "-"}
                                </span>
                              </div>
                            </div>

                            {/* Previsualización del CONSIDERANDO generado */}
                            <div className="mt-2.5 p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/80 text-[11px] text-slate-700">
                              <div className="flex items-center gap-1.5 font-bold text-[#0038A8] text-[10px] uppercase mb-1">
                                <Scale className="w-3.5 h-3.5" />
                                Redacción Automática en CONSIDERANDO:
                              </div>
                              <p className="italic leading-relaxed text-slate-800">
                                "{row?.textoConsiderando || "Complete los campos para previsualizar el considerando legal..."}"
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Resumen del Estado Previo Calculado (Excel Barra Inferior) */}
                <div className="p-4 bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50 rounded-xl border-2 border-blue-200 flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-extrabold tracking-wider">
                      MONTO ACTUALIZADO PREVIO:
                    </span>
                    <span className="font-black text-[#0038A8] text-base">
                      {formatearMoneda(calc.estadoPrevio.montoPrevio)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-extrabold tracking-wider">
                      PLAZO ACTUALIZADO PREVIO:
                    </span>
                    <span className="font-black text-slate-800 text-base">
                      {calc.estadoPrevio.plazoPrevioDias} días corridos
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-extrabold tracking-wider">
                      VENCIMIENTO PREVIO (Base):
                    </span>
                    <span className="font-black text-[#00B4D8] text-base">
                      {formatearFechaCorta(calc.estadoPrevio.fechaVtoPrevia)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 2: EXPEDIENTE ADMINISTRATIVO */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-cyan-50 text-[#0096C7]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0B1938] text-base">
                SECCIÓN 2: Expediente Administrativo
              </h3>
              <p className="text-xs text-slate-500">
                Identificación de la actuación administrativa en la cual tramita la presente adenda.
              </p>
            </div>
          </div>

          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <ExpedienteAlcanceFields
              expedienteNumero={data.expedienteNumero}
              expedienteAnio={data.expedienteAnio}
              expedienteFallback={data.expediente}
              alcance={data.alcance}
              alcancePlaceholder="ej. 02/2025"
              labelExpediente="N° de Expediente Municipal *"
              labelAlcance="Alcance *"
              onChange={({ expedienteNumero, expedienteAnio, expediente, alcance }) =>
                onChange({ expedienteNumero, expedienteAnio, expediente, alcance })
              }
            />
          </div>
        </div>

        {/* SECCIÓN 3: COMUNICACIONES DE OBRA (NOTAS DE PEDIDO Y ÓRDENES DE SERVICIO) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-[#0038A8]">
                <MessageSquareQuote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1938] text-base">
                  SECCIÓN 3: Comunicaciones de Obra (Notas de Pedido y Órdenes de Servicio)
                </h3>
                <p className="text-xs text-slate-500">
                  Registre los pedidos de la contratista y conformidades de inspección. Se formatean automáticamente como considerandos de la norma.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddComunicacion}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0038A8] text-white rounded-xl font-bold text-xs hover:bg-[#002b80] transition-colors shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Agregar Comunicación
            </button>
          </div>

          {(!data.comunicacionesObra || data.comunicacionesObra.length === 0) ? (
            <div className="text-center py-8 bg-slate-50/60 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400 space-y-2">
              <p>No se han registrado comunicaciones de obra para esta alteración.</p>
              <button
                type="button"
                onClick={handleAddComunicacion}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 text-[#0038A8] font-bold rounded-lg hover:bg-slate-50 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar la primera comunicación
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {data.comunicacionesObra.map((com, index) => {
                const isNota = com.tipo === "Nota de Pedido";
                const isFormatting = formattingId === com.id;

                return (
                  <div
                    key={com.id}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 shadow-2xs space-y-3 text-xs"
                  >
                    {/* Fila superior: Tipo, Número y Botón Eliminar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md font-black text-[11px] bg-slate-800 text-white">
                          #{index + 1}
                        </span>

                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          <label className="text-[11px] font-bold text-slate-600">Tipo:</label>
                          <select
                            value={com.tipo}
                            onChange={(e) =>
                              handleUpdateComunicacion(com.id, {
                                tipo: e.target.value as TipoComunicacionObra,
                              })
                            }
                            className="font-bold text-xs text-[#0B1938] bg-transparent focus:outline-none cursor-pointer"
                          >
                            <option value="Nota de Pedido">Nota de Pedido (Contratista)</option>
                            <option value="Orden de Servicio">Orden de Servicio (Inspección)</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          <label className="text-[11px] font-bold text-slate-600">N°:</label>
                          <input
                            type="text"
                            value={com.numero}
                            onChange={(e) =>
                              handleUpdateComunicacion(com.id, { numero: e.target.value })
                            }
                            placeholder="ej. 3"
                            className="w-16 font-bold text-xs text-[#0038A8] bg-transparent focus:outline-none"
                          />
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            isNota
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {isNota ? "Empresa Contratista" : "Inspección de Obra"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveComunicacion(com.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors self-end sm:self-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    </div>

                    {/* Inputs de texto: Original y Formateado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Textarea 1: Transcripción del Libro */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Transcripción o resumen de la comunicación (Libro de Obra)
                        </label>
                        <textarea
                          rows={3}
                          value={com.textoOriginal}
                          onChange={(e) =>
                            handleUpdateComunicacion(com.id, {
                              textoOriginal: e.target.value,
                            })
                          }
                          placeholder={
                            isNota
                              ? "Ej: La empresa informa la necesidad de extensión de ítems debido a trabajos adicionales requeridos..."
                              : "Ej: Se otorga conformidad a la Nota de Pedido N° 3 y se aprueba la incorporación de ítems..."
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-white resize-y text-slate-800 placeholder:text-slate-400"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={isFormatting || !com.textoOriginal.trim()}
                            onClick={() => handleFormatWithAI(com.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isFormatting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Formateando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                Formatear como Considerando Legal con IA
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Textarea 2: Considerando Resultante */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-[#0038A8]">
                            Considerando redactado (Técnica Legislativa - Editable)
                          </label>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Termina en punto y coma (;)
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={com.textoConsiderando}
                          onChange={(e) =>
                            handleUpdateComunicacion(com.id, {
                              textoConsiderando: e.target.value,
                            })
                          }
                          placeholder={
                            isNota
                              ? `Que mediante Nota de Pedido N° ${com.numero || "X"}, la empresa contratista solicitó a la Inspección de Obra...;`
                              : `Que mediante Orden de Servicio N° ${com.numero || "X"}, la Inspección de Obra otorgó conformidad a...;`
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-blue-50/20 resize-y font-medium text-slate-900"
                        />
                        <p className="text-[11px] text-slate-500 italic">
                          Se insertará en el considerando de la norma en esta posición exacta. Podés editar cualquier palabra directamente.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECCIÓN 4: MODIFICACIONES SOLICITADAS EN LA ADENDA */}
        <div className="bg-white rounded-2xl border-2 border-blue-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-blue-100 text-[#0038A8]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0B1938] text-base">
                SECCIÓN 4: Modificaciones Solicitadas en la Alteración
              </h3>
              <p className="text-xs text-slate-500">
                Campos adaptados para {data.tipoAlteracion} ({data.modalidad}).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CAMPOS DE VOLUMEN / MONTO */}
            {calc.incluyeMonto && (
              <>
                {/* Switch condicional destacado: ÍTEMS NUEVOS */}
                <div className="md:col-span-2 p-4 rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-blue-50/40 to-white shadow-xs">
                  <label className="flex items-start sm:items-center justify-between gap-4 cursor-pointer">
                    <div className="space-y-1">
                      <span className="font-bold text-xs text-[#0B1938] flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-[#0038A8] text-white">
                          Regla de Norma Legal
                        </span>
                        <span>
                          ¿La modificación incluye la incorporación de Ítems Nuevos no previstos en el contrato original?
                        </span>
                      </span>
                      <p className="text-[11px] text-slate-600">
                        {data.incluyeItemsNuevos ?? true ? (
                          <span className="text-indigo-900 font-medium">
                            &bull; <strong>Marcado:</strong> Se incluirá en la norma legal el párrafo oficial de verificación de análisis de precios de la <strong>Dirección de Cómputo y Presupuesto</strong>.
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            &bull; <strong>Desmarcado:</strong> Se excluye por completo el considerando de la Dirección de Cómputo y Presupuesto de la plantilla.
                          </span>
                        )}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={data.incluyeItemsNuevos ?? true}
                      onChange={(e) =>
                        onChange({ incluyeItemsNuevos: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-slate-300 text-[#0038A8] focus:ring-[#0038A8] shrink-0 cursor-pointer mt-0.5 sm:mt-0"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0038A8] mb-1">
                    N° de Cuadro Comparativo *
                    {esConvalidacion && (
                      <span className="ml-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Sugerido: FINAL
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={data.nroCuadro || (esConvalidacion ? "FINAL" : "")}
                    onChange={(e) => onChange({ nroCuadro: e.target.value })}
                    placeholder={placeholderNroCuadro}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-blue-50/30 font-medium"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {esConvalidacion
                      ? "En convalidaciones de obra se registra habitualmente como Cuadro Comparativo FINAL."
                      : "Identifica el cuadro de modificaciones presupuestarias o ítems."}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0038A8] mb-1">
                    {calc.esDisminucion
                      ? "Monto de Disminución Contractual *"
                      : "Monto de Ampliación Contractual *"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={data.montoVariacion || ""}
                      onChange={(e) =>
                        onChange({
                          montoVariacion: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      className="w-full pl-8 pr-3.5 py-2 text-sm rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-blue-50/30 font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    {formatearMoneda(data.montoVariacion)} &bull; {montoALetras(data.montoVariacion, true)}
                  </p>
                </div>
              </>
            )}

            {/* CAMPOS DE PLAZO */}
            {calc.incluyePlazo && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#0038A8] mb-1">
                    Días Corridos de Ampliación de Plazo *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={data.diasAmpliacion || ""}
                    onChange={(e) =>
                      onChange({
                        diasAmpliacion: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    placeholder="Ej: 30"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0038A8] bg-blue-50/30 font-medium"
                  />
                  <p className="text-[11px] text-[#0038A8] mt-1 italic">
                    Equivale a: {diasALetras(data.diasAmpliacion)} DÍAS
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#0038A8]">
                      {labelFechaCulminacion} *
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Fórmula Oficial Excel
                    </span>
                  </div>

                  {calc.fechaVtoNuevaCalculada ? (
                    <div className="p-3.5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-slate-50 shadow-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#0038A8] shrink-0" />
                          <span className="font-bold text-[#0B1938] text-sm capitalize">
                            {formatearFechaTexto(calc.fechaVtoNuevaCalculada)}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-blue-200 text-[#0038A8] shadow-2xs shrink-0">
                          {formatearFechaCorta(calc.fechaVtoNuevaCalculada)}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-100 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                        <span>
                          Base:{" "}
                          <strong className="text-slate-700">
                            {formatearFechaCorta(calc.fechaVtoOriginal) || "S/D"}
                          </strong>
                        </span>
                        {calc.estadoPrevio.totalDiasAmpliacionPrevio +
                          calc.estadoPrevio.totalDiasParalizacionPrevio >
                          0 && (
                          <>
                            <span>&bull;</span>
                            <span>
                              Antecedentes:{" "}
                              <strong className="text-slate-700">
                                +
                                {calc.estadoPrevio.totalDiasAmpliacionPrevio +
                                  calc.estadoPrevio.totalDiasParalizacionPrevio}{" "}
                                d
                              </strong>
                            </span>
                          </>
                        )}
                        <span>&bull;</span>
                        <span>
                          Ampliación Actual:{" "}
                          <strong className="text-[#0038A8]">
                            +{calc.diasAmp} d
                          </strong>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-xs text-amber-800 flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Complete la{" "}
                        <strong>
                          {data.aPartirDe === "Contrato" ||
                          data.aPartirDe === "Firma del Contrato"
                            ? "Fecha de Firma del Contrato"
                            : "Fecha de Acta de Replanteo"}
                        </strong>{" "}
                        y el <strong>Plazo Original</strong> en la Sección 1 para calcular automáticamente la fecha de vencimiento contractual.
                      </span>
                    </div>
                  )}

                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {placeholderFechaCulminacion}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Botones de navegación al pie del formulario */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Modalidad
        </button>
      </div>
    </div>
  );
}
