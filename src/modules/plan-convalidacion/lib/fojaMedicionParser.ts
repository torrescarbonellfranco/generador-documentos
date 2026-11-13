import * as XLSX from 'xlsx';
import { parsearNumeroExcel } from './cuadroModificatorioParser';
import { roundTo } from './convalidacionEngine';
import { ItemContrato, MesConfig } from '@/modules/plan-convalidacion/types/convalidacion';

export interface FojaItemExtraido {
  codigoItem: string;     // Normalizado: ej. "1.1", "5", "3.6"
  codigoOriginal: string; // Como vino en la foja: ej. " 3.6 (Nuevo) "
  cantidadActual: number; // Columna "Actual" dentro de "CANTIDAD"
}

export interface ResultadoFojaMedicion {
  numeroFoja: number;     // Mes X (de "Foja de Medición Nº X")
  nombreArchivo: string;
  items: FojaItemExtraido[];
  totalItems: number;
  itemsConCantidad: number;
  advertencias: string[];
}

export interface ResumenImportacionFojas {
  fojasProcesadas: ResultadoFojaMedicion[];
  maxNumeroFoja: number;
  nuevosItems: ItemContrato[];
  nuevasConfigMeses: MesConfig[];
  resumenPorFoja: Array<{
    foja: number;
    archivo: string;
    itemsActualizados: number;
    itemsEnCero: number;
  }>;
  advertenciasGenerales: string[];
}

/**
 * Normaliza el código de ítem eliminando sufijos como (Nuevo), espacios y caracteres tipográficos.
 * Ejemplo: " 3.6 (Nuevo) " -> "3.6"
 */
export function normalizarCodigoItem(codigo: string | null | undefined): string {
  if (!codigo) return '';
  let str = String(codigo).trim();

  // Eliminar sufijos comunes de modificaciones contractuales
  str = str.replace(/\s*\([nN]uevo\)/gi, '');
  str = str.replace(/\s*\([aA]dicional\)/gi, '');
  str = str.replace(/\s*\([aA]dic\)/gi, '');
  str = str.replace(/\s*\([sS]uprimido\)/gi, '');
  str = str.replace(/\s*\([dD]isminuido\)/gi, '');

  // Limpiar caracteres especiales de ordinales
  str = str.replace(/[°º]/g, '').trim();

  // Si tiene formato "1.0", "2.00", no truncar subítems reales como "1.1", pero normalizar espacios
  return str.trim();
}

/**
 * Extrae el número de foja/mes a partir del contenido de la hoja o del nombre de archivo.
 * Busca patrones como: "Foja de Medición Nº 3", "FOJA DE MEDICION N° 12", "Foja N° 4", etc.
 */
export function extraerNumeroFoja(
  sheet: XLSX.WorkSheet,
  nombreArchivo?: string
): { numeroFoja: number | null; metodoDeteccion: string } {
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  // 1. Escanear las celdas de las primeras 35 filas
  const maxRows = Math.min(rows.length, 35);
  for (let r = 0; r < maxRows; r++) {
    const row = rows[r];
    if (!row) continue;

    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c] || '').trim();
      if (!cellVal) continue;

      // Patrón principal: "Foja de Medición Nº X" o "FOJA DE MEDICION N°: X"
      const matchExacto = cellVal.match(
        /Foja(?:\s+de)?\s+Medici[oó]n\s*(?:N[º°o]?|Nro\.?|Número)?\s*[:.]?\s*(\d+)/i
      );
      if (matchExacto) {
        const num = parseInt(matchExacto[1], 10);
        if (!isNaN(num) && num > 0) {
          return { numeroFoja: num, metodoDeteccion: `Celda [F${r + 1}:C${c + 1}]: "${cellVal}"` };
        }
      }

      // Si la celda dice "FOJA DE MEDICION" y el número está al final o en la celda contigua
      if (/Foja(?:\s+de)?\s+Medici[oó]n/i.test(cellVal)) {
        const matchNumFinal = cellVal.match(/(\d+)\s*$/);
        if (matchNumFinal) {
          const num = parseInt(matchNumFinal[1], 10);
          if (!isNaN(num) && num > 0) {
            return { numeroFoja: num, metodoDeteccion: `Celda [F${r + 1}:C${c + 1}]: "${cellVal}"` };
          }
        }

        // Revisar celda a la derecha
        if (c + 1 < row.length) {
          const nextVal = String(row[c + 1] || '').trim();
          const nextNum = parseInt(nextVal, 10);
          if (!isNaN(nextNum) && nextNum > 0) {
            return {
              numeroFoja: nextNum,
              metodoDeteccion: `Celda contigua [F${r + 1}:C${c + 2}]: "${nextVal}"`,
            };
          }
        }
      }

      // Patrón foja simple: "Foja N° 2" o "Certificado Nº 2"
      const matchSimple = cellVal.match(/\bFoja\s*N[º°o]?\s*[:.]?\s*(\d+)\b/i);
      if (matchSimple) {
        const num = parseInt(matchSimple[1], 10);
        if (!isNaN(num) && num > 0) {
          return { numeroFoja: num, metodoDeteccion: `Celda [F${r + 1}:C${c + 1}]: "${cellVal}"` };
        }
      }
    }
  }

  // 2. Fallback: buscar en el nombre de archivo (ej. "Foja 3.xlsx", "Foja de Medicion N2.xls", "FM 04.xlsx")
  if (nombreArchivo) {
    const matchFile = nombreArchivo.match(/(?:foja(?:\s*de\s*medici[oó]n)?|fm)[^\d]*(\d+)/i);
    if (matchFile) {
      const num = parseInt(matchFile[1], 10);
      if (!isNaN(num) && num > 0) {
        return {
          numeroFoja: num,
          metodoDeteccion: `Nombre de archivo: "${nombreArchivo}"`,
        };
      }
    }
  }

  return { numeroFoja: null, metodoDeteccion: 'No detectado' };
}

/**
 * Parsea un archivo individual de Foja de Medición (.xlsx o .xls)
 * Extrae EXCLUSIVAMENTE el número de foja y los pares { codigoItem, cantidadActual }.
 * NO lee ni modifica ningún otro dato del contrato.
 */
export function parsearFojaMedicion(
  workbook: XLSX.WorkBook,
  nombreArchivo: string = 'Foja.xlsx'
): ResultadoFojaMedicion {
  const advertencias: string[] = [];

  // Usar la primera hoja del libro
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error(`El archivo "${nombreArchivo}" no contiene ninguna hoja de cálculo.`);
  }

  const sheet = workbook.Sheets[sheetName];

  // 1. Identificar el número de foja (Mes X)
  const { numeroFoja, metodoDeteccion } = extraerNumeroFoja(sheet, nombreArchivo);
  if (!numeroFoja) {
    throw new Error(
      `No se pudo identificar el número de Foja de Medición en "${nombreArchivo}". Asegúrese de que figure "Foja de Medición Nº X" en la cabecera o en el nombre del archivo.`
    );
  }

  // Convertir hoja a matriz 2D
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  // 2. Localizar las columnas "Item" (Col A por defecto) y "Actual" (Col G por defecto)
  let colItemIdx = 0;
  let colActualIdx = -1;
  let filaHeader = -1;

  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const row = rows[r];
    if (!row) continue;

    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] || '').trim().toUpperCase();

      if (val === 'ACTUAL' || val === 'PRESENTE' || val === 'CANTIDAD ACTUAL') {
        colActualIdx = c;
        filaHeader = r;
      }
      if (val === 'ITEM' || val === 'ÍTEM' || val === 'ITEM Nº' || val === 'Nº') {
        colItemIdx = c;
      }
    }

    if (colActualIdx !== -1) {
      break;
    }
  }

  // Si no se encontró texto "ACTUAL" en las cabeceras, usar el estándar municipal: Columna G (índice 6)
  if (colActualIdx === -1) {
    colActualIdx = 6;
    advertencias.push(
      `No se encontró el encabezado explícito "Actual". Se utilizó la columna G (índice 6) por estándar municipal.`
    );
  }

  // Determinar fila de inicio de datos
  let filaInicioDatos = filaHeader !== -1 ? filaHeader + 1 : 10;
  while (filaInicioDatos < rows.length) {
    const row = rows[filaInicioDatos];
    const str = row.map((c) => String(c || '').trim()).join(' ').toUpperCase();
    if (
      str.includes('[1]') ||
      str.includes('[2]') ||
      str.includes('UNIDAD') ||
      str.includes('CANTIDAD') ||
      str.includes('ACUMULAD')
    ) {
      filaInicioDatos++;
    } else {
      break;
    }
  }

  // 3. Extracción exclusiva de Item y CANTIDAD -> Actual
  const items: FojaItemExtraido[] = [];
  let itemsConCantidad = 0;

  for (let r = filaInicioDatos; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawItem = String(row[colItemIdx] || '').trim();
    const colB = String(row[colItemIdx + 1] || '').trim().toUpperCase();
    const rowStr = row.map((c) => String(c || '').trim().toUpperCase()).join(' ');

    // Detectar fin de tabla / totales al pie
    if (
      rawItem.toUpperCase().startsWith('TOTAL') ||
      rawItem.toUpperCase().startsWith('SUMA') ||
      colB.startsWith('TOTAL') ||
      rowStr.includes('TOTAL GENERAL') ||
      rowStr.includes('TOTAL FOJA') ||
      rowStr.includes('SON PESOS') ||
      rowStr.includes('CERTIFICADO Nº')
    ) {
      break;
    }

    if (!rawItem) continue;

    // Descartar encabezados o textos descriptivos largos
    if (/^(?:ITEM|RUBRO|CAPITULO|DENOMINACION|DESCRIPCION)\b/i.test(rawItem)) {
      continue;
    }

    // Requiere contener al menos un dígito para ser un código de ítem/subítem válido
    if (!/\d/.test(rawItem)) {
      continue;
    }

    const codigoItem = normalizarCodigoItem(rawItem);
    if (!codigoItem) continue;

    // Extraer cantidad actual
    const valActual = row[colActualIdx];
    const cantidadActual = roundTo(parsearNumeroExcel(valActual), 4);

    if (cantidadActual > 0) {
      itemsConCantidad++;
    }

    items.push({
      codigoItem,
      codigoOriginal: rawItem,
      cantidadActual,
    });
  }

  if (items.length === 0) {
    advertencias.push(`No se extrajeron ítems con códigos válidos en "${nombreArchivo}".`);
  }

  return {
    numeroFoja,
    nombreArchivo,
    items,
    totalItems: items.length,
    itemsConCantidad,
    advertencias,
  };
}

/**
 * Cruza las fojas de medición extraídas con los ítems del Plan de Trabajo:
 * - Asigna cantidadActual en avancesPorColumna[`mes_${foja.numeroFoja}`] por coincidencia de ítem
 * - Si un ítem nuevo del Plan de Trabajo no figura en la foja, deja su cantidad en 0 sin error
 * - Actualiza el selector "Certificados Definitivos emitidos hasta el Mes" al mayor número de foja importada
 * - NO modifica carátula, expediente, contratista, precios, ni montos certificados
 */
export function aplicarFojasEnPlanTrabajo(
  itemsActuales: ItemContrato[],
  mesesConfigActuales: MesConfig[],
  mesFinal: number,
  fojas: ResultadoFojaMedicion[]
): ResumenImportacionFojas {
  if (fojas.length === 0) {
    throw new Error('No se proporcionaron Fojas de Medición para aplicar.');
  }

  const advertenciasGenerales: string[] = [];
  const maxNumeroFoja = Math.max(...fojas.map((f) => f.numeroFoja));

  // Mapa de fojas por número de mes
  const fojasPorMes = new Map<number, ResultadoFojaMedicion>();
  fojas.forEach((f) => {
    if (f.numeroFoja >= mesFinal) {
      advertenciasGenerales.push(
        `La Foja Nº ${f.numeroFoja} coincide o supera el Mes Final (${mesFinal}) de cierre. Las cantidades se cargaron como mes ordinario.`
      );
    }
    fojasPorMes.set(f.numeroFoja, f);
  });

  const resumenPorFoja: ResumenImportacionFojas['resumenPorFoja'] = [];

  // Clonar ítems actuales para inmutabilidad
  const nuevosItems = itemsActuales.map((it) => ({
    ...it,
    avancesPorColumna: { ...(it.avancesPorColumna || {}) },
  }));

  // Procesar cada foja importada
  fojasPorMes.forEach((foja, mesNum) => {
    const colKey = `mes_${mesNum}`;

    // Indexar ítems de la foja por código normalizado
    const mapaFoja = new Map<string, number>();
    foja.items.forEach((item) => {
      mapaFoja.set(normalizarCodigoItem(item.codigoItem), item.cantidadActual);
    });

    let itemsActualizados = 0;
    let itemsEnCero = 0;

    nuevosItems.forEach((it) => {
      const codigoPt = normalizarCodigoItem(it.numero);

      if (mapaFoja.has(codigoPt)) {
        const cant = mapaFoja.get(codigoPt)!;
        it.avancesPorColumna[colKey] = cant;
        if (cant > 0) {
          itemsActualizados++;
        } else {
          itemsEnCero++;
        }
      } else {
        // Ítems no presentes en la foja (ej. ítems nuevos de la convalidación que no existían aún):
        // Asignar 0 sin generar error
        it.avancesPorColumna[colKey] = 0;
        itemsEnCero++;
      }
    });

    resumenPorFoja.push({
      foja: mesNum,
      archivo: foja.nombreArchivo,
      itemsActualizados,
      itemsEnCero,
    });
  });

  // Actualizar corte correlativo de Definitivos hasta el mayor número de foja importada
  const nuevoCorteDefinitivo = Math.min(Math.max(0, mesFinal - 1), maxNumeroFoja);
  const nuevasConfigMeses: MesConfig[] = [];

  for (let m = 1; m < mesFinal; m++) {
    const cfgExistente = mesesConfigActuales.find((c) => c.mesNumero === m);

    if (m <= nuevoCorteDefinitivo) {
      nuevasConfigMeses.push({
        mesNumero: m,
        estado: 'definitivo',
        // Conservar monto si ya estaba cargado previamente, o dejarlo undefined para carga manual libre
        montoCertificadoDefinitivo: cfgExistente?.montoCertificadoDefinitivo,
        observaciones: cfgExistente?.observaciones,
      });
    } else {
      nuevasConfigMeses.push({
        mesNumero: m,
        estado: 'provisorio',
        montoCertificadoDefinitivo: undefined,
        observaciones: cfgExistente?.observaciones,
      });
    }
  }

  return {
    fojasProcesadas: fojas,
    maxNumeroFoja,
    nuevosItems,
    nuevasConfigMeses,
    resumenPorFoja,
    advertenciasGenerales,
  };
}

