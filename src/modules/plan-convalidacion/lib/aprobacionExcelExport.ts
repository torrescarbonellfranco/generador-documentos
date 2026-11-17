import ExcelJS from 'exceljs';
import {
  ResultadoConvalidacion,
  ObraGeneral,
  MesConfig,
  ItemCalculado,
} from '@/modules/plan-convalidacion/types/convalidacion';
import { roundTo } from '@/modules/plan-convalidacion/lib/convalidacionEngine';

/**
 * Convierte un índice numérico de columna (1-based) a letra de Excel (1 -> A, 27 -> AA)
 */
function getColumnLetter(colIndex: number): string {
  let temp: number;
  let letter = '';
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = (colIndex - temp - 1) / 26;
  }
  return letter;
}

/**
 * Genera una imagen PNG del gráfico de Curva S para incrustar en Excel.
 */
function generarImagenCurvaAprobacion(
  puntos: Array<{ name: string; porc: number }>
): string | null {
  if (typeof document === 'undefined') {
    // Fallback para Node.js / tests: PNG válido base64
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }

  const width = 850;
  const height = 400;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Fondo blanco nítido
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Borde exterior
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Encabezado institucional
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px Calibri, Arial, sans-serif';
  ctx.fillText('MUNICIPALIDAD DE NEUQUÉN — ÁREA DE ALTERACIONES CONTRACTUALES', 40, 30);

  ctx.fillStyle = '#475569';
  ctx.font = '11px Calibri, Arial, sans-serif';
  ctx.fillText(
    `Curva de Inversión Acumulada por Aprobación (Mes 1 a Mes ${puntos.length}) — Cierre 100%`,
    40,
    48
  );

  // Área de trazado
  const plotX = 75;
  const plotY = 70;
  const plotW = width - 115;
  const plotH = height - 125;
  const yMax = 100;

  // Eje Y: Guías y porcentajes
  for (let v = 0; v <= 100; v += 20) {
    const yPos = plotY + plotH - (v / yMax) * plotH;
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotX, yPos);
    ctx.lineTo(plotX + plotW, yPos);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px Calibri, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${v}%`, plotX - 8, yPos + 3);
  }

  // Línea de 100%
  const y100 = plotY;
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(plotX, y100);
  ctx.lineTo(plotX + plotW, y100);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 10px Calibri, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('100,00% (Monto Aprobado)', plotX + 10, y100 - 5);

  // Mapeo de puntos X/Y
  const numPuntos = puntos.length;
  const coords = puntos.map((p, idx) => {
    const xPos =
      numPuntos <= 1
        ? plotX + plotW / 2
        : plotX + (idx / (numPuntos - 1)) * plotW;
    const yPos = plotY + plotH - (p.porc / yMax) * plotH;
    return { ...p, x: xPos, y: yPos };
  });

  // Trazar línea de la Curva S
  if (coords.length > 0) {
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 1; i < coords.length; i++) {
      ctx.lineTo(coords[i].x, coords[i].y);
    }
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dibujar marcadores y etiquetas sobre cada punto
    coords.forEach((pt) => {
      // Marcador
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Etiqueta de valor
      const labelText = `${pt.porc.toFixed(2)}%`;
      ctx.font = 'bold 10px Calibri, Arial, sans-serif';
      const tw = ctx.measureText(labelText).width;
      const rx = pt.x - tw / 2 - 4;
      const ry = pt.y - 25;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.fillRect(rx, ry, tw + 8, 16);
      ctx.strokeRect(rx, ry, tw + 8, 16);

      ctx.fillStyle = '#1e3a8a';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, pt.x, ry + 12);

      // Etiqueta del eje X
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 10px Calibri, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pt.name, pt.x, plotY + plotH + 18);
    });
  }

  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
}

/**
 * Exportador oficial a Excel (.xlsx) para el submódulo "Por Aprobación".
 * Basado en la estructura oficial de Neuquén "8480 M 2025 - ALC 01-2026.xlsx".
 *
 * Contiene 3 hojas de cálculo con fórmulas vivas:
 *  1. Plan Trabajo (Modelo)
 *  2. Cálculo Detallado
 *  3. Cuadro Curva
 */
export async function exportarExcelOficialAprobacion(
  obra: ObraGeneral,
  resultado: ResultadoConvalidacion,
  mesesConfig: MesConfig[]
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Municipalidad de Neuquén — Área de Alteraciones Contractuales (SIGAC)';
  workbook.lastModifiedBy = 'SIGAC';
  workbook.created = new Date();
  workbook.modified = new Date();

  const colorNavy = 'FF0038A8';
  const colorLightNavy = 'FFDBEAFE';
  const colorHeaderBg = 'FFF1F5F9';
  const colorGreenBg = 'FFD1FAE5';

  // =========================================================================
  // HOJA 2: CÁLCULO DETALLADO (SE CREA PRIMERO PARA DEFINIR FILAS Y COLUMNAS)
  // =========================================================================
  const wsDetallado = workbook.addWorksheet('Cálculo Detallado', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 8 }],
  });
  wsDetallado.pageSetup = { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0, paperSize: 9 };

  // 1. Título y Membrete Oficial
  wsDetallado.mergeCells('A1:J1');
  const titleCellDet = wsDetallado.getCell('A1');
  titleCellDet.value = 'MUNICIPALIDAD DE NEUQUÉN — ÁREA DE ALTERACIONES CONTRACTUALES';
  titleCellDet.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCellDet.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorNavy } };
  titleCellDet.alignment = { horizontal: 'center', vertical: 'middle' };
  wsDetallado.getRow(1).height = 24;

  wsDetallado.mergeCells('A2:J2');
  const subTitleCellDet = wsDetallado.getCell('A2');
  subTitleCellDet.value = 'CÁLCULO DETALLADO DE AVANCES FÍSICOS Y FINANCIEROS (RÉGIMEN POR APROBACIÓN)';
  subTitleCellDet.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
  subTitleCellDet.alignment = { horizontal: 'center', vertical: 'middle' };
  wsDetallado.getRow(2).height = 18;

  // 2. Metadatos de la Obra
  wsDetallado.getCell('A4').value = 'OBRA:';
  wsDetallado.getCell('A4').font = { bold: true };
  wsDetallado.getCell('B4').value = obra.nombre;
  wsDetallado.getCell('F4').value = 'EXPEDIENTE:';
  wsDetallado.getCell('F4').font = { bold: true };
  wsDetallado.getCell('G4').value = obra.expedienteOriginal || obra.expediente;

  wsDetallado.getCell('A5').value = 'CONTRATISTA:';
  wsDetallado.getCell('A5').font = { bold: true };
  wsDetallado.getCell('B5').value = obra.contratista;
  wsDetallado.getCell('F5').value = 'RÉGIMEN:';
  wsDetallado.getCell('F5').font = { bold: true };
  wsDetallado.getCell('G5').value = 'Por Aprobación (Denominador Único 100% sobre Monto Aprobado)';

  wsDetallado.getCell('A6').value = 'PLAZO ORIGINAL:';
  wsDetallado.getCell('A6').font = { bold: true };
  wsDetallado.getCell('B6').value = obra.plazoObra || `${obra.plazoOriginalMeses} Meses`;
  wsDetallado.getCell('F6').value = 'MES DE CIERRE:';
  wsDetallado.getCell('F6').font = { bold: true };
  wsDetallado.getCell('G6').value = `Mes ${obra.mesFinal} (Cierre unificado al 100,0000%)`;

  // Etiqueta de control de cierre en fila 5
  wsDetallado.getCell('J5').value = 'CONTROL CIERRE:';
  wsDetallado.getCell('J5').font = { bold: true, size: 8, color: { argb: 'FF64748B' } };
  wsDetallado.getCell('J5').alignment = { horizontal: 'right', vertical: 'middle' };

  // 3. Encabezados Fijos (Fila 8)
  const headerRowIdx = 8;
  const fixedHeaders = [
    { title: 'Ítem Nº', width: 10 },
    { title: 'Descripción del Ítem', width: 38 },
    { title: 'Unid.', width: 8 },
    { title: 'P. Unitario ($)', width: 16 },
    { title: 'Cant. Original (H)', width: 15 },
    { title: 'Total Básico ($)', width: 18 },
    { title: 'Incid. Orig.', width: 12 },
    { title: 'Cant. Modif. (CV)', width: 15 },
    { title: 'Total Modif. ($)', width: 18 },
    { title: 'Incid. Modif.', width: 12 },
  ];

  fixedHeaders.forEach((h, idx) => {
    const colNumber = idx + 1;
    const cell = wsDetallado.getCell(headerRowIdx, colNumber);
    cell.value = h.title;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorHeaderBg } };
    cell.alignment = {
      horizontal: idx >= 3 ? 'right' : idx === 2 || idx === 0 ? 'center' : 'left',
      vertical: 'middle',
    };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
    wsDetallado.getColumn(colNumber).width = h.width;
  });

  // Columnas dinámicas mensuales (Mes 1 a Mes mesFinal)
  const colMonthMap: Record<string, number> = {};
  let currColIdx = fixedHeaders.length + 1;

  resultado.columnas.forEach((col) => {
    colMonthMap[col.id] = currColIdx;
    const cell = wsDetallado.getCell(headerRowIdx, currColIdx);
    cell.value = col.label;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colorLightNavy },
    };
    cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
    wsDetallado.getColumn(currColIdx).width = 15;

    // Marca "X" en la fila 5 para auditoría en el mes final de cierre
    if (col.mesNumero === obra.mesFinal) {
      const xCell = wsDetallado.getCell(5, currColIdx);
      xCell.value = 'X';
      xCell.font = { bold: true, color: { argb: 'FFDC2626' } };
      xCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    currColIdx++;
  });

  // Columnas de auditoría física al final de la tabla
  const colEjecTotal = currColIdx;
  wsDetallado.getCell(headerRowIdx, colEjecTotal).value = 'Total Ejecutado';
  wsDetallado.getColumn(colEjecTotal).width = 16;
  currColIdx++;

  const colSaldoPend = currColIdx;
  wsDetallado.getCell(headerRowIdx, colSaldoPend).value = 'Saldo Pendiente';
  wsDetallado.getColumn(colSaldoPend).width = 16;
  currColIdx++;

  [colEjecTotal, colSaldoPend].forEach((colNum) => {
    const c = wsDetallado.getCell(headerRowIdx, colNum);
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF065F46' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorGreenBg } };
    c.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
    c.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
  });

  wsDetallado.getRow(headerRowIdx).height = 28;

  // Llenar Filas de Ítems en Cálculo Detallado (desde fila 9)
  const startRow = 9;
  const totalRowIdx = startRow + resultado.itemsCalculados.length;

  resultado.itemsCalculados.forEach((calc, i) => {
    const rowIdx = startRow + i;
    const it = calc.item;
    const isTitle = calc.esTitulo;
    const row = wsDetallado.getRow(rowIdx);

    row.getCell(1).value = it.numero;
    row.getCell(2).value = it.descripcion;

    if (isTitle) {
      row.font = { bold: true };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      for (let c = 3; c < currColIdx; c++) {
        row.getCell(c).value = '-';
        row.getCell(c).alignment = { horizontal: 'center' };
      }
    } else {
      row.getCell(3).value = it.unidad || 'GL';
      row.getCell(3).alignment = { horizontal: 'center' };

      row.getCell(4).value = it.precioUnitario;
      row.getCell(4).numFmt = '$ #,##0.00';

      row.getCell(5).value = it.cantidadOriginal;
      row.getCell(5).numFmt = '#,##0.0000';

      row.getCell(6).value = { formula: `D${rowIdx}*E${rowIdx}` };
      row.getCell(6).numFmt = '$ #,##0.00';

      // Incidencia Original
      row.getCell(7).value = {
        formula: `IF($F$${totalRowIdx}>0, F${rowIdx}/$F$${totalRowIdx}, 0)`,
      };
      row.getCell(7).numFmt = '0.00%';

      row.getCell(8).value = it.cantidadNueva;
      row.getCell(8).numFmt = '#,##0.0000';

      row.getCell(9).value = { formula: `D${rowIdx}*H${rowIdx}` };
      row.getCell(9).numFmt = '$ #,##0.00';

      // Incidencia Modificada (Denominador Único en Monto Modificado $I$Total)
      row.getCell(10).value = {
        formula: `IF($I$${totalRowIdx}>0, I${rowIdx}/$I$${totalRowIdx}, 0)`,
      };
      row.getCell(10).numFmt = '0.00%';

      // Avances Físicos Mensuales
      resultado.columnas.forEach((col) => {
        const colNum = colMonthMap[col.id];
        const val = it.avancesPorColumna?.[col.id] || 0;
        const cell = row.getCell(colNum);
        cell.value = val;
        cell.numFmt = '#,##0.0000';
      });

      // Fórmulas de control de ejecución física
      const firstMonthCol = getColumnLetter(fixedHeaders.length + 1);
      const lastMonthCol = getColumnLetter(colMonthMap[`mes_${obra.mesFinal}`]);

      row.getCell(colEjecTotal).value = {
        formula: `SUM(${firstMonthCol}${rowIdx}:${lastMonthCol}${rowIdx})`,
      };
      row.getCell(colEjecTotal).numFmt = '#,##0.0000';

      row.getCell(colSaldoPend).value = {
        formula: `H${rowIdx} - ${getColumnLetter(colEjecTotal)}${rowIdx}`,
      };
      row.getCell(colSaldoPend).numFmt = '#,##0.0000';
    }

    row.height = 20;
  });

  // Fila de Totales en Cálculo Detallado
  const totalRowDet = wsDetallado.getRow(totalRowIdx);
  totalRowDet.getCell(2).value = 'TOTALES GENERALES:';
  totalRowDet.getCell(2).font = { bold: true };
  totalRowDet.getCell(2).alignment = { horizontal: 'right' };

  totalRowDet.getCell(6).value = { formula: `SUM(F${startRow}:F${totalRowIdx - 1})` };
  totalRowDet.getCell(6).numFmt = '$ #,##0.00';

  totalRowDet.getCell(7).value = { formula: `SUM(G${startRow}:G${totalRowIdx - 1})` };
  totalRowDet.getCell(7).numFmt = '100.00%';

  totalRowDet.getCell(9).value = { formula: `SUM(I${startRow}:I${totalRowIdx - 1})` };
  totalRowDet.getCell(9).numFmt = '$ #,##0.00';

  totalRowDet.getCell(10).value = { formula: `SUM(J${startRow}:J${totalRowIdx - 1})` };
  totalRowDet.getCell(10).numFmt = '100.00%';

  // Fila de sumas mensuales en Cálculo Detallado
  resultado.columnas.forEach((col, idx) => {
    const colNum = colMonthMap[col.id];
    const cell = totalRowDet.getCell(colNum);
    const curvaColLetter = getColumnLetter(idx + 2);
    cell.value = { formula: `'Cuadro Curva'!${curvaColLetter}10` };
    cell.numFmt = '$ #,##0.00';
    cell.font = { bold: true };
  });

  totalRowDet.font = { bold: true };
  totalRowDet.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  for (let c = 1; c < currColIdx; c++) {
    totalRowDet.getCell(c).border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
    };
  }
  totalRowDet.height = 24;

  // =========================================================================
  // HOJA 3: CUADRO DE CURVA OFICIAL + GRÁFICO S
  // =========================================================================
  const wsCurva = workbook.addWorksheet('Cuadro Curva', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 7 }],
  });
  wsCurva.pageSetup = { orientation: 'landscape', fitToWidth: 1, fitToHeight: 1, paperSize: 9 };

  // Título Hoja 3
  wsCurva.mergeCells('A1:H1');
  const tCurva = wsCurva.getCell('A1');
  tCurva.value = 'MUNICIPALIDAD DE NEUQUÉN — ÁREA DE ALTERACIONES CONTRACTUALES';
  tCurva.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  tCurva.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorNavy } };
  tCurva.alignment = { horizontal: 'center', vertical: 'middle' };
  wsCurva.getRow(1).height = 24;

  wsCurva.getCell('A3').value = 'OBRA:';
  wsCurva.getCell('A3').font = { bold: true };
  wsCurva.getCell('B3').value = obra.nombre;
  wsCurva.getCell('A4').value = 'EXPEDIENTE:';
  wsCurva.getCell('A4').font = { bold: true };
  wsCurva.getCell('B4').value = obra.expedienteOriginal || obra.expediente;

  wsCurva.getCell('E3').value = 'MONTO ORIGINAL:';
  wsCurva.getCell('E3').font = { bold: true };
  wsCurva.getCell('F3').value = { formula: `'Cálculo Detallado'!F${totalRowIdx}` };
  wsCurva.getCell('F3').numFmt = '$ #,##0.00';
  wsCurva.getCell('F3').font = { bold: true };

  wsCurva.getCell('E4').value = 'MONTO APROBADO TOTAL:';
  wsCurva.getCell('E4').font = { bold: true };
  wsCurva.getCell('F4').value = { formula: `'Cálculo Detallado'!I${totalRowIdx}` };
  wsCurva.getCell('F4').numFmt = '$ #,##0.00';
  wsCurva.getCell('F4').font = { bold: true, color: { argb: 'FF065F46' } };

  // Encabezado Cuadro Oficial (Fila 7)
  const curvaHeaderRow = 7;
  wsCurva.getCell('A7').value = 'RUBRO / CONCEPTO';
  wsCurva.getCell('A7').font = { bold: true };
  wsCurva.getCell('A7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorHeaderBg } };
  wsCurva.getColumn(1).width = 30;

  resultado.columnas.forEach((col, idx) => {
    const colNum = idx + 2;
    const cell = wsCurva.getCell(curvaHeaderRow, colNum);
    cell.value = col.label;
    cell.font = { bold: true, color: { argb: 'FF1E3A8A' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colorLightNavy },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
    wsCurva.getColumn(colNum).width = 16;
  });

  const filaPorcMensual = wsCurva.getRow(8);
  const filaPorcAcumulado = wsCurva.getRow(9);
  const filaMontoMensual = wsCurva.getRow(10);
  const filaMontoAcumulado = wsCurva.getRow(11);

  filaPorcMensual.getCell(1).value = 'Avance Físico Mensual (%)';
  filaPorcAcumulado.getCell(1).value = 'Avance Físico Acumulado (%)';
  filaMontoMensual.getCell(1).value = 'Inversión Mensual ($)';
  filaMontoAcumulado.getCell(1).value = 'Inversión Acumulada ($)';

  for (let r = 8; r <= 11; r++) {
    wsCurva.getRow(r).getCell(1).font = { bold: true };
    wsCurva.getRow(r).getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colorHeaderBg },
    };
  }

  // Llenar columnas de Curva con fórmulas vivas
  const modStartRow = 10;
  const modTotalRowIdx = modStartRow + resultado.itemsCalculados.length;
  const modFilaPorcMIdx = modTotalRowIdx + 1;

  resultado.curva.forEach((fc, idx) => {
    const colNum = idx + 2;
    const colLetter = getColumnLetter(colNum);
    const prevColLetter = idx > 0 ? getColumnLetter(colNum - 1) : null;
    const modColLetter = getColumnLetter(6 + 1 + idx); // 6 columnas fijas en Plan Trabajo (Modelo)

    const cPorcM = filaPorcMensual.getCell(colNum);
    const cPorcA = filaPorcAcumulado.getCell(colNum);
    const cMontoM = filaMontoMensual.getCell(colNum);
    const cMontoA = filaMontoAcumulado.getCell(colNum);

    const esFinal = fc.mesNumero === obra.mesFinal;
    const cfg = mesesConfig.find((m) => m.mesNumero === fc.mesNumero);
    const esDefinitivo = !esFinal && cfg?.estado === 'definitivo';

    if (esDefinitivo && cfg?.montoCertificadoDefinitivo) {
      cMontoM.value = roundTo(cfg.montoCertificadoDefinitivo, 2);
      cPorcM.value = { formula: `ROUND(${colLetter}10/'Cálculo Detallado'!$I$${totalRowIdx}, 6)` };

      if (!prevColLetter) {
        cMontoA.value = { formula: `${colLetter}10` };
        cPorcA.value = { formula: `${colLetter}8` };
      } else {
        cMontoA.value = { formula: `${prevColLetter}11+${colLetter}10` };
        cPorcA.value = { formula: `${prevColLetter}9+${colLetter}8` };
      }
    } else if (!esFinal) {
      // Provisorio: toma % de Plan de Trabajo Modelo y calcula monto sobre $I$Total
      cPorcM.value = { formula: `'Plan Trabajo (Modelo)'!${modColLetter}${modFilaPorcMIdx}` };
      cMontoM.value = { formula: `ROUND(${colLetter}8*'Cálculo Detallado'!$I$${totalRowIdx}, 2)` };

      if (!prevColLetter) {
        cMontoA.value = { formula: `${colLetter}10` };
        cPorcA.value = { formula: `${colLetter}8` };
      } else {
        cMontoA.value = { formula: `${prevColLetter}11+${colLetter}10` };
        cPorcA.value = { formula: `${prevColLetter}9+${colLetter}8` };
      }
    } else {
      // Mes Final: Cierre exacto al 100,0000% y Monto Aprobado Total
      cPorcA.value = 1.0;
      cMontoA.value = { formula: `'Cálculo Detallado'!$I$${totalRowIdx}` };
      cPorcM.value = prevColLetter ? { formula: `1-${prevColLetter}9` } : 1.0;
      cMontoM.value = prevColLetter
        ? { formula: `'Cálculo Detallado'!$I$${totalRowIdx}-${prevColLetter}11` }
        : { formula: `'Cálculo Detallado'!$I$${totalRowIdx}` };
    }

    cPorcM.numFmt = '0.0000%';
    cPorcA.numFmt = '0.0000%';
    cMontoM.numFmt = '$ #,##0.00';
    cMontoA.numFmt = '$ #,##0.00';

    cPorcM.alignment = { horizontal: 'right' };
    cPorcA.alignment = { horizontal: 'right' };
    cMontoM.alignment = { horizontal: 'right' };
    cMontoA.alignment = { horizontal: 'right' };

    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
    cPorcM.border = thinBorder;
    cPorcA.border = thinBorder;
    cMontoM.border = thinBorder;
    cMontoA.border = thinBorder;
  });

  const expRow = wsCurva.getRow(13);
  expRow.getCell(1).value = `NOTA OFICIAL: Bajo régimen de Aprobación, el denominador único de toda la serie es el Monto Aprobado Total ($I$${totalRowIdx}), cerrando exactamente al 100,0000%.`;
  expRow.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF475569' } };

  // Gráfico S incrustado en Hoja 3
  const puntosCurva = resultado.curva.map((fc) => ({
    name: `Mes ${fc.mesNumero}`,
    porc: +(fc.porcentajeAcumulado * 100),
  }));

  wsCurva.getCell('A15').value = 'GRÁFICO DE CURVA S DE INVERSIÓN ACUMULADA (POR APROBACIÓN):';
  wsCurva.getCell('A15').font = { bold: true, size: 10, color: { argb: colorNavy } };

  const base64Chart = generarImagenCurvaAprobacion(puntosCurva);
  if (base64Chart) {
    const chartImgId = workbook.addImage({
      base64: base64Chart,
      extension: 'png',
    });
    wsCurva.addImage(chartImgId, {
      tl: { col: 1, row: 16 },
      ext: { width: 780, height: 370 },
    });
  }

  // =========================================================================
  // HOJA 1: PLAN DE TRABAJO (MODELO) - COLOCADA AL INICIO
  // =========================================================================
  const wsModelo = workbook.addWorksheet('Plan Trabajo (Modelo)', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 9 }],
  });
  (wsModelo as any).orderNo = 1;
  wsModelo.pageSetup = { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0, paperSize: 9 };

  // Membrete Oficial
  wsModelo.mergeCells('A1:L1');
  const tMod1 = wsModelo.getCell('A1');
  tMod1.value = 'MUNICIPALIDAD DE NEUQUÉN — ÁREA DE ALTERACIONES CONTRACTUALES';
  tMod1.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  tMod1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorNavy } };
  tMod1.alignment = { horizontal: 'center', vertical: 'middle' };
  wsModelo.getRow(1).height = 24;

  wsModelo.mergeCells('A2:L2');
  const tMod2 = wsModelo.getCell('A2');
  tMod2.value = 'PLAN DE TRABAJO Y CURVA DE INVERSIÓN POR APROBACIÓN CONTRACTUAL';
  tMod2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
  tMod2.alignment = { horizontal: 'center', vertical: 'middle' };
  wsModelo.getRow(2).height = 18;

  // Carátula Oficial
  wsModelo.getCell('A4').value = 'OBRA:';
  wsModelo.getCell('A4').font = { bold: true, size: 9 };
  wsModelo.getCell('B4').value = obra.nombre;

  wsModelo.getCell('G4').value = 'EXPTE. ORIGINAL:';
  wsModelo.getCell('G4').font = { bold: true, size: 9 };
  wsModelo.getCell('H4').value = obra.expedienteOriginal || obra.expediente;

  wsModelo.getCell('A5').value = 'CONTRATISTA:';
  wsModelo.getCell('A5').font = { bold: true, size: 9 };
  wsModelo.getCell('B5').value = obra.contratista;

  wsModelo.getCell('G5').value = 'EXPTE. AMPLIACIÓN:';
  wsModelo.getCell('G5').font = { bold: true, size: 9 };
  wsModelo.getCell('H5').value = obra.expedienteAmpliacion || 'S/D (Aprobación)';

  wsModelo.getCell('A6').value = 'FECHA INICIO:';
  wsModelo.getCell('A6').font = { bold: true, size: 9 };
  wsModelo.getCell('B6').value = obra.fechaInicio || 'Según Acta';

  wsModelo.getCell('G6').value = 'PLAZO DE OBRA:';
  wsModelo.getCell('G6').font = { bold: true, size: 9 };
  wsModelo.getCell('H6').value = obra.plazoObra || `${obra.plazoOriginalMeses} Meses`;

  wsModelo.getCell('A7').value = 'TERM. S/CONTRATO:';
  wsModelo.getCell('A7').font = { bold: true, size: 9 };
  wsModelo.getCell('B7').value = obra.fechaTerminacionContrato || '-';

  wsModelo.getCell('G7').value = 'TERM. C/AMPLIACIÓN:';
  wsModelo.getCell('G7').font = { bold: true, size: 9 };
  wsModelo.getCell('H7').value = obra.fechaTerminacionAmpliacion || '-';

  // Encabezados Fijos Tabla Modelo (Fila 9)
  const modFixedHeaders = [
    { title: 'Nº', width: 8 },
    { title: 'Descripción del Ítem', width: 36 },
    { title: 'Costo Básico ($)', width: 16 },
    { title: 'Inc. Orig. (%)', width: 12 },
    { title: 'Costo Modif. ($)', width: 16 },
    { title: 'Inc. Modif. (%)', width: 12 },
  ];

  modFixedHeaders.forEach((h, idx) => {
    const colNumber = idx + 1;
    const cell = wsModelo.getCell(9, colNumber);
    cell.value = h.title;
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorHeaderBg } };
    cell.alignment = {
      horizontal: idx >= 2 ? 'right' : idx === 0 ? 'center' : 'left',
      vertical: 'middle',
    };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
    wsModelo.getColumn(colNumber).width = h.width;
  });

  // Columnas mensuales
  resultado.columnas.forEach((col, idx) => {
    const colNum = modFixedHeaders.length + 1 + idx;
    const cell = wsModelo.getCell(9, colNum);
    cell.value = col.label;
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E3A8A' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colorLightNavy },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
    wsModelo.getColumn(colNum).width = 13;
  });

  wsModelo.getRow(9).height = 26;

  // Llenar Filas Porcentuales por Ítem en Plan Trabajo Modelo (desde fila 10)
  resultado.itemsCalculados.forEach((calc, i) => {
    const rowIdx = modStartRow + i;
    const detRowIdx = startRow + i;
    const it = calc.item;
    const isTitle = calc.esTitulo;
    const row = wsModelo.getRow(rowIdx);

    row.getCell(1).value = it.numero;
    row.getCell(2).value = it.descripcion;

    if (isTitle) {
      row.font = { bold: true };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      for (let c = 3; c <= modFixedHeaders.length + resultado.columnas.length; c++) {
        row.getCell(c).value = '-';
        row.getCell(c).alignment = { horizontal: 'center' };
      }
    } else {
      row.getCell(3).value = { formula: `'Cálculo Detallado'!F${detRowIdx}` };
      row.getCell(3).numFmt = '$ #,##0.00';

      row.getCell(4).value = { formula: `'Cálculo Detallado'!G${detRowIdx}` };
      row.getCell(4).numFmt = '0.00%';

      row.getCell(5).value = { formula: `'Cálculo Detallado'!I${detRowIdx}` };
      row.getCell(5).numFmt = '$ #,##0.00';

      row.getCell(6).value = { formula: `'Cálculo Detallado'!J${detRowIdx}` };
      row.getCell(6).numFmt = '0.00%';

      // En Aprobación, el % de avance de cada ítem en cada mes es respecto de Cantidad Nueva (Col H en Cálculo Detallado)
      resultado.columnas.forEach((col, idx) => {
        const colNum = modFixedHeaders.length + 1 + idx;
        const detColLetter = getColumnLetter(colMonthMap[col.id]);
        const cell = row.getCell(colNum);

        cell.value = {
          formula: `IF('Cálculo Detallado'!H${detRowIdx}>0, 'Cálculo Detallado'!${detColLetter}${detRowIdx}/'Cálculo Detallado'!H${detRowIdx}, 0)`,
        };
        cell.numFmt = '0.00%';
        cell.alignment = { horizontal: 'center' };
      });
    }

    row.height = 19;
  });

  // Fila de Totales de Obra en Plan de Trabajo Modelo
  const modTotalRow = wsModelo.getRow(modTotalRowIdx);
  modTotalRow.getCell(2).value = 'TOTALES DE OBRA:';
  modTotalRow.getCell(2).font = { bold: true };
  modTotalRow.getCell(2).alignment = { horizontal: 'right' };

  modTotalRow.getCell(3).value = { formula: `SUM(C${modStartRow}:C${modTotalRowIdx - 1})` };
  modTotalRow.getCell(3).numFmt = '$ #,##0.00';

  modTotalRow.getCell(4).value = { formula: `C${modTotalRowIdx}/E${modTotalRowIdx}` };
  modTotalRow.getCell(4).numFmt = '0.00%';

  modTotalRow.getCell(5).value = { formula: `SUM(E${modStartRow}:E${modTotalRowIdx - 1})` };
  modTotalRow.getCell(5).numFmt = '$ #,##0.00';

  modTotalRow.getCell(6).value = 1.0;
  modTotalRow.getCell(6).numFmt = '100.00%';

  for (let c = modFixedHeaders.length + 1; c <= modFixedHeaders.length + resultado.columnas.length; c++) {
    modTotalRow.getCell(c).value = '-';
    modTotalRow.getCell(c).alignment = { horizontal: 'center' };
  }

  modTotalRow.font = { bold: true };
  modTotalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  for (let c = 1; c <= modFixedHeaders.length + resultado.columnas.length; c++) {
    modTotalRow.getCell(c).border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'thin', color: { argb: 'FF0F172A' } },
    };
  }
  modTotalRow.height = 22;

  // Filas al pie de Plan de Trabajo Modelo: % Avance Mensual y % Acumulado
  const filaModeloPorcM = wsModelo.getRow(modFilaPorcMIdx);
  filaModeloPorcM.getCell(2).value = '% AVANCE FÍSICO MENSUAL:';
  filaModeloPorcM.getCell(2).font = { bold: true };
  filaModeloPorcM.getCell(2).alignment = { horizontal: 'right' };

  resultado.columnas.forEach((col, idx) => {
    const colNum = modFixedHeaders.length + 1 + idx;
    const colLetter = getColumnLetter(colNum);
    const curvaColLetter = getColumnLetter(idx + 2);
    const cell = filaModeloPorcM.getCell(colNum);

    // Usa SUMPRODUCT de los % de avance por la Incidencia Nueva de Cálculo Detallado
    cell.value = {
      formula: `SUMPRODUCT(${colLetter}${modStartRow}:${colLetter}${modTotalRowIdx - 1}, 'Cálculo Detallado'!$J$${startRow}:$J$${totalRowIdx - 1})`,
    };
    cell.numFmt = '0.00%';
    cell.alignment = { horizontal: 'center' };
    cell.font = { bold: true, color: { argb: 'FF1E3A8A' } };
  });

  filaModeloPorcM.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
  filaModeloPorcM.height = 20;

  const filaModeloPorcA = wsModelo.getRow(modFilaPorcMIdx + 1);
  filaModeloPorcA.getCell(2).value = '% AVANCE FÍSICO ACUMULADO:';
  filaModeloPorcA.getCell(2).font = { bold: true };
  filaModeloPorcA.getCell(2).alignment = { horizontal: 'right' };

  resultado.columnas.forEach((col, idx) => {
    const colNum = modFixedHeaders.length + 1 + idx;
    const curvaColLetter = getColumnLetter(idx + 2);
    const cell = filaModeloPorcA.getCell(colNum);
    cell.value = { formula: `'Cuadro Curva'!${curvaColLetter}9` };
    cell.numFmt = '0.00%';
    cell.alignment = { horizontal: 'center' };
    cell.font = { bold: true, color: { argb: 'FF0F172A' } };
  });

  filaModeloPorcA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
  for (let c = 1; c <= modFixedHeaders.length + resultado.columnas.length; c++) {
    filaModeloPorcA.getCell(c).border = {
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
    };
  }
  filaModeloPorcA.height = 22;

  // Generar Buffer del archivo Excel
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

