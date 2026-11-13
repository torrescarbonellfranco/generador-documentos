import * as XLSX from 'xlsx';
import Decimal from 'decimal.js';
import { ItemContrato, ResultadoImportacion, ReconciliacionCuadro } from '@/modules/plan-convalidacion/types/convalidacion';
import { roundTo } from './convalidacionEngine';

/**
 * Función robusta para limpiar y parsear números provenientes de Excel o PDF
 * Soporta formatos argentinos (1.234.567,89), americanos (1,234,567.89), símbolos $, espacios y negativos con paréntesis
 */
export function parsearNumeroExcel(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }

  let str = String(val).trim();
  if (!str) return 0;

  // Manejo de valores contables negativos entre paréntesis: (123,45) -> -123.45
  const esNegativo = str.startsWith('(') && str.endsWith(')');
  str = str.replace(/[()$]/g, '').replace(/\s/g, '').trim();

  // Si tiene puntos y comas: "1.234.567,89" vs "1,234,567.89"
  if (str.includes('.') && str.includes(',')) {
    const ultimoPunto = str.lastIndexOf('.');
    const ultimaComa = str.lastIndexOf(',');
    if (ultimaComa > ultimoPunto) {
      // Formato argentino: punto es miles, coma es decimal
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato anglosajón: coma es miles, punto es decimal
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Solo tiene coma: puede ser decimal (ej. "12,50") o miles
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return esNegativo ? -num : num;
}

/**
 * Normaliza textos de descripciones (elimina saltos de línea y dobles espacios)
 */
export function normalizarTexto(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parser principal de archivos Excel (.xlsx / .xls) del Cuadro Modificatorio
 * Cumple con las 4 reglas críticas para PDFs convertidos a Excel:
 * 1. Nunca resetear ítems al encontrar encabezados repetidos por saltos de página.
 * 2. Detectar y unir descripciones partidas por salto de página (Texto Huérfano) al último ítem.
 * 3. Clasificación estricta de Rubros: SIEMPRE requiere código en Col A y valores 0.
 * 4. Reconciliación cruzada automática contra el pie del cuadro con umbral estricto (< $0.01).
 */
export function parsearCuadroModificatorioExcel(
  fileBuffer: ArrayBuffer
): ResultadoImportacion {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convertir a matriz 2D de celdas
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: true,
  });

  const items: ItemContrato[] = [];
  const advertencias: string[] = [];

  let filaInicioDatos = -1;
  let filaTotales = -1;

  // Objeto para almacenar totales leídos del pie de página
  const leidoExcel: ReconciliacionCuadro['leidoExcel'] = {};

  // Metadatos de la cabecera si están presentes
  const metadatosDetectados: ResultadoImportacion['metadatosDetectados'] = {};

  // Función para determinar si una fila es un encabezado repetido de página
  const esFilaEncabezado = (row: any[]): boolean => {
    if (!row || row.length === 0) return false;
    const colA = String(row[0] || '').trim().toUpperCase();
    const colB = String(row[1] || '').trim().toUpperCase();
    const colE = String(row[4] || '').trim().toUpperCase();
    const colF = String(row[5] || '').trim().toUpperCase();
    const filaStr = row.map((c) => String(c).trim().toUpperCase()).join(' ');

    if (colA === 'ITEM' || colA === 'ÍTEM' || colA === 'Nº' || colA === 'ITEM Nº') {
      return true;
    }
    if (filaStr.includes('OBRA:') || filaStr.includes('EXPEDIENTE:') || filaStr.includes('EXPTE:') || filaStr.includes('CONTRATISTA:') || filaStr.includes('PLAZO:')) {
      return true;
    }
    if (colB.includes('DENOMINACION') || colB.includes('DENOMINACIÓN') || (colB.includes('DESCRIP') && colA.includes('ITEM'))) {
      return true;
    }
    if (colE === 'AUTORIZ.' || colF === 'A AUTORIZ.' || (colE.includes('CANTIDADES') && colE.includes('PARCIALES'))) {
      return true;
    }
    if (filaStr.includes('MUNICIPALIDAD DE NEUQU') || filaStr.includes('SECRETARIA DE OBRAS') || filaStr.includes('SECRETARÍA DE OBRAS')) {
      return true;
    }
    if (filaStr.includes('SECRETARIA DE INFRAESTRUCTURA') || filaStr.includes('CUADRO MODIFICATORIO')) {
      return true;
    }
    if (filaStr.includes('UNID. MED.') || filaStr.includes('PRECIO UNITARIO') || (filaStr.includes('DISMINUCIONES') && filaStr.includes('AUMENTOS'))) {
      return true;
    }
    // Filas con numeración de columnas: [1], [2], [3]...
    if (filaStr.includes('[1]') && filaStr.includes('[2]')) {
      return true;
    }
    return false;
  };

  // Paso 1: Escaneo preliminar de cabecera y búsqueda de metadatos
  for (let r = 0; r < Math.min(rows.length, 20); r++) {
    const row = rows[r];
    const rowStr = row.map((c) => String(c).toUpperCase()).join(' ');

    if (rowStr.includes('OBRA:')) {
      const idx = rowStr.indexOf('OBRA:');
      metadatosDetectados.obra = normalizarTexto(rowStr.substring(idx + 5));
    }
    if (rowStr.includes('EXPEDIENTE:') || rowStr.includes('EXPTE:')) {
      const celdaExp = row.find((c) => String(c).includes('-'));
      if (celdaExp) metadatosDetectados.expediente = normalizarTexto(celdaExp);
    }
    if (rowStr.includes('CONTRATISTA:')) {
      metadatosDetectados.contratista = normalizarTexto(row[row.length - 1] || '');
    }

    if (filaInicioDatos === -1 && esFilaEncabezado(row)) {
      filaInicioDatos = r + 1;
    }
  }

  if (filaInicioDatos === -1) {
    for (let r = 0; r < rows.length; r++) {
      const colA = String(rows[r][0] || '').trim();
      const colB = String(rows[r][1] || '').trim();
      if (colA && colB && !esFilaEncabezado(rows[r])) {
        filaInicioDatos = r;
        break;
      }
    }
  }

  if (filaInicioDatos === -1) {
    filaInicioDatos = 0;
  }

  // Paso 2: Lectura secuencial estricta de filas
  for (let r = filaInicioDatos; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const colA = String(row[0] || '').trim();
    const colB = normalizarTexto(row[1]);
    const colC = normalizarTexto(row[2]);
    const colF = String(row[5] || '').trim().toUpperCase();
    const filaStr = row.map((c) => String(c).trim().toUpperCase()).join(' ');

    // Detectar fin de tabla / Totales oficiales
    // OJO: solo si NO es un encabezado repetido
    if (
      (colF === 'TOTALES' || colA === 'TOTALES' || colA === 'TOTAL' || filaStr.includes('TOTALES GENERALES')) ||
      (filaStr.includes('IMPORTES AUTORIZADOS:') && !filaStr.includes('PARCIALES'))
    ) {
      filaTotales = r;
      break;
    }

    // REGLA 1: Nunca resetear ítems al encontrar encabezados repetidos por salto de página
    if (esFilaEncabezado(row)) {
      // Ignorar metadatos repetidos que aparezcan en medio
      if (filaStr.includes('OBRA:') || filaStr.includes('EXPTE') || filaStr.includes('MUNICIPALIDAD')) {
        continue;
      }
      continue;
    }

    // Saltar filas totalmente vacías
    if (!colA && !colB) {
      continue;
    }

    const rawColD = row[3];
    const rawColE = row[4];
    const rawColF = row[5];
    const precioUnitario = parsearNumeroExcel(rawColD);
    const cantidadOriginal = parsearNumeroExcel(rawColE);
    const cantidadNueva = parsearNumeroExcel(rawColF);

    // REGLA 2: Detectar y unir descripciones partidas por salto de página (Texto Huérfano)
    // Condiciones: Col A vacía, Col B con texto, y Col C, D, E, F sin valores
    const tieneValoresNumericos =
      (rawColD !== '' && rawColD !== null && rawColD !== undefined && precioUnitario !== 0) ||
      (rawColE !== '' && rawColE !== null && rawColE !== undefined && cantidadOriginal !== 0) ||
      (rawColF !== '' && rawColF !== null && rawColF !== undefined && cantidadNueva !== 0);

    if (!colA && colB && !tieneValoresNumericos && !colC) {
      if (items.length > 0) {
        const ultimoItem = items[items.length - 1];
        // Evitar duplicar si la frase ya estaba incluida al final
        if (!ultimoItem.descripcion.endsWith(colB)) {
          ultimoItem.descripcion = `${ultimoItem.descripcion} ${colB}`.trim();
        }
      }
      continue;
    }

    // REGLA 3: Regla estricta para identificar Rubros verdaderos
    // Un Rubro / Título verdadero SIEMPRE tiene un código/número en Col A (ej: "1", "2", "3")
    // y tiene precioUnitario === 0, cantidadOriginal === 0 y cantidadNueva === 0
    const esRubro =
      Boolean(colA) &&
      precioUnitario === 0 &&
      cantidadOriginal === 0 &&
      cantidadNueva === 0;

    // Si no tiene Col A ni valores, ignorar
    if (!colA && !tieneValoresNumericos) {
      continue;
    }

    const importeOriginal = parsearNumeroExcel(row[6]);
    const importeNuevo = parsearNumeroExcel(row[7]);
    const cantidadDisminucion = parsearNumeroExcel(row[8]);
    const importeDisminucion = parsearNumeroExcel(row[9]);
    const cantidadAumento = parsearNumeroExcel(row[10]);
    const importeAumento = parsearNumeroExcel(row[11]);

    items.push({
      id: `imp-${r}-${Math.random().toString(36).substr(2, 5)}`,
      numero: colA,
      descripcion: colB,
      unidad: colC || (esRubro ? '' : 'gl'),
      precioUnitario,
      cantidadOriginal,
      cantidadNueva,
      importeOriginal: importeOriginal || roundTo(precioUnitario * cantidadOriginal, 2),
      importeNuevo: importeNuevo || roundTo(precioUnitario * cantidadNueva, 2),
      cantidadDisminucion,
      importeDisminucion,
      cantidadAumento,
      importeAumento,
      avancesPorColumna: {},
    });
  }

  // Paso 3: Extraer totales oficiales del pie del cuadro (reconciliación)
  if (filaTotales !== -1) {
    for (let r = filaTotales; r < Math.min(rows.length, filaTotales + 12); r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;
      const rowStr = row.map((c) => String(c).toUpperCase()).join(' ');

      // Fila de TOTALES principal (donde Col F sea TOTALES o filaTotales)
      if (r === filaTotales || String(row[5] || '').toUpperCase() === 'TOTALES') {
        const valAut = parsearNumeroExcel(row[6]);
        const valAAut = parsearNumeroExcel(row[7]);
        if (valAut > 0 && !leidoExcel.importesAutorizados) leidoExcel.importesAutorizados = valAut;
        if (valAAut > 0 && !leidoExcel.importesAAutorizar) leidoExcel.importesAAutorizar = valAAut;
        leidoExcel.importesDisminuciones = parsearNumeroExcel(row[9]);
        leidoExcel.importesAumentos = parsearNumeroExcel(row[11]);
      }

      // Otras variantes oficiales del pie (ej. IMPORTES AUTORIZADOS: / IMPORTES A AUTORIZAR:)
      if (rowStr.includes('IMPORTES AUTORIZADOS') || rowStr.includes('IMPORTE AUTORIZADO')) {
        const val = row.find((c, idx) => idx >= 4 && parsearNumeroExcel(c) > 0);
        if (val && !leidoExcel.importesAutorizados) {
          leidoExcel.importesAutorizados = parsearNumeroExcel(val);
        }
      }
      if (rowStr.includes('IMPORTES A AUTORIZAR') || rowStr.includes('IMPORTE A AUTORIZAR')) {
        const val = row.find((c, idx) => idx >= 4 && parsearNumeroExcel(c) > 0);
        if (val && !leidoExcel.importesAAutorizar) {
          leidoExcel.importesAAutorizar = parsearNumeroExcel(val);
        }
      }
      if (rowStr.includes('MENOR GASTO') || rowStr.includes('MAYOR GASTO')) {
        const val = row.find((c, idx) => idx >= 4 && parsearNumeroExcel(c) !== 0);
        if (val) {
          const num = parsearNumeroExcel(val);
          leidoExcel.saldoNeto = rowStr.includes('MENOR GASTO') ? -Math.abs(num) : Math.abs(num);
        }
      }
    }
  }

  // Paso 4: Reconciliación matemática cruzada (REGLA 4: Umbral estricto < $0.01)
  let sumAutorizadosDec = new Decimal(0);
  let sumAAutorizarDec = new Decimal(0);
  let sumDisminucionDec = new Decimal(0);
  let sumAumentoDec = new Decimal(0);

  items.forEach((it) => {
    // Los rubros (precio 0 y cant 0) no se suman
    const esRubro =
      Boolean(it.numero) &&
      it.precioUnitario === 0 &&
      it.cantidadOriginal === 0 &&
      it.cantidadNueva === 0;

    if (!esRubro) {
      const pu = new Decimal(it.precioUnitario || 0);
      const h = new Decimal(it.cantidadOriginal || 0);
      const cv = new Decimal(it.cantidadNueva || 0);

      const impOrig = it.importeOriginal !== undefined && it.importeOriginal !== 0
        ? new Decimal(it.importeOriginal)
        : pu.times(h);

      const impNuevo = it.importeNuevo !== undefined && it.importeNuevo !== 0
        ? new Decimal(it.importeNuevo)
        : pu.times(cv);

      sumAutorizadosDec = sumAutorizadosDec.plus(impOrig);
      sumAAutorizarDec = sumAAutorizarDec.plus(impNuevo);

      if (cv.lessThan(h)) {
        const diffImp = it.importeDisminucion || pu.times(h.minus(cv)).toNumber();
        sumDisminucionDec = sumDisminucionDec.plus(diffImp);
      } else if (cv.greaterThan(h)) {
        const diffImp = it.importeAumento || pu.times(cv.minus(h)).toNumber();
        sumAumentoDec = sumAumentoDec.plus(diffImp);
      }
    }
  });

  const calculadoSuma: ReconciliacionCuadro['calculadoSuma'] = {
    importesAutorizados: roundTo(sumAutorizadosDec, 2),
    importesAAutorizar: roundTo(sumAAutorizarDec, 2),
    importesDisminuciones: roundTo(sumDisminucionDec, 2),
    importesAumentos: roundTo(sumAumentoDec, 2),
    saldoNeto: roundTo(sumAAutorizarDec.minus(sumAutorizadosDec), 2),
  };

  const diferencias: string[] = [];

  // Comprobación con lo leído en Excel (umbral de 1 centavo: $0.01)
  if (leidoExcel.importesAutorizados) {
    const diff = Math.abs(leidoExcel.importesAutorizados - calculadoSuma.importesAutorizados);
    if (diff > 0.01) {
      diferencias.push(
        `Importe Autorizado oficial ($ ${leidoExcel.importesAutorizados.toLocaleString('es-AR')}) difiere de la suma de ítems ($ ${calculadoSuma.importesAutorizados.toLocaleString('es-AR')}) por $ ${diff.toFixed(2)}`
      );
    }
  }

  if (leidoExcel.importesAAutorizar) {
    const diff = Math.abs(leidoExcel.importesAAutorizar - calculadoSuma.importesAAutorizar);
    if (diff > 0.01) {
      diferencias.push(
        `Importe A Autorizar oficial ($ ${leidoExcel.importesAAutorizar.toLocaleString('es-AR')}) difiere de la suma de ítems ($ ${calculadoSuma.importesAAutorizar.toLocaleString('es-AR')}) por $ ${diff.toFixed(2)}`
      );
    }
  }

  const reconciliado = diferencias.length === 0;

  return {
    items,
    reconciliacion: {
      leidoExcel,
      calculadoSuma,
      reconciliado,
      diferencias,
      advertencias,
    },
    metadatosDetectados,
  };
}

/**
 * Genera una plantilla Excel (.xlsx) oficial del Cuadro Modificatorio
 * lista para completar o probar la carga masiva
 */
export function generarPlantillaCuadroModificatorio(): Blob {
  const wb = XLSX.utils.book_new();

  const data = [
    ['MUNICIPALIDAD DE NEUQUÉN', '', '', '', '', '', '', '', '', '', '', ''],
    ['SECRETARÍA DE INFRAESTRUCTURA Y PLANIFICACIÓN URBANA', '', '', '', '', '', '', '', '', '', '', ''],
    ['CUADRO MODIFICATORIO DE CONTRATO (ALTERACIÓN CONTRACTUAL)', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['OBRA: PAVIMENTACIÓN Y DRENAJE PLUVIAL BARRIO CONFLUENCIA', '', '', '', 'EXPEDIENTE: OE-4892-M-2024', '', '', '', '', '', '', ''],
    ['CONTRATISTA: CONSTRUCTORA PATAGÓNICA S.A.', '', '', '', 'PLAZO: 6 MESES', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    [
      'ITEM',
      'DESCRIPCIÓN',
      'UNIDAD',
      'PRECIO UNITARIO',
      'CANTIDADES PARCIALES\nAUTORIZ.',
      'CANTIDADES PARCIALES\nA AUTORIZ.',
      'IMPORTES PARCIALES\nAUTORIZ.',
      'IMPORTES PARCIALES\nA AUTORIZ.',
      'DISMINUCIONES\nCANTIDAD',
      'DISMINUCIONES\nIMPORTE',
      'AUMENTOS\nCANTIDAD',
      'AUMENTOS\nIMPORTE',
    ],
    ['1', 'TRABAJOS PRELIMINARES Y REPLANTEO', '', 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['1.1', 'Cartel de obra reglamentario Municipalidad de Neuquén', 'GL', 650000, 1, 1, 650000, 650000, 0, 0, 0, 0],
    ['1.2', 'Limpieza, desmonte y nivelación de traza', 'M2', 3200, 12500, 12500, 40000000, 40000000, 0, 0, 0, 0],
    ['2', 'MOVIMIENTO DE SUELOS Y BASES', '', 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['2.1', 'Excavación no clasificada para caja de pavimento', 'M3', 5800, 3800, 4600, 22040000, 26680000, 0, 0, 800, 4640000],
    ['2.2', 'Sub-base de suelo seleccionado e=0.15m compactado', 'M2', 4900, 11200, 9800, 54880000, 48020000, 1400, 6860000, 0, 0],
    ['3', 'PAVIMENTO DE HORMIGÓN Y CORDÓN CUNETA', '', 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['3.1', 'Calzada de hormigón simple H-30 e=0.18m con pasadores', 'M2', 14500, 5400, 5400, 78300000, 78300000, 0, 0, 0, 0],
    ['3.2', 'Cordón cuneta integral de hormigón H-25', 'ML', 11200, 1800, 1800, 20160000, 20160000, 0, 0, 0, 0],
    ['3.3', 'Base de hormigón pobre H-17 (Suprimido por proyecto)', 'M2', 6800, 2200, 0, 14960000, 0, 2200, 14960000, 0, 0],
    ['4', 'DESAGÜES PLUVIALES Y OBRAS DE ARTE', '', 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['4.1', 'Conducto de hormigón premoldeado Ø 600mm clase III', 'ML', 24000, 350, 350, 8400000, 8400000, 0, 0, 0, 0],
    ['4.2 (Nuevo)', 'Conducto de hormigón premoldeado Ø 800mm (Ítem Nuevo)', 'ML', 38000, 0, 220, 0, 8360000, 0, 0, 220, 8360000],
    ['', '', '', '', '', 'TOTALES', 239390000, 230570000, '', 21820000, '', 13000000],
    ['', '', '', '', 'MENOR GASTO A APROBAR:', '', -8820000, '', '', '', '', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Anchos de columna
  ws['!cols'] = [
    { wch: 12 }, // A
    { wch: 45 }, // B
    { wch: 10 }, // C
    { wch: 16 }, // D
    { wch: 18 }, // E
    { wch: 18 }, // F
    { wch: 20 }, // G
    { wch: 20 }, // H
    { wch: 16 }, // I
    { wch: 18 }, // J
    { wch: 16 }, // K
    { wch: 18 }, // L
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Cuadro Modificatorio');
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

