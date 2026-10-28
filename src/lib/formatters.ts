import { NumerosALetras } from "numero-a-letras";

/**
 * Formatea un número como moneda en Pesos Argentinos (ARS) con formato "$ 1.234.567,89"
 */
export function formatearMoneda(monto: number | null | undefined): string {
  if (monto === null || monto === undefined || isNaN(monto)) {
    return "$ 0,00";
  }

  const num = Number(monto);
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const parts = absNum.toFixed(2).split(".");
  const entero = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimal = parts[1];
  const sign = isNegative ? "- " : "";

  return `${sign}$ ${entero},${decimal}`;
}

/**
 * Convierte un monto a letras en mayúsculas usando `numero-a-letras`
 * Ej: 1500000 -> "PESOS UN MILLÓN QUINIENTOS MIL CON 00/100" (con conPrefijoPesos = true)
 * o "UN MILLÓN QUINIENTOS MIL CON 00/100" (con conPrefijoPesos = false, útil para plantillas que ya incluyen 'PESOS')
 */
export function montoALetras(
  monto: number | null | undefined,
  conPrefijoPesos: boolean = true
): string {
  if (monto === null || monto === undefined || isNaN(monto)) {
    return conPrefijoPesos ? "PESOS CERO CON 00/100" : "CERO CON 00/100";
  }

  const num = Math.abs(Number(monto));
  const raw = NumerosALetras(num);

  const centavosMatch = raw.match(/(\d{2})\/100/);
  const centavos = centavosMatch ? centavosMatch[1] : "00";

  let letras = raw
    .replace(/\s+Pesos?.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  // Corrección para "Millón de" seguido de otros números (ej: "Un Millón de Quinientos" -> "Un Millón Quinientos")
  letras = letras.replace(/Mill(ón|ones) de (?=[A-Za-z])/gi, "Mill$1 ");
  // Corrección si termina en " de" (ej: "Un Millón de" -> "Un Millón")
  letras = letras.replace(/\s+de$/i, "");

  const prefix = conPrefijoPesos
    ? Math.floor(num) === 1
      ? "PESO "
      : "PESOS "
    : "";

  return `${prefix}${letras} CON ${centavos}/100`.toUpperCase().replace(/\s+/g, " ").trim();
}

/**
 * Convierte un número entero a días en letras en mayúsculas
 * Ej: 30 -> "TREINTA", 180 -> "CIENTO OCHENTA", 1 -> "UN"
 */
export function diasALetras(dias: number | null | undefined): string {
  if (dias === null || dias === undefined || isNaN(dias)) {
    return "CERO";
  }

  const num = Math.floor(Math.abs(Number(dias)));
  if (num === 0) return "CERO";
  if (num === 1) return "UN";

  const raw = NumerosALetras(num);
  let letras = raw
    .replace(/\s+Pesos?.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  letras = letras.replace(/Mill(ón|ones) de (?=[A-Za-z])/gi, "Mill$1 ");
  letras = letras.replace(/\s+de$/i, "");

  return letras.toUpperCase().replace(/\s+/g, " ").trim();
}

/**
 * Formatea un porcentaje con dos decimales y coma
 * Ej: 15.2 -> "15,20 %"
 */
export function formatearPorcentaje(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return "0,00 %";
  }
  const parts = Number(valor).toFixed(2).split(".");
  return `${parts[0]},${parts[1]} %`;
}

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/**
 * Formatea una fecha YYYY-MM-DD a texto formal en español
 * Ej: "2024-05-15" -> "15 de mayo de 2024"
 */
export function formatearFechaTexto(fechaStr: string | null | undefined): string {
  if (!fechaStr) return "";

  // Si ya contiene letras de mes o formato libre, retornarlo
  if (MESES.some((m) => fechaStr.toLowerCase().includes(m))) {
    return fechaStr;
  }

  // Si viene en formato ISO o YYYY-MM-DD
  const match = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const anio = match[1];
    const mesIndex = parseInt(match[2], 10) - 1;
    const dia = parseInt(match[3], 10);
    const nombreMes = MESES[mesIndex] || match[2];
    return `${dia} de ${nombreMes} de ${anio}`;
  }

  // Si viene en formato DD/MM/YYYY
  const matchSlash = fechaStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (matchSlash) {
    const dia = parseInt(matchSlash[1], 10);
    const mesIndex = parseInt(matchSlash[2], 10) - 1;
    const anio = matchSlash[3];
    const nombreMes = MESES[mesIndex] || matchSlash[2];
    return `${dia} de ${nombreMes} de ${anio}`;
  }

  return fechaStr;
}

/**
 * Parsea un string que puede tener formato de moneda o número a float
 */
export function parsearNumero(val: string | number | null | undefined): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;

  // Remueve símbolos monetarios y espacios
  let limpio = val.toString().replace(/[$ \s]/g, "");

  // Si tiene formato argentino: 1.234.567,89
  if (limpio.includes(",") && limpio.includes(".")) {
    limpio = limpio.replace(/\./g, "").replace(",", ".");
  } else if (limpio.includes(",")) {
    // Caso 1234,56
    limpio = limpio.replace(",", ".");
  }

  const num = parseFloat(limpio);
  return isNaN(num) ? 0 : num;
}

/**
 * Suma un número entero de días (positivo o negativo) a una fecha YYYY-MM-DD
 */
export function sumarDias(fechaStr: string | null | undefined, dias: number): string {
  if (!fechaStr || isNaN(dias)) return "";
  const match = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);

  const d = new Date(Date.UTC(year, month, day));
  d.setUTCDate(d.getUTCDate() + dias);

  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

/**
 * Calcula la Fecha de Vencimiento Original según fórmula de la planilla Excel:
 * Fecha Replanteo + Plazo Original (días) - 1 día
 */
export function calcularVtoOriginal(
  fechaReplanteo: string | null | undefined,
  plazoDias: number | null | undefined
): string {
  if (!fechaReplanteo || !plazoDias || Number(plazoDias) <= 0) return "";
  return sumarDias(fechaReplanteo, Number(plazoDias) - 1);
}

/**
 * Formatea una fecha YYYY-MM-DD a DD/MM/AAAA para tablas y carátulas
 */
export function formatearFechaCorta(fechaStr: string | null | undefined): string {
  if (!fechaStr) return "-";
  const match = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return fechaStr;
}

