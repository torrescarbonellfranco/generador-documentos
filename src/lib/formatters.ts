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
 * Convierte un número de 1 a 3 dígitos (0 a 999) a letras en español
 */
function convertirTerna(num: number, apocopar: boolean = true): string {
  const UNIDADES = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const ESPECIALES = [
    "DIEZ",
    "ONCE",
    "DOCE",
    "TRECE",
    "CATORCE",
    "QUINCE",
    "DIECISÉIS",
    "DIECISIETE",
    "DIECIOCHO",
    "DIECINUEVE",
  ];
  const DECENAS = [
    "",
    "",
    "VEINTE",
    "TREINTA",
    "CUARENTA",
    "CINCUENTA",
    "SESENTA",
    "SETENTA",
    "OCHENTA",
    "NOVENTA",
  ];
  const CENTENAS = [
    "",
    "CIENTO",
    "DOSCIENTOS",
    "TRESCIENTOS",
    "CUATROCIENTOS",
    "QUINIENTOS",
    "SEISCIENTOS",
    "SETECIENTOS",
    "OCHOCIENTOS",
    "NOVECIENTOS",
  ];

  if (num === 0) return "";
  if (num === 100) return "CIEN";

  const c = Math.floor(num / 100);
  const d = Math.floor((num % 100) / 10);
  const u = num % 10;
  let res = "";

  if (c > 0) {
    res += CENTENAS[c] + " ";
  }

  if (d === 1) {
    res += ESPECIALES[u];
  } else if (d === 2) {
    if (u === 0) res += "VEINTE";
    else if (u === 1) res += apocopar ? "VEINTIÚN" : "VEINTIUNO";
    else if (u === 2) res += "VEINTIDÓS";
    else if (u === 3) res += "VEINTITRÉS";
    else if (u === 4) res += "VEINTICUATRO";
    else if (u === 5) res += "VEINTICINCO";
    else if (u === 6) res += "VEINTISÉIS";
    else if (u === 7) res += "VEINTISIETE";
    else if (u === 8) res += "VEINTIOCHO";
    else if (u === 9) res += "VEINTINUEVE";
  } else if (d > 2) {
    res += DECENAS[d];
    if (u === 1) {
      res += " Y " + (apocopar ? "UN" : "UNO");
    } else if (u > 1) {
      res += " Y " + UNIDADES[u];
    }
  } else {
    // d === 0
    if (u === 1) {
      res += apocopar ? "UN" : "UNO";
    } else if (u > 1) {
      res += UNIDADES[u];
    }
  }

  return res.trim();
}

/**
 * Convierte un número de hasta 6 dígitos (0 a 999.999) a letras en español
 */
function convertirHastaSeisDigitos(num: number, apoc: boolean): string {
  const miles = Math.floor(num / 1000);
  const resto = num % 1000;
  let s = "";

  if (miles === 1) {
    s = "MIL";
  } else if (miles > 1) {
    s = convertirTerna(miles, true) + " MIL";
  }

  if (resto > 0) {
    const restoStr = convertirTerna(resto, apoc);
    s = s ? s + " " + restoStr : restoStr;
  }

  return s.trim();
}
const BIGINT_ZERO = BigInt(0);
const BIGINT_MILLON = BigInt(1000000);
const BIGINT_BILLON = BigInt("1000000000000");

/**
 * Convierte un número entero positivo (BigInt o number) a palabras en mayúsculas en español
 * Soporta escala completa sin desbordamiento mediante BigInt.
 * Regla estricta de redacción para miles de millones:
 * - Si el bloque de miles de millones es 1 => "MIL MILLONES" (nunca "UN MIL MILLONES")
 * - Si es 2 o más => "[CARDINAL] MIL MILLONES" (ej. "DOS MIL MILLONES")
 */
export function enteroALetras(n: bigint | number, apocoparFinal: boolean = true): string {
  const big = typeof n === "bigint" ? (n < BIGINT_ZERO ? -n : n) : BigInt(Math.floor(Math.abs(Number(n))));
  if (big === BIGINT_ZERO) return "CERO";

  const billones = big / BIGINT_BILLON;
  const remBillones = big % BIGINT_BILLON;
  const millones = remBillones / BIGINT_MILLON;
  const unidades = Number(remBillones % BIGINT_MILLON);

  const partes: string[] = [];

  // 1. Billones (10^12)
  if (billones > BIGINT_ZERO) {
    const numBillones = Number(billones);
    if (numBillones === 1) {
      partes.push("UN BILLÓN");
    } else {
      partes.push(convertirHastaSeisDigitos(numBillones, true) + " BILLONES");
    }
  }

  // 2. Millones y Miles de Millones (10^6 a 10^11)
  if (millones > BIGINT_ZERO) {
    const numMillones = Number(millones);
    if (numMillones === 1) {
      partes.push("UN MILLÓN");
    } else {
      // Regla estricta de miles de millones:
      // Si miles de millones es 1 => "MIL" + resto + " MILLONES" (ej. 1904 => "MIL NOVECIENTOS CUATRO MILLONES")
      // Si miles de millones >= 2 => "[X] MIL" + resto + " MILLONES" (ej. 2900 => "DOS MIL NOVECIENTOS MILLONES")
      partes.push(convertirHastaSeisDigitos(numMillones, true) + " MILLONES");
    }
  }

  // 3. Unidades y Miles (10^0 a 10^5)
  if (unidades > 0) {
    partes.push(convertirHastaSeisDigitos(unidades, apocoparFinal));
  }

  return partes.join(" ").trim();
}

/**
 * Convierte un monto numérico a letras en mayúsculas en Pesos Argentinos con centavos
 * Ejemplos:
 * - 1904566260.00 -> "PESOS MIL NOVECIENTOS CUATRO MILLONES QUINIENTOS SESENTA Y SEIS MIL DOSCIENTOS SESENTA CON 00/100"
 * - 2900000000.00 -> "PESOS DOS MIL NOVECIENTOS MILLONES CON 00/100"
 * - 12500000.00   -> "PESOS DOCE MILLONES QUINIENTOS MIL CON 00/100"
 */
export function montoALetras(
  monto: number | null | undefined,
  conPrefijoPesos: boolean = true
): string {
  if (monto === null || monto === undefined || isNaN(monto)) {
    return conPrefijoPesos ? "PESOS CERO CON 00/100" : "CERO CON 00/100";
  }

  const num = Math.abs(Number(monto));
  const parts = num.toFixed(2).split(".");
  const enteroBig = BigInt(parts[0]);
  const centavos = parts[1] || "00";

  const letras = enteroALetras(enteroBig, true);
  const prefix = conPrefijoPesos ? "PESOS " : "";

  return `${prefix}${letras} CON ${centavos}/100`.toUpperCase().replace(/\s+/g, " ").trim();
}

/**
 * Convierte un número entero a días en letras en mayúsculas
 * Ej: 30 -> "TREINTA", 180 -> "CIENTO OCHENTA", 1 -> "UN", 21 -> "VEINTIÚN"
 */
export function diasALetras(dias: number | null | undefined): string {
  if (dias === null || dias === undefined || isNaN(dias)) {
    return "CERO";
  }

  const num = Math.floor(Math.abs(Number(dias)));
  if (num === 0) return "CERO";
  if (num === 1) return "UN";

  return enteroALetras(BigInt(num), true).toUpperCase().replace(/\s+/g, " ").trim();
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

