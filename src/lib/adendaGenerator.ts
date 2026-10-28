import createReport from "docx-templates";
import JSZip from "jszip";
import {
  formatearMoneda,
  montoALetras,
  diasALetras,
  formatearPorcentaje,
  formatearFechaTexto,
  sumarDias,
  calcularVtoOriginal,
} from "./formatters";

export type TipoAlteracion =
  | "Ampliación de Plazo"
  | "Ampliación de Volumen"
  | "Disminución de Volumen"
  | "Ampliación de Plazo y Volumen"
  | "Ampliación de Plazo y Disminución de Volumen";

export type ModalidadTramite = "Aprobación" | "Convalidación";

export interface OpcionRepresentanteMunicipal {
  id: string;
  nombreCorto: string;
  textoLegal: string;
}

export const OPCIONES_REPRESENTANTE_MUNICIPAL: OpcionRepresentanteMunicipal[] = [
  {
    id: "viviana",
    nombreCorto:
      "Cra. Mirta Viviana Den Hartog (Subsecretaria de Gestión de Contrataciones)",
    textoLegal:
      "la SUBSECRETARIA DE GESTIÓN DE CONTRATACIONES DE OBRAS PÚBLICAS, CRA. MIRTA VIVIANA DEN HARTOG, D.N.I N° 26.476.872, designada mediante Decreto N°00031/23",
  },
  {
    id: "alejandro",
    nombreCorto:
      "Ing. Alejandro Abel Nicola (Secretario de Infraestructura y Planeamiento)",
    textoLegal:
      "el SECRETARIO DE INFRAESTRUCTURA Y PLANEAMIENTO URBANO, ING. ALEJANDRO ABEL NICOLA, D.N.I. N° 16.076.122, designado mediante Decreto N° 0005/23",
  },
];

export const TIPOS_MODALIDAD_CONTRATO = [
  "Licitación Pública",
  "Licitación Privada",
  "Concurso de Precios",
  "Contratación Directa",
] as const;
export type TipoModalidadContrato = (typeof TIPOS_MODALIDAD_CONTRATO)[number];

export function parseModalidadContrato(str?: string): { tipo: TipoModalidadContrato; numero: string } {
  if (!str) return { tipo: "Licitación Pública", numero: "" };
  const s = str.trim();
  for (const t of TIPOS_MODALIDAD_CONTRATO) {
    if (s.toLowerCase().startsWith(t.toLowerCase())) {
      const rest = s.slice(t.length).replace(/^(?:\s+N[°ºo]?\s*|\s+)/i, "").trim();
      return { tipo: t, numero: rest };
    }
  }
  return { tipo: "Licitación Pública", numero: s.replace(/^N[°ºo]?\s*/i, "").trim() };
}

export function ensamblarModalidadContrato(tipo?: string, numero?: string, fallback = ""): string {
  const t = (tipo || "").trim();
  const num = (numero || "").trim();
  if (t && num) {
    return `${t} N° ${num}`;
  }
  if (t) return t;
  return fallback;
}

export const TIPOS_NORMA_LEGAL = ["Decreto", "Disposición", "Resolución"] as const;
export type TipoNormaLegal = (typeof TIPOS_NORMA_LEGAL)[number];

export function parseNormaLegal(str?: string, defaultTipo: TipoNormaLegal = "Decreto"): { tipo: TipoNormaLegal; numero: string } {
  if (!str) return { tipo: defaultTipo, numero: "" };
  const s = str.trim();
  for (const t of TIPOS_NORMA_LEGAL) {
    if (s.toLowerCase().startsWith(t.toLowerCase())) {
      const rest = s.slice(t.length).replace(/^(?:\s+Municipal)?(?:\s+N[°ºo]?\s*|\s+)/i, "").trim();
      return { tipo: t, numero: rest };
    }
  }
  return { tipo: defaultTipo, numero: s.replace(/^N[°ºo]?\s*/i, "").trim() };
}

export function ensamblarNormaLegal(tipo?: string, numero?: string, fallback = ""): string {
  const t = (tipo || "").trim();
  const num = (numero || "").trim();
  if (t && num) {
    return `${t} N° ${num}`;
  }
  if (t) return t;
  return fallback;
}

export function parseExpedientePartes(exp?: string): { numero: string; anio: string } {
  if (!exp) return { numero: "", anio: "" };
  const clean = exp.trim();
  // OE <num> -M- <year> or OE-<num>-M-<year> or OE <num>-<year>
  const m1 = clean.match(/OE\s*[- ]?(\d+)\s*[- ](?:M[- ]?)?(\d{2,4})/i);
  if (m1) {
    let anio = m1[2];
    if (anio.length === 2) anio = `20${anio}`;
    return { numero: m1[1], anio };
  }
  const m2 = clean.match(/(\d+)\s*[-/]\s*(\d{2,4})/);
  if (m2) {
    let anio = m2[2];
    if (anio.length === 2) anio = `20${anio}`;
    return { numero: m2[1], anio };
  }
  const m3 = clean.match(/(\d+)/);
  if (m3) {
    return { numero: m3[1], anio: "" };
  }
  return { numero: clean, anio: "" };
}

export function ensamblarExpediente(numero?: string, anio?: string, fallback = ""): string {
  const num = (numero || "").trim();
  const yr = (anio || "").trim();
  if (num && yr) {
    return `OE ${num}-M-${yr}`;
  }
  if (num) {
    return `OE ${num}`;
  }
  return fallback;
}

export function obtenerFechaBaseCalculo(
  aPartirDe?: string,
  fechaContrato?: string,
  fechaReplanteo?: string
): string {
  const esContrato = aPartirDe === "Contrato" || aPartirDe === "Firma del Contrato";
  return esContrato ? (fechaContrato || "") : (fechaReplanteo || "");
}

export type TipoAlteracionAnterior =
  | "Ampliación de Plazo"
  | "Modificación de Volumen"
  | "Ampliación de Plazo y Volumen"
  | "Paralización / Desparalización";

export interface VariacionAnterior {
  id: string;
  nroVariacion: string; // ej: "Variación 1"
  expediente: string; // Por defecto el expediente de la obra, pero editable
  expedienteNumero?: string;
  expedienteAnio?: string;
  alcance: string; // Formato libre (ej. "02/2026", "01/2025", etc.)
  tipoAlteracion: TipoAlteracionAnterior;

  // Si incluye Plazo:
  diasAmpliacion?: number; // Plazo (+) Días
  normaLegal?: string; // ej. "Decreto N° 0512/26"
  normaLegalTipo?: string;
  normaLegalNumero?: string;
  fechaNorma?: string; // ej. "2026-03-10" o "10 de marzo de 2026"

  // Si incluye Volumen:
  montoAumento?: number; // Modif. (+) $
  montoDisminucion?: number; // Modif. (-) $

  // Si es Paralización / Desparalización:
  normaParalizacion?: string; // ej. "Disposición N° 12/25 o Acta"
  normaParalizacionTipo?: string;
  normaParalizacionNumero?: string;
  primerDiaParalizacion?: string; // fecha
  normaReanudacion?: string; // ej. "Disposición N° 18/25"
  normaReanudacionTipo?: string;
  normaReanudacionNumero?: string;
  fechaReanudacion?: string; // fecha
  diasParalizacionNetos?: number; // (Fecha de Reanudación - Primer Día de Paralización)

  // Campos de compatibilidad opcionales
  normaExpediente?: string;
  diasParalizacion?: number;
}

export interface VariacionEncadenadaRow extends VariacionAnterior {
  montoPrevioFila: number;
  plazoPrevioFila: number;
  fechaVtoPreviaFila: string;

  diasAmpliacionEfectivos: number;
  diasParalizacionEfectivos: number;
  montoAumentoEfectivo: number;
  montoDisminucionEfectivo: number;

  montoAcumulado: number;
  plazoAcumulado: number;
  fechaVtoResultante: string;

  textoConsiderando: string;
}

export interface HistorialEncadenadoResult {
  rows: VariacionEncadenadaRow[];
  montoPrevio: number; // MONTO ACTUALIZADO PREVIO
  plazoPrevioDias: number; // PLAZO ACTUALIZADO PREVIO
  fechaVtoPrevia: string; // VENCIMIENTO PREVIO
  totalAumentoPrevio: number;
  totalDisminucionPrevio: number;
  totalDiasAmpliacionPrevio: number;
  totalDiasParalizacionPrevio: number;
  tieneVariacionesPrevias: boolean;
  textosConsiderandos: string[];
}

export type TipoComunicacionObra = "Nota de Pedido" | "Orden de Servicio";

export interface ComunicacionObra {
  id: string;
  tipo: TipoComunicacionObra;
  numero: string;
  textoOriginal: string;
  textoConsiderando: string;
}

export interface AdendaData {
  tipoAlteracion: TipoAlteracion;
  modalidad: ModalidadTramite;

  // Obra y Partes
  obra: string;
  repMun: string; // Bloque legal completo inyectado en «Rep_Mun»
  repMunId?: string; // "viviana" | "alejandro"
  empresa: string;
  cuit: string;
  cargoRepL: string; // Cargo del Representante Legal
  repL: string; // Representante Legal
  dniRepL: string;
  fechaContrato: string;
  normaAdj: string;
  normaAdjTipo?: string; // "Decreto" | "Disposición" | "Resolución"
  normaAdjNumero?: string;
  fechaNormaAdj?: string; // Fecha de Norma Legal de Adjudicación
  modalidadContrato: string; // Ej: "Licitación Pública N° 05/2023"
  modalidadContratoTipo?: string; // "Licitación Pública" | "Licitación Privada" | "Concurso de Precios" | "Contratación Directa"
  modalidadContratoNumero?: string;
  aPartirDe?: string; // "Firma del Contrato" | "Acta de Replanteo" | "Contrato"

  // Campos Técnicos del Excel
  inspectorObra?: string;
  representanteTecnico?: string;
  fechaReplanteo?: string; // Fecha de Acta de Replanteo (Inicio)
  fechaVtoOriginal?: string; // Calculada: Fecha Base + Plazo - 1 día

  // Expediente
  expediente: string;
  expedienteNumero?: string;
  expedienteAnio?: string;
  alcance: string;
  nroCuadro?: string;

  // Datos Originales
  montoOriginal: number;
  plazoOriginalDias: number;

  // Variaciones Anteriores (Opcional, Hoja Excel)
  variacionesAnteriores?: VariacionAnterior[];

  // Variación Actual Solicitada
  diasAmpliacion?: number;
  fechaVtoNueva?: string;
  montoVariacion?: number;

  // Nuevas opciones condicionales y comunicaciones
  incluyeItemsNuevos?: boolean;
  comunicacionesObra?: ComunicacionObra[];
}

// Mapeo del nombre de archivo de plantilla docx
const MAPA_PLANTILLAS: Record<TipoAlteracion, string> = {
  "Ampliación de Plazo": "AMPLIACIÓN DE PLAZO.docx",
  "Ampliación de Volumen": "AMPLIACIÓN DE VOLUMEN.docx",
  "Disminución de Volumen": "DISMINUCIÓN DE VOLUMEN.docx",
  "Ampliación de Plazo y Volumen": "AMPLIACIÓN DE PLAZO Y VOLUMEN.docx",
  "Ampliación de Plazo y Disminución de Volumen": "AMPLIACIÓN DE PLAZO Y DISM VOLUMEN.docx",
};

/**
 * Genera el nombre del archivo final según el formato solicitado:
 * Proy. Adenda - Expediente [Expediente] - Alcance [Alcance_Limpio].docx
 */
export function generarNombreArchivo(
  expedienteOrData:
    | string
    | {
        expediente?: string;
        expedienteNumero?: string;
        expedienteAnio?: string;
        alcance?: string;
      },
  alcance?: string,
  _legacyArg3?: string
): string {
  let exp = "S-N";
  let alc = "0";

  if (typeof expedienteOrData === "object" && expedienteOrData !== null) {
    const obj = expedienteOrData;
    exp =
      obj.expediente ||
      (obj.expedienteNumero
        ? ensamblarExpediente(obj.expedienteNumero, obj.expedienteAnio || "")
        : "") ||
      "S-N";
    alc = obj.alcance || "0";
  } else if (typeof expedienteOrData === "string") {
    exp = expedienteOrData || "S-N";
    alc = alcance || "0";
    if (typeof _legacyArg3 === "string") {
      exp = _legacyArg3 || "S-N";
      alc = "0";
    }
  }

  const sanitize = (s: unknown) =>
    String(s ?? "")
      .replace(/[\/\\:*?"<>|]/g, "-")
      .trim()
      .replace(/\s+/g, " ");

  const expLimpio = sanitize(exp);
  const alcanceLimpio = sanitize(alc);

  return `Proy. Adenda - Expediente ${expLimpio} - Alcance ${alcanceLimpio}.docx`;
}

/**
 * Obtiene el ArrayBuffer de la plantilla correspondiente
 */
async function obtenerPlantillaBuffer(
  modalidad: ModalidadTramite,
  tipo: TipoAlteracion
): Promise<ArrayBuffer> {
  const fileName = MAPA_PLANTILLAS[tipo];
  const rutaRelativa = `/templates/${modalidad}/${fileName}`;
  const urlEncoded = encodeURI(rutaRelativa);

  try {
    const res = await fetch(urlEncoded);
    if (res.ok) {
      return await res.arrayBuffer();
    }
  } catch {
    // Si falla fetch en entorno navegador o pruebas
  }

  // Fallback para entorno Node.js (tests o SSR)
  if (typeof window === "undefined") {
    const fs = await import("fs");
    const path = await import("path");
    const publicPath = path.join(
      process.cwd(),
      "public",
      "templates",
      modalidad,
      fileName
    );
    if (fs.existsSync(publicPath)) {
      const buf = fs.readFileSync(publicPath);
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
  }

  throw new Error(
    `No se pudo cargar la plantilla "${fileName}" para ${modalidad} en ${urlEncoded}.`
  );
}

/**
 * Calcula los días de diferencia netos entre dos fechas en formato YYYY-MM-DD
 */
export function calcularDiasEntreFechas(
  fechaInicio: string | null | undefined,
  fechaFin: string | null | undefined
): number {
  if (!fechaInicio || !fechaFin) return 0;
  const matchIni = fechaInicio.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const matchFin = fechaFin.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!matchIni || !matchFin) return 0;

  const dIni = Date.UTC(
    parseInt(matchIni[1], 10),
    parseInt(matchIni[2], 10) - 1,
    parseInt(matchIni[3], 10)
  );
  const dFin = Date.UTC(
    parseInt(matchFin[1], 10),
    parseInt(matchFin[2], 10) - 1,
    parseInt(matchFin[3], 10)
  );

  const diffDays = Math.round((dFin - dIni) / (1000 * 3600 * 24));
  return Math.max(0, diffDays);
}

/**
 * Redacta el párrafo formal de CONSIDERANDO para una alteración anterior según redacción jurídica fluida y precisa
 */
export function redactarConsiderandoVariacion(
  v: VariacionAnterior,
  acumulado: {
    montoAcumulado: number;
    plazoAcumulado: number;
    fechaVtoResultante: string;
    diasAmpliacionEfectivos: number;
    montoAumentoEfectivo: number;
    montoDisminucionEfectivo: number;
    diasParalizacionEfectivos: number;
  }
): string {
  const tipo = v.tipoAlteracion || "Ampliación de Plazo";

  if (tipo === "Paralización / Desparalización") {
    // "Que por [Norma Legal Paralización] se dispuso la suspensión de los trabajos a partir del día [Primer Día Paralización], reanudándose las tareas el día [Fecha Reanudación] mediante [Norma Legal Desparalización], extendiéndose en consecuencia la culminación de la obra al día [Fecha Vto resultante];"
    const normaPar =
      v.normaParalizacion?.trim() ||
      ensamblarNormaLegal(v.normaParalizacionTipo, v.normaParalizacionNumero) ||
      "la Disposición de paralización";
    const primerDia = v.primerDiaParalizacion
      ? formatearFechaTexto(v.primerDiaParalizacion)
      : "fecha a determinar";
    const fechaRean = v.fechaReanudacion
      ? formatearFechaTexto(v.fechaReanudacion)
      : "fecha a determinar";
    const normaRean =
      v.normaReanudacion?.trim() ||
      ensamblarNormaLegal(v.normaReanudacionTipo, v.normaReanudacionNumero) ||
      "la correspondiente Disposición de reanudación";
    const fechaVtoRes = acumulado.fechaVtoResultante
      ? formatearFechaTexto(acumulado.fechaVtoResultante)
      : "fecha a determinar";

    return `Que por ${normaPar} se dispuso la suspensión de los trabajos a partir del día ${primerDia}, reanudándose las tareas el día ${fechaRean} mediante ${normaRean}, extendiéndose en consecuencia la culminación de la obra al día ${fechaVtoRes};`;
  }

  // Para Ampliación de Plazo / Modificación de Volumen:
  const norma =
    v.normaLegal?.trim() ||
    ensamblarNormaLegal(v.normaLegalTipo, v.normaLegalNumero) ||
    v.normaExpediente?.trim() ||
    "la Norma Legal correspondiente";
  const fechaNorma = v.fechaNorma
    ? formatearFechaTexto(v.fechaNorma)
    : "fecha a determinar";
  const expte =
    v.expediente?.trim() ||
    ensamblarExpediente(v.expedienteNumero, v.expedienteAnio) ||
    "S/N";
  const alc = v.alcance?.trim() || "00";

  const incluyePlazo =
    tipo === "Ampliación de Plazo" || tipo === "Ampliación de Plazo y Volumen";
  const incluyeVolumen =
    tipo === "Modificación de Volumen" || tipo === "Ampliación de Plazo y Volumen";

  const dias = acumulado.diasAmpliacionEfectivos;
  const diasLetras = diasALetras(dias);
  const fechaVtoRes = acumulado.fechaVtoResultante
    ? formatearFechaTexto(acumulado.fechaVtoResultante)
    : "fecha a determinar";

  const aumento = acumulado.montoAumentoEfectivo;
  const disminucion = acumulado.montoDisminucionEfectivo;
  const montoAcum = acumulado.montoAcumulado;
  const montoAcumLetras = montoALetras(montoAcum, false);
  const montoAcumMoneda = formatearMoneda(montoAcum);

  const esDisminucion = disminucion > 0 && aumento === 0;
  const montoVar = esDisminucion
    ? disminucion
    : aumento > 0
    ? aumento
    : Math.abs(aumento - disminucion);
  const tipoOperacion = esDisminucion ? "una disminución" : "un incremento";
  const montoVarLetras = montoALetras(montoVar, false);
  const montoVarMoneda = formatearMoneda(montoVar);

  if (incluyePlazo && incluyeVolumen) {
    return `Que mediante ${norma}, de fecha ${fechaNorma}, tramitada por Expediente ${expte} - Alcance ${alc}, se aprobó una ampliación de plazo de ${diasLetras} (${dias}) días corridos, trasladando el término contractual al día ${fechaVtoRes}. Por el mismo acto administrativo se autorizó ${tipoOperacion} de PESOS ${montoVarLetras} (${montoVarMoneda}), fijando el monto contractual acumulado en PESOS ${montoAcumLetras} (${montoAcumMoneda});`;
  } else if (incluyePlazo) {
    return `Que mediante ${norma}, de fecha ${fechaNorma}, tramitada por Expediente ${expte} - Alcance ${alc}, se aprobó una ampliación de plazo de ${diasLetras} (${dias}) días corridos, trasladando el término contractual al día ${fechaVtoRes};`;
  } else if (incluyeVolumen) {
    return `Que mediante ${norma}, de fecha ${fechaNorma}, tramitada por Expediente ${expte} - Alcance ${alc}, se autorizó ${tipoOperacion} de PESOS ${montoVarLetras} (${montoVarMoneda}), fijando el monto contractual acumulado en PESOS ${montoAcumLetras} (${montoAcumMoneda});`;
  } else {
    return `Que mediante ${norma}, de fecha ${fechaNorma}, tramitada por Expediente ${expte} - Alcance ${alc}, se aprobaron las adecuaciones contractuales correspondientes;`;
  }
}

/**
 * Realiza el cálculo encadenado fila por fila de antecedentes según fórmulas de Excel
 */
export function calcularHistorialEncadenado(
  montoOriginal: number,
  plazoOriginalDias: number,
  fechaVtoOriginal: string,
  variacionesAnteriores: VariacionAnterior[] = []
): HistorialEncadenadoResult {
  const montoOrig = Number(montoOriginal) || 0;
  const plazoOrig = Number(plazoOriginalDias) || 0;
  const fechaVtoOrig = fechaVtoOriginal || "";

  if (!variacionesAnteriores || variacionesAnteriores.length === 0) {
    return {
      rows: [],
      montoPrevio: montoOrig,
      plazoPrevioDias: plazoOrig,
      fechaVtoPrevia: fechaVtoOrig,
      totalAumentoPrevio: 0,
      totalDisminucionPrevio: 0,
      totalDiasAmpliacionPrevio: 0,
      totalDiasParalizacionPrevio: 0,
      tieneVariacionesPrevias: false,
      textosConsiderandos: [],
    };
  }

  let currentMonto = montoOrig;
  let currentPlazo = plazoOrig;
  let currentFechaVto = fechaVtoOrig;

  let totalAumento = 0;
  let totalDisminucion = 0;
  let totalDiasAmp = 0;
  let totalDiasParalizacion = 0;

  const rows: VariacionEncadenadaRow[] = [];
  const textosConsiderandos: string[] = [];

  for (let i = 0; i < variacionesAnteriores.length; i++) {
    const v = variacionesAnteriores[i];
    const tipo = v.tipoAlteracion || "Ampliación de Plazo";

    // Modificaciones efectivas según el tipo elegido
    let diasAmp = 0;
    if (tipo === "Ampliación de Plazo" || tipo === "Ampliación de Plazo y Volumen") {
      diasAmp = Number(v.diasAmpliacion) || 0;
    }

    let aumento = 0;
    let disminucion = 0;
    if (tipo === "Modificación de Volumen" || tipo === "Ampliación de Plazo y Volumen") {
      aumento = Number(v.montoAumento) || 0;
      disminucion = Number(v.montoDisminucion) || 0;
    }

    let diasNetosParalizacion = 0;
    if (tipo === "Paralización / Desparalización") {
      if (v.primerDiaParalizacion && v.fechaReanudacion) {
        diasNetosParalizacion = calcularDiasEntreFechas(
          v.primerDiaParalizacion,
          v.fechaReanudacion
        );
      } else {
        diasNetosParalizacion =
          Number(v.diasParalizacionNetos || v.diasParalizacion) || 0;
      }
    }

    // Encadenamiento fila por fila:
    // Plazo acumulado = Plazo previo + Días ampliación
    const plazoAcumulado = currentPlazo + diasAmp;

    // Monto acumulado = Monto previo + Modif(+) - Modif(-)
    const montoAcumulado = Math.max(0, currentMonto + aumento - disminucion);

    // Fecha de Vto = Fecha de Vto previa + Días ampliación + Días netos de paralización
    const diasDesplazamientoVto = diasAmp + diasNetosParalizacion;
    const fechaVtoResultante = currentFechaVto
      ? sumarDias(currentFechaVto, diasDesplazamientoVto)
      : "";

    // Redacción del considerando
    const textoCons = redactarConsiderandoVariacion(v, {
      montoAcumulado,
      plazoAcumulado,
      fechaVtoResultante,
      diasAmpliacionEfectivos: diasAmp,
      montoAumentoEfectivo: aumento,
      montoDisminucionEfectivo: disminucion,
      diasParalizacionEfectivos: diasNetosParalizacion,
    });

    const row: VariacionEncadenadaRow = {
      ...v,
      montoPrevioFila: currentMonto,
      plazoPrevioFila: currentPlazo,
      fechaVtoPreviaFila: currentFechaVto,
      diasAmpliacionEfectivos: diasAmp,
      diasParalizacionEfectivos: diasNetosParalizacion,
      montoAumentoEfectivo: aumento,
      montoDisminucionEfectivo: disminucion,
      montoAcumulado,
      plazoAcumulado,
      fechaVtoResultante,
      textoConsiderando: textoCons,
    };

    rows.push(row);
    textosConsiderandos.push(textoCons);

    totalAumento += aumento;
    totalDisminucion += disminucion;
    totalDiasAmp += diasAmp;
    totalDiasParalizacion += diasNetosParalizacion;

    // Avanzar valores para la siguiente fila
    currentMonto = montoAcumulado;
    currentPlazo = plazoAcumulado;
    currentFechaVto = fechaVtoResultante;
  }

  return {
    rows,
    montoPrevio: currentMonto,
    plazoPrevioDias: currentPlazo,
    fechaVtoPrevia: currentFechaVto,
    totalAumentoPrevio: totalAumento,
    totalDisminucionPrevio: totalDisminucion,
    totalDiasAmpliacionPrevio: totalDiasAmp,
    totalDiasParalizacionPrevio: totalDiasParalizacion,
    tieneVariacionesPrevias: true,
    textosConsiderandos,
  };
}

/**
 * Wrapper de compatibilidad para calcular el Estado Actualizado Previo
 */
export function calcularEstadoPrevio(
  montoOriginal: number,
  plazoOriginalDias: number,
  fechaVtoOriginal: string,
  variacionesAnteriores: VariacionAnterior[] = []
): HistorialEncadenadoResult {
  return calcularHistorialEncadenado(
    montoOriginal,
    plazoOriginalDias,
    fechaVtoOriginal,
    variacionesAnteriores
  );
}

/**
 * Calcula todos los valores derivados y técnicos según las fórmulas exactas del Excel oficial
 */
export function calcularValoresAdenda(data: AdendaData) {
  const incluyePlazo =
    data.tipoAlteracion === "Ampliación de Plazo" ||
    data.tipoAlteracion === "Ampliación de Plazo y Volumen" ||
    data.tipoAlteracion === "Ampliación de Plazo y Disminución de Volumen";

  const incluyeMonto = data.tipoAlteracion !== "Ampliación de Plazo";

  const esDisminucion =
    data.tipoAlteracion === "Disminución de Volumen" ||
    data.tipoAlteracion === "Ampliación de Plazo y Disminución de Volumen";

  // 1. Datos originales
  const montoOrig = Number(data.montoOriginal) || 0;
  const plazoOrig = Number(data.plazoOriginalDias) || 0;

  // Fecha Base según corresponda: Fecha Acta de Replanteo o Fecha Firma Contrato
  const fechaBaseCalculo = obtenerFechaBaseCalculo(
    data.aPartirDe,
    data.fechaContrato,
    data.fechaReplanteo
  );

  // Fecha Vto Original: Fecha Base + Plazo Original - 1 día
  const fechaVtoOriginal =
    calcularVtoOriginal(fechaBaseCalculo, plazoOrig) ||
    data.fechaVtoOriginal ||
    "";

  // 2. Estado Actualizado Previo (cálculo encadenado antecedentes)
  const estadoPrevio = calcularHistorialEncadenado(
    montoOrig,
    plazoOrig,
    fechaVtoOriginal,
    data.variacionesAnteriores || []
  );

  // 3. Modificaciones de la Variación Actual a Tramitar
  const montoVar = incluyeMonto ? Math.abs(Number(data.montoVariacion) || 0) : 0;
  const diasAmp = incluyePlazo ? Number(data.diasAmpliacion) || 0 : 0;

  const modifMas = incluyeMonto && !esDisminucion ? montoVar : 0;
  const modifMenos = incluyeMonto && esDisminucion ? montoVar : 0;

  // Var de Vol ($) = Modif (+) - Modif (-)
  const varVolPesos = modifMas - modifMenos;

  // Var de Vol (%) = Var de Vol ($) / Monto Actualizado Previo
  const porcentajeVar =
    estadoPrevio.montoPrevio > 0
      ? (Math.abs(varVolPesos) / estadoPrevio.montoPrevio) * 100
      : 0;

  // Monto Post Variación = Monto Actualizado Previo + Modif (+) - Modif (-)
  const montoPostVariacion = Math.max(
    0,
    estadoPrevio.montoPrevio + modifMas - modifMenos
  );

  // Plazo Post Variación = Plazo Actualizado Previo + Ampliación de Plazo
  const plazoPostVariacion = estadoPrevio.plazoPrevioDias + diasAmp;

  // Nueva Fecha Vto Calculada Automática y Estricta:
  // Fecha Vto Previa + Días de Ampliación de Plazo de la alteración actual
  const fechaVtoNuevaCalculada = estadoPrevio.fechaVtoPrevia
    ? (diasAmp > 0 ? sumarDias(estadoPrevio.fechaVtoPrevia, diasAmp) : estadoPrevio.fechaVtoPrevia)
    : "";

  // 4. Garantía Contractual (5%):
  // = IF(Modalidad === 'CONVALIDACION', 0, IF(VarVol > 0, MontoPostVariacion * 0.05, 0))
  let garantia = 0;
  const esConvalidacion = data.modalidad === "Convalidación";
  if (!esConvalidacion && varVolPesos > 0) {
    garantia = montoPostVariacion * 0.05;
  }

  // Ensamblar campos estructurados para vista previa rápida
  const modalidadCompleta =
    ensamblarModalidadContrato(data.modalidadContratoTipo, data.modalidadContratoNumero) ||
    data.modalidadContrato ||
    "";
  const normaAdjCompleta =
    ensamblarNormaLegal(data.normaAdjTipo, data.normaAdjNumero) ||
    data.normaAdj ||
    "";
  const expedienteCompleto =
    ensamblarExpediente(data.expedienteNumero, data.expedienteAnio) ||
    data.expediente ||
    "";

  return {
    incluyePlazo,
    incluyeMonto,
    esDisminucion,
    esConvalidacion,
    montoOrig,
    plazoOrig,
    fechaBaseCalculo,
    fechaVtoOriginal,
    estadoPrevio,
    diasAmp,
    modifMas,
    modifMenos,
    varVolPesos,
    porcentajeVar,
    montoPostVariacion,
    plazoPostVariacion,
    fechaVtoNuevaCalculada,
    fechaVtoNuevaSugerida: fechaVtoNuevaCalculada,
    garantia,
    modalidadCompleta,
    normaAdjCompleta,
    expedienteCompleto,
  };
}

/**
 * Prepara el objeto de variables para inyectar en docx-templates
 */
export function prepararDatosReporte(data: AdendaData) {
  const calc = calcularValoresAdenda(data);

  const normaAdjCompleta =
    ensamblarNormaLegal(data.normaAdjTipo, data.normaAdjNumero) ||
    data.normaAdj ||
    "";

  const modalidadCompleta =
    ensamblarModalidadContrato(data.modalidadContratoTipo, data.modalidadContratoNumero) ||
    data.modalidadContrato ||
    "";

  const expedienteCompleto =
    ensamblarExpediente(data.expedienteNumero, data.expedienteAnio) ||
    data.expediente ||
    "";

  return {
    // Obra y Partes
    Obra: data.obra || "",
    Rep_Mun: data.repMun || "",
    Empresa: data.empresa || "",
    CUIT: data.cuit || "",
    Cargo_Rep_L: data.cargoRepL || "",
    Rep_L: data.repL || "",
    DNI_Rep_L: data.dniRepL || "",
    Fecha_Contrato: formatearFechaTexto(data.fechaContrato),
    Norma_Adj: normaAdjCompleta,
    Modalidad: modalidadCompleta,
    A_Partir_de: data.aPartirDe || "Acta de Replanteo",

    // Datos originales
    Monto_Original_: formatearMoneda(calc.montoOrig),
    Monto_Original_L: montoALetras(calc.montoOrig, false),
    Plazo_Orig_n: String(calc.plazoOrig),
    Plazo_Orig_L: diasALetras(calc.plazoOrig),

    // Expediente
    Expediente: expedienteCompleto,
    Alcance: data.alcance || "0",
    Nro_Cuadro: data.nroCuadro || "",

    // Variaciones calculadas (se definen todas las variantes para soportar todas las plantillas)
    Var_: formatearMoneda(Math.abs(calc.varVolPesos)),
    Var_L: montoALetras(Math.abs(calc.varVolPesos), false),
    Dism_: formatearMoneda(Math.abs(calc.varVolPesos)),
    Dism_L: montoALetras(Math.abs(calc.varVolPesos), false),
    Aumento_: formatearMoneda(Math.abs(calc.varVolPesos)),
    Aumento_L: montoALetras(Math.abs(calc.varVolPesos), false),
    Var_1: formatearPorcentaje(calc.porcentajeVar),

    // Nuevos valores resultantes
    Monto_Nuevo_: formatearMoneda(calc.montoPostVariacion),
    Monto_Nuevo_L: montoALetras(calc.montoPostVariacion, false),
    Plazo_Nuevo_n: String(calc.plazoPostVariacion),
    Plazo_Nuevo_L: diasALetras(calc.plazoPostVariacion),
    Amp_Plazo_n: String(calc.diasAmp),
    Amp_Plazo_L: diasALetras(calc.diasAmp),
    Fecha_Vto_Nueva: formatearFechaTexto(calc.fechaVtoNuevaCalculada),

    // Considerandos Previos
    Considerandos_Previos: calc.estadoPrevio.textosConsiderandos.join("\n\n"),

    // Garantía (5% de Monto_Nuevo_ o 0 según regla del Excel)
    Garantía_: formatearMoneda(calc.garantia),
  };
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function unescapeXml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function cleanNumeroComunicacion(num?: string): string {
  return String(num || "").replace(/^N[°ºo]?\s*/i, "").trim() || "S/N";
}

/**
 * Transforma la transcripción o resumen de comunicación de obra al estilo legal formal municipal:
 * - Nota de Pedido:
 *   "Que mediante Nota de Pedido N° [X], la empresa contratista [manifestó / informó / solicitó] a la Inspección de Obra [reformulación clara y sintética en pasado];"
 * - Orden de Servicio:
 *   "Que mediante Orden de Servicio N° [X], la Inspección de Obra [otorgó conformidad / instruyó a la contratista / aprobó] [reformulación clara y sintética en pasado];"
 */
export function reformularComunicacionLegal(
  tipo: TipoComunicacionObra,
  numero: string,
  textoOriginal: string
): string {
  const num = cleanNumeroComunicacion(numero);
  let raw = String(textoOriginal || "").trim();
  if (!raw) {
    if (tipo === "Nota de Pedido") {
      return `Que mediante Nota de Pedido N° ${num}, la empresa contratista informó a la Inspección de Obra lo correspondiente al desarrollo de las tareas;`;
    } else {
      return `Que mediante Orden de Servicio N° ${num}, la Inspección de Obra otorgó conformidad a lo actuado en obra;`;
    }
  }

  raw = raw.replace(/[\.;,]+$/, "").trim();

  if (tipo === "Nota de Pedido") {
    let verb = "informó";
    if (/solicit|pedi|requier|peticion/iu.test(raw)) {
      verb = "solicitó";
    } else if (/manifest|hace saber|expres/iu.test(raw)) {
      verb = "manifestó";
    } else if (/present|adjunt|elev/iu.test(raw)) {
      verb = "presentó";
    }

    let cleaned = raw
      .replace(
        /^(?:por\s+medio\s+de\s+la\s+presente\s+|mediante\s+la\s+presente\s+|por\s+la\s+presente\s+)?/iu,
        ""
      )
      .replace(
        /^(?:la\s+empresa\s+(?:contratista\s+)?|la\s+contratista\s+)?(?:solicit[a-zñáéíóú]*|inform[a-zñáéíóú]*|manifest[a-zñáéíóú]*|present[a-zñáéíóú]*|elev[a-zñáéíóú]*)(?:\s+a\s+la\s+inspecci[oó]n(?:\s+de\s+obra)?)?\s*/iu,
        ""
      )
      .replace(
        /^(?:se\s+solicit[a-zñáéíóú]*|se\s+inform[a-zñáéíóú]*|se\s+manifest[a-zñáéíóú]*|se\s+hace\s+saber|se\s+elev[a-zñáéíóú]*)\s*/iu,
        ""
      )
      .replace(/^(?:a\s+la\s+inspecci[oó]n(?:\s+de\s+obra)?\s+)?/iu, "")
      .replace(/^(?:que\s+)?/iu, "")
      .trim();

    cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);

    return `Que mediante Nota de Pedido N° ${num}, la empresa contratista ${verb} a la Inspección de Obra ${cleaned};`;
  } else {
    let verb = "otorgó conformidad";
    let prep = "a";

    if (/instru|orden|intim/iu.test(raw)) {
      verb = "instruyó a la contratista";
      prep = "a";
    } else if (/(?:aprob|aprueb)/iu.test(raw) && !/conformidad/iu.test(raw)) {
      verb = "aprobó";
      prep = "";
    } else if (/notific|comunic|inform/iu.test(raw) && !/conformidad/iu.test(raw)) {
      verb = "informó a la empresa contratista";
      prep = "";
    }

    let cleaned = raw
      .replace(
        /^(?:por\s+medio\s+de\s+la\s+presente\s+|mediante\s+la\s+presente\s+)?/iu,
        ""
      )
      .replace(
        /^(?:la\s+inspecci[oó]n(?:\s+de\s+obra)?\s+)?(?:otorg[a-zñáéíóú]*\s+conformidad|(?:aprob|aprueb)[a-zñáéíóú]*|instru[a-zñáéíóú]*(?:\s+a\s+la\s+(?:empresa|contratista))?|inform[a-zñáéíóú]*|notific[a-zñáéíóú]*)(?:\s+a\s+la\s+contratista|\s+a\s+la\s+empresa)?\s*/iu,
        ""
      )
      .replace(
        /^(?:se\s+otorg[a-zñáéíóú]*\s+conformidad|se\s+(?:aprob|aprueb)[a-zñáéíóú]*|se\s+instru[a-zñáéíóú]*|se\s+inform[a-zñáéíóú]*|se\s+notific[a-zñáéíóú]*)\s*/iu,
        ""
      )
      .replace(/^(?:a\s+|que\s+)/iu, "")
      .trim();

    cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);

    if (prep === "a" && (cleaned.startsWith("al ") || cleaned.startsWith("a "))) {
      prep = "";
    }

    const connector = prep ? ` ${prep} ` : " ";
    return `Que mediante Orden de Servicio N° ${num}, la Inspección de Obra ${verb}${connector}${cleaned};`;
  }
}

export const PARRAFO_COMPUTO_OFICIAL =
  "Que la Dirección de Cómputo y Presupuesto, dependiente de la Subsecretaría de Gestión de Contrataciones de Obras Públicas, verificó los análisis de precios, correspondientes a los nuevos ítems presentados por parte de la empresa, indicando que los mismos corresponden a tareas no contempladas en la obra básica, concluyendo que los precios ofertados por los materiales, maquinarias y mano de obra se consideran valores normales de mercado, constatando asimismo que el coeficiente de pase es el presentado oportunamente al momento de ofertar la obra;";

/**
 * Excluye por completo el considerando de Cómputo y Presupuesto y su espaciador de Word XML
 */
export function removerParrafoComputo(xml: string): string {
  const pRegex = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g;
  let match: RegExpExecArray | null;
  let targetStart = -1;
  let targetEnd = -1;

  while ((match = pRegex.exec(xml)) !== null) {
    const raw = match[0].replace(/<[^>]+>/g, "").trim();
    if (/C[oó]mputo y Presupuesto/i.test(raw)) {
      targetStart = match.index;
      targetEnd = match.index + match[0].length;

      const nextRemaining = xml.slice(targetEnd);
      const nextP = nextRemaining.match(/^(\s*<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>)/);
      if (nextP) {
        const nextText = nextP[1].replace(/<[^>]+>/g, "").trim();
        if (!nextText) {
          targetEnd += nextP[0].length;
        }
      }
      break;
    }
  }

  if (targetStart !== -1) {
    return xml.slice(0, targetStart) + xml.slice(targetEnd);
  }
  return xml;
}

export function parseParagraphRuns(pXml: string) {
  const pPrMatch = pXml.match(/^<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>$/);
  if (!pPrMatch) return null;
  const inside = pPrMatch[1];

  let pPr = "";
  let body = inside;
  const pPrM = inside.match(/^(<w:pPr>[\s\S]*?<\/w:pPr>)/);
  if (pPrM) {
    pPr = pPrM[1];
    body = inside.slice(pPr.length);
  }

  const runRegex = /<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g;
  const runs: any[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = runRegex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ type: "non-run", raw: body.slice(lastIndex, match.index) });
    }
    const rRaw = match[0];
    const rPrMatch = rRaw.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
    const rPr = rPrMatch ? rPrMatch[1] : "";
    const isBold =
      /<w:b(?:\s|\/|>)/.test(rPr) &&
      !/<w:b\s+[^>]*w:val="(?:0|false|none)"/i.test(rPr);
    const tMatch = rRaw.match(/<w:t([^>]*)>([\s\S]*?)<\/w:t>/);

    if (tMatch) {
      runs.push({
        type: "run",
        raw: rRaw,
        rPr,
        hasRPr: !!rPrMatch,
        isBold,
        tAttrs: tMatch[1],
        text: unescapeXml(tMatch[2]),
      });
    } else {
      runs.push({ type: "other-run", raw: rRaw });
    }
    lastIndex = match.index + rRaw.length;
  }
  if (lastIndex < body.length) {
    runs.push({ type: "non-run", raw: body.slice(lastIndex) });
  }

  return { pPr, runs };
}

export function aplicarNegritasAParrafo(pXml: string, targetsRegex: RegExp[]): string {
  const parsed = parseParagraphRuns(pXml);
  if (!parsed) return pXml;

  let fullText = "";
  const runRanges: any[] = [];
  for (const r of parsed.runs) {
    if (r.type === "run") {
      const start = fullText.length;
      fullText += r.text;
      runRanges.push({ run: r, start, end: fullText.length });
    } else {
      runRanges.push({ run: r, start: -1, end: -1 });
    }
  }

  if (!fullText) return pXml;

  const shouldBeBold = new Array(fullText.length).fill(false);

  // Conservar negritas preexistentes en la plantilla
  for (const item of runRanges) {
    if (item.run.type === "run" && item.run.isBold) {
      for (let i = item.start; i < item.end; i++) {
        shouldBeBold[i] = true;
      }
    }
  }

  // Marcar coincidencias de datos clave para formatear en negrita
  for (const re of targetsRegex) {
    let m: RegExpExecArray | null;
    const regex = new RegExp(re.source, re.flags);
    while ((m = regex.exec(fullText)) !== null) {
      const start = m.index;
      const end = m.index + m[0].length;
      for (let i = start; i < end; i++) {
        shouldBeBold[i] = true;
      }
      if (!regex.global) break;
    }
  }

  let newBody = "";
  for (const item of runRanges) {
    const r = item.run;
    if (r.type !== "run") {
      newBody += r.raw;
      continue;
    }

    const start = item.start;
    const end = item.end;
    let segStart = start;

    while (segStart < end) {
      const boldVal = shouldBeBold[segStart];
      let segEnd = segStart + 1;
      while (segEnd < end && shouldBeBold[segEnd] === boldVal) {
        segEnd++;
      }

      const segText = fullText.slice(segStart, segEnd);
      let rPrToUse = r.rPr;

      if (boldVal) {
        if (r.hasRPr) {
          if (!/<w:b(?:\s|\/|>)/.test(rPrToUse)) {
            rPrToUse = "<w:b/><w:bCs/>" + rPrToUse;
          } else if (/<w:b\s+[^>]*w:val="(?:0|false|none)"/i.test(rPrToUse)) {
            rPrToUse = rPrToUse.replace(
              /<w:b\s+[^>]*w:val="(?:0|false|none)"/i,
              "<w:b/><w:bCs/>"
            );
          }
        } else {
          rPrToUse =
            "<w:rFonts w:ascii=\"Aptos\" w:eastAsia=\"Aptos\" w:hAnsi=\"Aptos\" w:cs=\"Times New Roman\"/><w:b/><w:bCs/><w:sz w:val=\"24\"/><w:szCs w:val=\"24\"/>";
        }
      }

      const rPrXml = rPrToUse ? `<w:rPr>${rPrToUse}</w:rPr>` : "";
      newBody += `<w:r>${rPrXml}<w:t xml:space="preserve">${escapeXml(segText)}</w:t></w:r>`;
      segStart = segEnd;
    }
  }

  const pTagMatch = pXml.match(/^<w:p(?:\s[^>]*)?>/);
  const pOpen = pTagMatch ? pTagMatch[0] : "<w:p>";
  return `${pOpen}${parsed.pPr}${newBody}</w:p>`;
}

/**
 * Construye la lista de expresiones regulares para identificar y formatear en negrita
 * los datos clave requeridos en el documento Word (.docx)
 */
export function construirTargetsNegrita(data: AdendaData, calc?: any): RegExp[] {
  const targets: RegExp[] = [];

  // 1. Nombre de la Obra
  if (data.obra?.trim()) {
    targets.push(new RegExp(escapeRegex(data.obra.trim()), "gi"));
  }

  // 2. Razón Social de la Empresa Contratista y su CUIT
  if (data.empresa?.trim()) {
    targets.push(new RegExp(escapeRegex(data.empresa.trim()), "gi"));
  }
  if (data.cuit?.trim()) {
    targets.push(
      new RegExp(
        `(?:(?:bajo\\s+el\\s+|con\\s+el\\s+)?C\\.?U\\.?I\\.?T\\.?\\s*(?:N[°ºo]?)?\\s*)?${escapeRegex(data.cuit.trim())}`,
        "gi"
      )
    );
  }
  targets.push(
    /\b(?:(?:bajo\s+el\s+|con\s+el\s+)?C\.?U\.?I\.?T\.?\s*(?:N[°ºo]?)?\s*)?\d{2}-\d{8}-\d\b/gi
  );

  // 3. Montos en pesos y en letras mayúsculas
  targets.push(/\bPESOS\s+[^()\n\r]+?\s*\(\$\s*[\d\.,]+\)/gi);
  targets.push(/\$\s*[\d\.,]+(?:\s*\([^)]*\))?/gi);

  // 4. Plazos en días y letras mayúsculas
  targets.push(/\b[A-ZÁÉÍÓÚÑ\s]+?\s*\(\d+\)\s*días\s+corridos\b/gi);
  targets.push(/\b\d+\s+días\s+corridos\b/gi);

  // 5. Fechas de culminación / vencimiento
  targets.push(/\b\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4}\b/gi);
  if (calc?.fechaVtoNuevaCalculada) {
    const fTexto = formatearFechaTexto(calc.fechaVtoNuevaCalculada);
    if (fTexto) targets.push(new RegExp(escapeRegex(fTexto), "gi"));
  }

  // 6. Expediente y Alcance
  targets.push(/\bExpediente\s+(?:OE\s*)?[\d\w-]+(?:\s*-\s*Alcance\s*[\d\w/]+)?\b/gi);
  targets.push(/\bAlcance\s+[\d\w/]+\b/gi);

  // 7. Normas legales citadas
  targets.push(
    /\b(?:Decreto|Resoluci[oó]n|Disposici[oó]n|Ordenanza|Ley)\s+(?:Municipal\s+)?N[°ºo]?\s*[\d\w/-]+/gi
  );
  targets.push(/\bNota\s+de\s+Pedido\s+N[°ºo]?\s*[\d\w/-]+/gi);
  targets.push(/\bOrden\s+de\s+Servicio\s+N[°ºo]?\s*[\d\w/-]+/gi);

  return targets;
}

/**
 * Formatea en negrita (bold <w:b/>) todos los datos clave en word/document.xml:
 * - Nombre de Obra
 * - Empresa y CUIT
 * - Montos en pesos y letras
 * - Plazos en días y letras
 * - Fechas de vencimiento / culminación
 * - Expediente y Alcance
 * - Normas legales citadas
 */
export function aplicarNegritasDatosClave(
  docXml: string,
  data: AdendaData,
  calc?: any
): string {
  const targets = construirTargetsNegrita(data, calc);
  const pRegex = /<w:p(?:[\s>][\s\S]*?<\/w:p>|\/>)/g;
  return docXml.replace(pRegex, (pXml) => aplicarNegritasAParrafo(pXml, targets));
}

export function generarParrafoWordXml(texto: string): string {
  return `<w:p><w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:ind w:firstLine="993"/><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Aptos" w:eastAsia="Aptos" w:hAnsi="Aptos" w:cs="Times New Roman"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Aptos" w:eastAsia="Aptos" w:hAnsi="Aptos" w:cs="Times New Roman"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXml(texto)}</w:t></w:r></w:p><w:p><w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Aptos" w:eastAsia="Aptos" w:hAnsi="Aptos" w:cs="Times New Roman"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr></w:p>`;
}

/**
 * Aplica el estilo oficial municipal de sangría de primera línea de 1,75 cm (993 twips),
 * alineación justificada (both) e interlineado 1.5 (360 twips) a un párrafo de Word XML.
 */
export function aplicarEstiloOficialAParrafo(pXml: string): string {
  const match = pXml.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/);
  if (match) {
    let inner = match[1];
    // w:ind con w:firstLine="993" (1,75 cm)
    if (/<w:ind[^>]*\/>/.test(inner)) {
      inner = inner.replace(/<w:ind[^>]*\/>/, `<w:ind w:firstLine="993"/>`);
    } else if (/<w:ind[^>]*>[\s\S]*?<\/w:ind>/.test(inner)) {
      inner = inner.replace(/<w:ind[^>]*>[\s\S]*?<\/w:ind>/, `<w:ind w:firstLine="993"/>`);
    } else {
      inner = `<w:ind w:firstLine="993"/>` + inner;
    }
    // w:jc justificado (both)
    if (/<w:jc[^>]*\/>/.test(inner)) {
      inner = inner.replace(/<w:jc[^>]*\/>/, `<w:jc w:val="both"/>`);
    } else {
      inner = `<w:jc w:val="both"/>` + inner;
    }
    // w:spacing interlineado 1.5 (360)
    if (/<w:spacing[^>]*\/>/.test(inner)) {
      inner = inner.replace(
        /<w:spacing[^>]*\/>/,
        `<w:spacing w:after="0" w:line="360" w:lineRule="auto"/>`
      );
    } else {
      inner = `<w:spacing w:after="0" w:line="360" w:lineRule="auto"/>` + inner;
    }
    return pXml.replace(/<w:pPr>[\s\S]*?<\/w:pPr>/, `<w:pPr>${inner}</w:pPr>`);
  } else {
    return pXml.replace(
      /(<w:p(?:\s[^>]*)?>)/,
      `$1<w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:ind w:firstLine="993"/><w:jc w:val="both"/></w:pPr>`
    );
  }
}

/**
 * Ajusta el signo de puntuación final del texto visible de un párrafo de Word XML
 * Reemplaza puntuación terminal existente (. , ;) por el signo deseado (; o :)
 */
export function corregirPuntuacionFinalParrafo(
  pXml: string,
  signoDeseado: ";" | ":"
): string {
  const tRegex = /<w:t([^>]*)>([\s\S]*?)<\/w:t>/g;
  let matches: { index: number; full: string; attrs: string; content: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = tRegex.exec(pXml)) !== null) {
    if (m[2].trim().length > 0) {
      matches.push({ index: m.index, full: m[0], attrs: m[1], content: m[2] });
    }
  }
  if (matches.length === 0) return pXml;
  const last = matches[matches.length - 1];

  let updatedContent = last.content.replace(/[\.;,]\s*$/, "") + signoDeseado;
  const newTag = `<w:t${last.attrs}>${updatedContent}</w:t>`;

  return pXml.slice(0, last.index) + newTag + pXml.slice(last.index + last.full.length);
}

/**
 * Desvincula y limpia por completo los campos de correspondencia (MERGEFIELD, fldChar, instrText)
 * de word/document.xml para evitar que Word intente evaluarlos o muestre advertencias al usuario.
 */
export function limpiarCamposMailMerge(xml: string): string {
  let cleaned = xml.replace(/<w:fldSimple[^>]*>([\s\S]*?)<\/w:fldSimple>/g, "$1");
  cleaned = cleaned.replace(
    /<w:r(?:\s[^>]*)?>(?:(?!<w:r[\s>])[\s\S])*?<w:fldChar[^>]*\/>\s*<\/w:r>/g,
    ""
  );
  cleaned = cleaned.replace(
    /<w:r(?:\s[^>]*)?>(?:(?!<w:r[\s>])[\s\S])*?<w:instrText[^>]*>[\s\S]*?<\/w:instrText>\s*<\/w:r>/g,
    ""
  );
  cleaned = cleaned.replace(/<w:fldChar[^>]*\/>/g, "");
  cleaned = cleaned.replace(/<w:instrText[^>]*>[\s\S]*?<\/w:instrText>/g, "");
  return cleaned;
}

/**
 * Homogeneiza integralmente el documento XML asegurando:
 * 1. Sangría oficial de 1,75 cm (993 twips) y texto justificado en todos los párrafos de VISTO y CONSIDERANDO.
 * 2. Técnica legislativa estricta en puntuación (; para considerandos, : para el último considerando de normas, ; y para el VISTO).
 * 3. Eliminación de campos residuales de correspondencia.
 */
export function homogeneizarDocumentoWordXml(docXml: string, esNorma: boolean): string {
  let xml = limpiarCamposMailMerge(docXml);

  const pRegex = /<w:p(?:[\s>][\s\S]*?<\/w:p>|\/>)/g;
  xml = xml.replace(pRegex, (pXml) => {
    const text = pXml.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!text) return pXml;

    // A) Párrafo del VISTO
    if (text.startsWith("El Expediente") && !text.includes("Que ")) {
      let pMod = aplicarEstiloOficialAParrafo(pXml);
      if (!/;\s*y$/i.test(text)) {
        pMod = corregirPuntuacionFinalParrafo(pMod, ";");
        const lastTRegex = /<w:t([^>]*)>([\s\S]*?)<\/w:t>/g;
        let lastMatch: { index: number; full: string; attrs: string; content: string } | null = null;
        let lm: RegExpExecArray | null;
        while ((lm = lastTRegex.exec(pMod)) !== null) {
          if (lm[2].trim().length > 0) {
            lastMatch = { index: lm.index, full: lm[0], attrs: lm[1], content: lm[2] };
          }
        }
        if (lastMatch && !/;\s*y$/i.test(lastMatch.content)) {
          const upd = lastMatch.content.replace(/[\.;,]\s*$/, "") + "; y";
          pMod =
            pMod.slice(0, lastMatch.index) +
            `<w:t${lastMatch.attrs}>${upd}</w:t>` +
            pMod.slice(lastMatch.index + lastMatch.full.length);
        }
      }
      return pMod;
    }

    // B) Párrafos de CONSIDERANDO (en Normas y Adendas)
    if (/^Que\s+/i.test(text)) {
      let pMod = aplicarEstiloOficialAParrafo(pXml);

      if (esNorma && /resulta necesario el dictado de la norma legal/i.test(text)) {
        // Último considerando de la norma: DEBE terminar con dos puntos (:)
        pMod = corregirPuntuacionFinalParrafo(pMod, ":");
      } else {
        // Cualquier otro considerando: DEBE terminar con punto y coma (;)
        pMod = corregirPuntuacionFinalParrafo(pMod, ";");
      }
      return pMod;
    }

    return pXml;
  });

  return xml;
}

/**
 * Genera el documento Word (.docx), inyecta los CONSIDERANDOS previos,
 * elimina los metadatos de combinación de correspondencia (w:mailMerge)
 * para evitar advertencias de Word al abrirlo, y dispara la descarga en el navegador.
 */
export async function generarYDescargarAdenda(data: AdendaData): Promise<Blob> {
  const templateBuffer = await obtenerPlantillaBuffer(data.modalidad, data.tipoAlteracion);
  const datosReporte = prepararDatosReporte(data);
  const calc = calcularValoresAdenda(data);

  // 1. Ejecutamos docx-templates con el delimitador « »
  const output = await createReport({
    template: new Uint8Array(templateBuffer),
    data: datosReporte,
    cmdDelimiter: ["«", "»"],
  });

  // 2. Abrir el archivo resultante con JSZip para sanitizar y postprocesar
  const zip = await JSZip.loadAsync(output);

  // 3. Eliminar por completo el bloque <w:mailMerge>...</w:mailMerge> de word/settings.xml
  if (zip.files["word/settings.xml"]) {
    const settingsXml = await zip.files["word/settings.xml"].async("string");
    const cleanedSettings = settingsXml.replace(/<w:mailMerge[\s\S]*?<\/w:mailMerge>/g, "");
    zip.file("word/settings.xml", cleanedSettings);
  }

  // Eliminar referencias externas de combinación de correspondencia si existen
  if (zip.files["word/recipientData.xml"]) {
    zip.remove("word/recipientData.xml");
  }
  if (zip.files["word/_rels/settings.xml.rels"]) {
    zip.remove("word/_rels/settings.xml.rels");
  }

  // 4. Inyección de Considerandos Previos en word/document.xml
  if (zip.files["word/document.xml"]) {
    let docXml = await zip.files["word/document.xml"].async("string");
    const textosConsiderandos = calc.estadoPrevio.textosConsiderandos || [];

    if (textosConsiderandos.length > 0) {
      const xmlBloqueConsiderandos = textosConsiderandos
        .map((t) => generarParrafoWordXml(t))
        .join("");

      // Caso 1: Si la plantilla contiene el marcador Considerandos_Previos
      if (
        docXml.includes("Considerandos_Previos") ||
        docXml.includes("«Considerandos_Previos»")
      ) {
        const pRegex = /<w:p(?:[\s>][\s\S]*?<\/w:p>|\/>)/g;
        docXml = docXml.replace(pRegex, (match) => {
          if (match.includes("Considerandos_Previos")) {
            return xmlBloqueConsiderandos;
          }
          return match;
        });
      } else {
        // Caso 2: Inyección dinámica después del párrafo de adjudicación original
        const pRegex = /<w:p(?:[\s>][\s\S]*?<\/w:p>|\/>)/g;
        let match: RegExpExecArray | null;
        let targetEnd = -1;

        while ((match = pRegex.exec(docXml)) !== null) {
          if (/adjudic[oó]/i.test(match[0]) || match[0].includes("Norma_Adj")) {
            targetEnd = match.index + match[0].length;
            break;
          }
        }

        if (targetEnd !== -1) {
          // Si el siguiente párrafo es un espaciador vacío entre considerandos, avanzamos después de él
          const remaining = docXml.slice(targetEnd);
          const nextMatch = remaining.match(/^(\s*<w:p[\s\S]*?<\/w:p>)/);
          if (nextMatch) {
            const nextText = nextMatch[1].replace(/<[^>]+>/g, "").trim();
            if (!nextText) {
              targetEnd += nextMatch[0].length;
            }
          }

          docXml =
            docXml.slice(0, targetEnd) +
            xmlBloqueConsiderandos +
            docXml.slice(targetEnd);
        }
      }
    }

    docXml = homogeneizarDocumentoWordXml(docXml, false);
    docXml = aplicarNegritasDatosClave(docXml, data, calc);
    zip.file("word/document.xml", docXml);
  }

  // 5. Guardar el zip de nuevo y generar el blob limpio
  const cleanBlob = await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  // 6. Disparar descarga en el navegador con el nombre formal solicitado
  const expFinal =
    data.expediente ||
    ensamblarExpediente(data.expedienteNumero, data.expedienteAnio);
  const fileName = generarNombreArchivo(expFinal, data.alcance);
  if (typeof window !== "undefined") {
    const downloadUrl = URL.createObjectURL(cleanBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }

  return cleanBlob;
}
