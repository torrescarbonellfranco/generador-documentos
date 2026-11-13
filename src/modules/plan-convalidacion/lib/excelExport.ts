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
 * Genera una imagen PNG del gráfico de Curva S consolidada para incrustar en Excel.
 * En el navegador dibuja un canvas 2D con la curva, marcadores, etiquetas % y línea de 100%.
 * En Node.js (tests) provee un PNG válido en base64 para validar la inserción sin DOM.
 */
function generarImagenCurvaConsolidada(
  puntos: Array<{ name: string; porc: number }>,
  yMax: number
): string | null {
  if (typeof document === 'undefined') {
    // Fallback para Node.js (pruebas unitarias): PNG válido mínimo en base64
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

  // Borde exterior sutil
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Encabezado del gráfico
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px Calibri, Arial, sans-serif';
  ctx.fillText('MUNICIPALIDAD DE NEUQUÉN — ÁREA DE ALTERACIONES CONTRACTUALES', 40, 30);

  ctx.fillStyle = '#475569';
  ctx.font = '11px Calibri, Arial, sans-serif';
  ctx.fillText(`Curva de Inversión Acumulada por Convalidación (Mes 1 a Mes ${puntos.length})`, 40, 48);

  // Área de trazado de la curva
  const plotX = 75;
  const plotY = 70;
  const plotW = width - 115;
  const plotH = height - 125;

  // Eje Y: Guías y porcentajes
  const stepY = yMax <= 120 ? 20 : 25;
  for (let v = 0; v <= yMax; v += stepY) {
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

  // Línea horizontal punteada de referencia en 100,00%
  const y100 = plotY + plotH - (100 / yMax) * plotH;
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(plotX, y100);
  ctx.lineTo(plotX + plotW, y100);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 10px Calibri, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('100,00% (Contrato Básico)', plotX + 10, y100 - 6);

  // Coordenadas calculadas
  const numPts = puntos.length;
  const coords = puntos.map((p, idx) => {
    const x = numPts > 1 ? plotX + (idx / (numPts - 1)) * plotW : plotX + plotW / 2;
    const y = plotY + plotH - (p.porc / yMax) * plotH;
    return { x, y, name: p.name, porc: p.porc };
  });

  // Área sombreada suave bajo la curva
  if (coords.length > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(coords[0].x, plotY + plotH);
    coords.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(coords[coords.length - 1].x, plotY + plotH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, plotY, 0, plotY + plotH);
    grad.addColorStop(0, 'rgba(29, 78, 216, 0.16)');
    grad.addColorStop(1, 'rgba(29, 78, 216, 0.01)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  // Trazado de la Línea S
  ctx.strokeStyle = '#1d4ed8';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  coords.forEach((pt, idx) => {
    if (idx === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  // Marcadores de puntos y etiquetas de porcentaje
  coords.forEach((pt) => {
    // Marcador circular
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Etiqueta de Porcentaje con píldora de fondo
    const labelText = `${pt.porc.toFixed(2).replace('.', ',')}%`;
    ctx.font = 'bold 10px monospace';
    const textW = ctx.measureText(labelText).width;
    const boxW = textW + 10;
    const boxH = 18;
    const boxX = pt.x - boxW / 2;
    const boxY = pt.y - 25;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#1e3a8a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, pt.x, boxY + boxH / 2);

    // Etiqueta de Mes en Eje X
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 10px Calibri, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(pt.name, pt.x, plotY + plotH + 12);
  });

  return canvas.toDataURL('image/png').split(',')[1];
}

/**
 * Genera y descarga el archivo Excel oficial con 3 pestañas, fórmulas vivas y sin bloques de firma:
 * 1. 'Plan Trabajo (Modelo)': Carátula + tabla porcentual por ítem con fórmulas IF
 * 2. 'Cálculo Detallado': Sábana completa de cómputo físico, precios unitarios, montos $ y saldos
 * 3. 'Cuadro Curva': Resumen de 4 filas + Gráfico de Curva S consolidada
 */
export async function exportarExcelOficial(
  obra: ObraGeneral,
  resultado: ResultadoConvalidacion,
  mesesConfig: MesConfig[]
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Municipalidad de Neuquén — Área de Alteraciones Contractuales';
  workbook.created = new Date();

  const colorNavy = '1E3A8A'; // Tailwind blue-900
  const colorLightNavy = 'EFF6FF';
  const colorHeaderBg = 'F1F5F9'; // slate-100
  const colorAccentBg = 'E2E8F0'; // slate-200
  const colorGreenBg = 'DCFCE7'; // emerald-100

  // =========================================================================
  // HOJA 2: CÁLCULO DETALLADO (CREADA PRIMERO PARA MAPEADO DE CELDAS)
  // =========================================================================
  const wsDetallado = workbook.addWorksheet('Cálculo Detallado', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 8 }],
  });
  wsDetallado.pageSetup = { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0, paperSize: 9 };

  // Título y Membrete Oficial en Cálculo Detallado
  wsDetallado.mergeCells('A1:J1');
  const titleCellDet = wsDetallado.getCell('A1');
  titleCellDet.value = 'MUNICIPALIDAD DE NEUQUÉN — ÁREA DE ALTERACIONES CONTRACTUALES';
  titleCellDet.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCellDet.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorNavy } };
  titleCellDet.alignment = { horizontal: 'center', vertical: 'middle' };
  wsDetallado.getRow(1).height = 24;

  wsDetallado.mergeCells('A2:J2');
  const subTitleCellDet = wsDetallado.getCell('A2');
  subTitleCellDet.value = 'CÁLCULO DETALLADO DE AVANCES FÍSICOS Y FINANCIEROS (CONVALIDACIÓN)';
  subTitleCellDet.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
  subTitleCellDet.alignment = { horizontal: 'center', vertical: 'middle' };
  wsDetallado.getRow(2).height = 18;

  // Metadatos de la Obra en Cálculo Detallado
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
  wsDetallado.getCell('G5').value = `Convalidación (${resultado.descripcionEscenario})`;

  wsDetallado.getCell('A6').value = 'PLAZO ORIGINAL:';
  wsDetallado.getCell('A6').font = { bold: true };
  wsDetallado.getCell('B6').value = obra.plazoObra || `${obra.plazoOriginalMeses} Meses`;
  wsDetallado.getCell('F6').value = 'MES DE CIERRE:';
  wsDetallado.getCell('F6').font = { bold: true };
  wsDetallado.getCell('G6').value = `Mes ${obra.mesFinal} (${resultado.hayAdicionales ? 'Desdoblado en Obra Orig. y Adicionales' : 'Columna única'})`;

  // Etiqueta para la fila de control "X" en Fila 5
  wsDetallado.getCell('J5').value = 'CONTROL CIERRE:';
  wsDetallado.getCell('J5').font = { bold: true, size: 8, color: { argb: 'FF64748B' } };
  wsDetallado.getCell('J5').alignment = { horizontal: 'right', vertical: 'middle' };

  // Encabezados de Tabla Detallada (Fila 8)
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
    cell.alignment = { horizontal: idx >= 3 ? 'right' : idx === 2 || idx === 0 ? 'center' : 'left', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
    wsDetallado.getColumn(colNumber).width = h.width;
  });

  // Columnas dinámicas mensuales en Cálculo Detallado
  const colMonthMap: Record<string, number> = {};
  let currColIdx = fixedHeaders.length + 1;

  resultado.columnas.forEach((col) => {
    colMonthMap[col.id] = currColIdx;
    const cell = wsDetallado.getCell(headerRowIdx, currColIdx);
    cell.value = col.label;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: col.esAdicional ? 'FF065F46' : 'FF1E3A8A' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.esAdicional ? 'FFD1FAE5' : colorLightNavy },
    };
    cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
    wsDetallado.getColumn(currColIdx).width = 15;

    // Marca de control 'X' en la fila 5 para auditoría
    if (col.tipo === 'cierre_original' || (resultado.escenario === 'A_SOLO_DISMINUCION' && col.mesNumero === obra.mesFinal)) {
      const xCell = wsDetallado.getCell(5, currColIdx);
      xCell.value = 'X';
      xCell.font = { bold: true, color: { argb: 'FFDC2626' } };
      xCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    currColIdx++;
  });

  // Columnas de saldos de control a la derecha en Cálculo Detallado
  const colEjecOrig = currColIdx++;
  const colSaldoOrig = currColIdx++;
  let colSaldoAdic = 0;
  if (resultado.hayAdicionales) {
    colSaldoAdic = currColIdx++;
  }

  const saldoHeaders = [
    { idx: colEjecOrig, title: 'Ejecutado Contrato Orig.', width: 16 },
    { idx: colSaldoOrig, title: 'Pendiente Contrato Orig.', width: 16 },
    ...(resultado.hayAdicionales ? [{ idx: colSaldoAdic, title: 'Pendiente Adicionales', width: 16 }] : []),
  ];

  saldoHeaders.forEach((sh) => {
    const cell = wsDetallado.getCell(headerRowIdx, sh.idx);
    cell.value = sh.title;
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF334155' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorAccentBg } };
    cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
    wsDetallado.getColumn(sh.idx).width = sh.width;
  });

  wsDetallado.getRow(headerRowIdx).height = 28;

  // Llenar Filas de Datos de Ítems en Cálculo Detallado (desde fila 9)
  const startRow = 9;
  resultado.itemsCalculados.forEach((calc, i) => {
    const rowIdx = startRow + i;
    const it = calc.item;
    const isTitle = calc.esTitulo;
    const row = wsDetallado.getRow(rowIdx);

    row.getCell(1).value = it.numero;
    row.getCell(2).value = it.descripcion;
    row.getCell(3).value = it.unidad || '';

    if (isTitle) {
      row.font = { bold: true };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    } else {
      row.getCell(4).value = it.precioUnitario;
      row.getCell(4).numFmt = '$ #,##0.00';

      row.getCell(5).value = it.cantidadOriginal;
      row.getCell(5).numFmt = '#,##0.0000';

      row.getCell(6).value = { formula: `D${rowIdx}*E${rowIdx}` };
      row.getCell(6).numFmt = '$ #,##0.00';

      // Incidencia Original
      row.getCell(7).value = { formula: `IF($F$${startRow + resultado.itemsCalculados.length}>0, F${rowIdx}/$F$${startRow + resultado.itemsCalculados.length}, 0)` };
      row.getCell(7).numFmt = '0.00%';

      row.getCell(8).value = it.cantidadNueva;
      row.getCell(8).numFmt = '#,##0.0000';

      row.getCell(9).value = { formula: `D${rowIdx}*H${rowIdx}` };
      row.getCell(9).numFmt = '$ #,##0.00';

      // Incidencia Nueva (Criterio Convalidación: Denominador Fijo en Monto Original $F$Total)
      row.getCell(10).value = { formula: `IF($F$${startRow + resultado.itemsCalculados.length}>0, I${rowIdx}/$F$${startRow + resultado.itemsCalculados.length}, 0)` };
      row.getCell(10).numFmt = '0.00%';

      // Avances Físicos Mensuales
      resultado.columnas.forEach((col) => {
        const colNum = colMonthMap[col.id];
        const val = it.avancesPorColumna?.[col.id] || 0;
        const cell = row.getCell(colNum);
        cell.value = val;
        cell.numFmt = '#,##0.0000';
        if (col.esAdicional) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
        }
      });

      // Fórmulas vivas de control de saldos
      const firstMonthCol = getColumnLetter(fixedHeaders.length + 1);
      const lastMonthOrigCol = resultado.hayAdicionales
        ? getColumnLetter(colMonthMap[`mes_${obra.mesFinal}_orig`])
        : getColumnLetter(colMonthMap[`mes_${obra.mesFinal}`]);

      row.getCell(colEjecOrig).value = { formula: `SUM(${firstMonthCol}${rowIdx}:${lastMonthOrigCol}${rowIdx})` };
      row.getCell(colEjecOrig).numFmt = '#,##0.0000';

      row.getCell(colSaldoOrig).value = {
        formula: `MIN(E${rowIdx}, H${rowIdx}) - ${getColumnLetter(colEjecOrig)}${rowIdx}`,
      };
      row.getCell(colSaldoOrig).numFmt = '#,##0.0000';

      if (resultado.hayAdicionales) {
        const adicColLetter = getColumnLetter(colMonthMap[`mes_${obra.mesFinal}_adic`]);
        row.getCell(colSaldoAdic).value = {
          formula: `MAX(0, H${rowIdx} - E${rowIdx}) - ${adicColLetter}${rowIdx}`,
        };
        row.getCell(colSaldoAdic).numFmt = '#,##0.0000';
      }
    }

    row.height = 20;
  });

  // Fila de Totales en Cálculo Detallado
  const totalRowIdx = startRow + resultado.itemsCalculados.length;
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

  totalRowDet.getCell(10).value = { formula: `I${totalRowIdx}/F${totalRowIdx}` };
  totalRowDet.getCell(10).numFmt = '0.00%';

  // Sumas de montos por mes en Cálculo Detallado
  resultado.columnas.forEach((col, idx) => {
    const colNum = colMonthMap[col.id];
    const cell = totalRowDet.getCell(colNum);
    const curvaColLetter = getColumnLetter(idx + 2);
    const cfg = mesesConfig.find((m) => m.mesNumero === col.mesNumero);

    if (col.tipo === 'mes_previo' && cfg?.estado === 'definitivo' && cfg.montoCertificadoDefinitivo) {
      cell.value = roundTo(cfg.montoCertificadoDefinitivo, 2);
    } else {
      cell.value = { formula: `'Cuadro Curva'!${curvaColLetter}10` };
    }
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
  // HOJA 3: CUADRO DE CURVA DE INVERSIÓN OFICIAL + GRÁFICO S CONSOLIDADO
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

  wsCurva.getCell('E4').value = 'MONTO CONVALIDADO:';
  wsCurva.getCell('E4').font = { bold: true };
  wsCurva.getCell('F4').value = { formula: `'Cálculo Detallado'!I${totalRowIdx}` };
  wsCurva.getCell('F4').numFmt = '$ #,##0.00';
  wsCurva.getCell('F4').font = { bold: true };

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
    cell.font = { bold: true, color: { argb: col.esAdicional ? 'FF065F46' : 'FF1E3A8A' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.esAdicional ? 'FFD1FAE5' : colorLightNavy },
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

  // Constantes de filas de Plan de Trabajo Modelo para referenciación cruzada
  const modStartRow = 10;
  const modTotalRowIdx = modStartRow + resultado.itemsCalculados.length;
  const modFilaPorcMIdx = modTotalRowIdx + 1;

  // Llenar columnas de la Curva con fórmulas vivas referenciando Cálculo Detallado
  resultado.curva.forEach((fc, idx) => {
    const colNum = idx + 2;
    const colLetter = getColumnLetter(colNum);
    const prevColLetter = idx > 0 ? getColumnLetter(colNum - 1) : null;
    const planColLetter = getColumnLetter(colMonthMap[fc.columnaId]);
    const modColLetter = getColumnLetter(6 + 1 + idx); // 6 columnas fijas en Plan Trabajo (Modelo)

    const cPorcM = filaPorcMensual.getCell(colNum);
    const cPorcA = filaPorcAcumulado.getCell(colNum);
    const cMontoM = filaMontoMensual.getCell(colNum);
    const cMontoA = filaMontoAcumulado.getCell(colNum);

    if (fc.tipo === 'mes_previo') {
      const cfg = mesesConfig.find((m) => m.mesNumero === fc.mesNumero);
      if (cfg?.estado === 'definitivo' && cfg.montoCertificadoDefinitivo) {
        cMontoM.value = fc.montoMensual;
        cPorcM.value = { formula: `ROUND(${colLetter}10/'Cálculo Detallado'!$F$${totalRowIdx}, 6)` };
      } else {
        // Provisorio: toma el % calculado por SUMPRODUCT de Plan Trabajo Modelo (% -> $)
        cPorcM.value = { formula: `'Plan Trabajo (Modelo)'!${modColLetter}${modFilaPorcMIdx}` };
        cMontoM.value = { formula: `ROUND(${colLetter}8*'Cálculo Detallado'!$F$${totalRowIdx}, 2)` };
      }

      if (!prevColLetter) {
        cMontoA.value = { formula: `${colLetter}10` };
        cPorcA.value = { formula: `${colLetter}8` };
      } else {
        cMontoA.value = { formula: `${prevColLetter}11+${colLetter}10` };
        cPorcA.value = { formula: `${prevColLetter}9+${colLetter}8` };
      }
    } else if (fc.tipo === 'cierre_original') {
      if (resultado.escenario === 'A_SOLO_DISMINUCION') {
        cMontoA.value = { formula: `'Cálculo Detallado'!$I$${totalRowIdx}` };
        cPorcA.value = { formula: `${colLetter}11/'Cálculo Detallado'!$F$${totalRowIdx}` };
        cMontoM.value = { formula: `${colLetter}11-${prevColLetter}11` };
        cPorcM.value = { formula: `${colLetter}9-${prevColLetter}9` };
      } else if (resultado.escenario === 'B_SOLO_ADICIONALES') {
        cMontoA.value = { formula: `'Cálculo Detallado'!$F$${totalRowIdx}` };
        cPorcA.value = 1.0;
        cMontoM.value = { formula: `${colLetter}11-${prevColLetter}11` };
        cPorcM.value = { formula: `${colLetter}9-${prevColLetter}9` };
      } else {
        cMontoM.value = fc.montoMensual;
        cMontoA.value = fc.montoAcumulado;
        cPorcM.value = fc.porcentajeMensual;
        cPorcA.value = fc.porcentajeAcumulado;
      }
    } else if (fc.tipo === 'cierre_adicional') {
      cMontoA.value = { formula: `'Cálculo Detallado'!$I$${totalRowIdx}` };
      cPorcA.value = { formula: `${colLetter}11/'Cálculo Detallado'!$F$${totalRowIdx}` };
      cMontoM.value = { formula: `${colLetter}11-${prevColLetter}11` };
      cPorcM.value = { formula: `${colLetter}9-${prevColLetter}9` };
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

  // Fila explicativa en la hoja de Curva
  const expRow = wsCurva.getRow(13);
  expRow.getCell(1).value = `NOTA OFICIAL: Bajo convalidación, toda la serie porcentual toma como denominador fijo el Monto Original ($F$${totalRowIdx}).`;
  expRow.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF475569' } };

  // =========================================================================
  // GRÁFICO DE CURVA S CONSOLIDADA EN LA HOJA 'CUADRO CURVA'
  // =========================================================================
  // Preparar puntos consolidados para el gráfico (Mes 1 a Mes mesFinal)
  const puntosConsolidados: Array<{ name: string; porc: number }> = [];
  for (let m = 1; m < obra.mesFinal; m++) {
    const fc = resultado.curva.find((c) => c.mesNumero === m);
    if (fc) {
      puntosConsolidados.push({
        name: `Mes ${m}`,
        porc: +(fc.porcentajeAcumulado * 100),
      });
    }
  }

  // Mes final consolidado con el total acumulado incluyendo adicionales
  const fcOrig = resultado.curva.find((c) => c.tipo === 'cierre_original');
  const fcAdic = resultado.curva.find((c) => c.tipo === 'cierre_adicional');
  const fcFinal = fcAdic || fcOrig;
  if (fcFinal) {
    puntosConsolidados.push({
      name: `Mes ${obra.mesFinal}`,
      porc: +(fcFinal.porcentajeAcumulado * 100),
    });
  }

  const maxVal = Math.max(100, ...puntosConsolidados.map((p) => p.porc));
  const yMaxConsolidado = Math.ceil((maxVal + 10) / 10) * 10;

  // Insertar título del gráfico en la fila 15
  wsCurva.getCell('A15').value = 'GRÁFICO DE CURVA S DE INVERSIÓN ACUMULADA CONSOLIDADA:';
  wsCurva.getCell('A15').font = { bold: true, size: 10, color: { argb: colorNavy } };

  const base64Chart = generarImagenCurvaConsolidada(puntosConsolidados, yMaxConsolidado);
  if (base64Chart) {
    const chartImgId = workbook.addImage({
      base64: base64Chart,
      extension: 'png',
    });
    wsCurva.addImage(chartImgId, {
      tl: { col: 1, row: 16 }, // Empieza en B17
      ext: { width: 780, height: 370 },
    });
  }


  // =========================================================================
  // HOJA 1: PLAN DE TRABAJO (MODELO) - FOLIO 15 / 16 (COLOCADA AL INICIO)
  // =========================================================================
  const wsModelo = workbook.addWorksheet('Plan Trabajo (Modelo)', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 9 }],
  });
  (wsModelo as any).orderNo = 1;
  wsModelo.pageSetup = { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0, paperSize: 9 };

  // Membrete Oficial en Plan Trabajo Modelo
  wsModelo.mergeCells('A1:L1');
  const tMod1 = wsModelo.getCell('A1');
  tMod1.value = 'MUNICIPALIDAD DE NEUQUÉN — ÁREA DE ALTERACIONES CONTRACTUALES';
  tMod1.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  tMod1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorNavy } };
  tMod1.alignment = { horizontal: 'center', vertical: 'middle' };
  wsModelo.getRow(1).height = 24;

  wsModelo.mergeCells('A2:L2');
  const tMod2 = wsModelo.getCell('A2');
  tMod2.value = 'PLAN DE TRABAJO MODELO POR CONVALIDACIÓN CONTRACTUAL';
  tMod2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
  tMod2.alignment = { horizontal: 'center', vertical: 'middle' };
  wsModelo.getRow(2).height = 18;

  // Carátula Oficial (Datos de Folio 15)
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
  wsModelo.getCell('H5').value = obra.expedienteAmpliacion || 'S/D (Convalidación)';

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

  // Encabezados de la Tabla Modelo (Fila 9)
  const modHeaderRowIdx = 9;
  const modFixedHeaders = [
    { title: 'Nº', width: 8 },
    { title: 'Descripción del Ítem', width: 36 },
    { title: 'Costo Básico ($)', width: 16 },
    { title: 'Inc. (%)', width: 11 },
    { title: 'Costo Modif. ($)', width: 16 },
    { title: 'Inc. (%)', width: 11 },
  ];

  modFixedHeaders.forEach((h, idx) => {
    const colNumber = idx + 1;
    const cell = wsModelo.getCell(modHeaderRowIdx, colNumber);
    cell.value = h.title;
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorHeaderBg } };
    cell.alignment = { horizontal: idx >= 2 ? 'right' : idx === 0 ? 'center' : 'left', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
    wsModelo.getColumn(colNumber).width = h.width;
  });

  // Columnas mensuales en Plan de Trabajo Modelo
  resultado.columnas.forEach((col, idx) => {
    const colNum = modFixedHeaders.length + 1 + idx;
    const cell = wsModelo.getCell(modHeaderRowIdx, colNum);
    cell.value = col.label;
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: col.esAdicional ? 'FF065F46' : 'FF1E3A8A' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.esAdicional ? 'FFD1FAE5' : colorLightNavy },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'medium' } };
    wsModelo.getColumn(colNum).width = 13;
  });

  wsModelo.getRow(modHeaderRowIdx).height = 26;

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
      // Costo Básico y su Incidencia (fórmulas referenciando Cálculo Detallado)
      row.getCell(3).value = { formula: `'Cálculo Detallado'!F${detRowIdx}` };
      row.getCell(3).numFmt = '$ #,##0.00';

      row.getCell(4).value = { formula: `'Cálculo Detallado'!G${detRowIdx}` };
      row.getCell(4).numFmt = '0.00%';

      // Costo Modificado y su Incidencia
      row.getCell(5).value = { formula: `'Cálculo Detallado'!I${detRowIdx}` };
      row.getCell(5).numFmt = '$ #,##0.00';

      row.getCell(6).value = { formula: `'Cálculo Detallado'!J${detRowIdx}` };
      row.getCell(6).numFmt = '0.00%';

      // Porcentaje por período para cada mes
      resultado.columnas.forEach((col, idx) => {
        const colNum = modFixedHeaders.length + 1 + idx;
        const detColLetter = getColumnLetter(colMonthMap[col.id]);
        const cell = row.getCell(colNum);

        if (it.cantidadOriginal > 0) {
          // Ítem del contrato básico: Cantidad / CantidadOriginal
          cell.value = {
            formula: `IF('Cálculo Detallado'!E${detRowIdx}>0, 'Cálculo Detallado'!${detColLetter}${detRowIdx}/'Cálculo Detallado'!E${detRowIdx}, 0)`,
          };
          cell.numFmt = '0.00%';
        } else {
          // Ítem nuevo (Cant. Orig = 0): '-' en meses previos; Cantidad / CantidadNueva en Adicionales
          if (col.esAdicional) {
            cell.value = {
              formula: `IF('Cálculo Detallado'!H${detRowIdx}>0, 'Cálculo Detallado'!${detColLetter}${detRowIdx}/'Cálculo Detallado'!H${detRowIdx}, 0)`,
            };
            cell.numFmt = '0.00%';
          } else {
            cell.value = '-';
            cell.alignment = { horizontal: 'center' };
          }
        }
      });
    }

    row.height = 19;
  });

  // Filas de Totales en Plan de Trabajo Modelo
  const modTotalRow = wsModelo.getRow(modTotalRowIdx);

  modTotalRow.getCell(2).value = 'TOTALES DE OBRA:';
  modTotalRow.getCell(2).font = { bold: true };
  modTotalRow.getCell(2).alignment = { horizontal: 'right' };

  modTotalRow.getCell(3).value = { formula: `SUM(C${modStartRow}:C${modTotalRowIdx - 1})` };
  modTotalRow.getCell(3).numFmt = '$ #,##0.00';

  modTotalRow.getCell(4).value = 1.0;
  modTotalRow.getCell(4).numFmt = '100.00%';

  modTotalRow.getCell(5).value = { formula: `SUM(E${modStartRow}:E${modTotalRowIdx - 1})` };
  modTotalRow.getCell(5).numFmt = '$ #,##0.00';

  modTotalRow.getCell(6).value = { formula: `E${modTotalRowIdx}/C${modTotalRowIdx}` };
  modTotalRow.getCell(6).numFmt = '0.00%';

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

  // Fila % Avance Físico Mensual en Modelo
  const modFilaPorcM = wsModelo.getRow(modTotalRowIdx + 1);
  wsModelo.mergeCells(`A${modTotalRowIdx + 1}:F${modTotalRowIdx + 1}`);
  const labelPorcM = modFilaPorcM.getCell(1);
  labelPorcM.value = '% AVANCE FÍSICO MENSUAL:';
  labelPorcM.font = { bold: true, size: 9, color: { argb: 'FF1E3A8A' } };
  labelPorcM.alignment = { horizontal: 'right', vertical: 'middle' };

  resultado.columnas.forEach((col, idx) => {
    const colNum = modFixedHeaders.length + 1 + idx;
    const curvaColLetter = getColumnLetter(idx + 2);
    const modColLetter = getColumnLetter(colNum);
    const cell = modFilaPorcM.getCell(colNum);

    const cfg = mesesConfig.find((m) => m.mesNumero === col.mesNumero);
    const esDefinitivo = col.tipo === 'mes_previo' && cfg?.estado === 'definitivo';

    if (col.tipo === 'mes_previo' && !esDefinitivo) {
      // Método Municipal para meses provisorios: SUMAPRODUCTO de incidencias por avances de cada ítem
      cell.value = {
        formula: `ROUND(SUMPRODUCT($D$${modStartRow}:$D$${modTotalRowIdx - 1}, ${modColLetter}$${modStartRow}:${modColLetter}$${modTotalRowIdx - 1}), 6)`,
      };
    } else {
      cell.value = { formula: `'Cuadro Curva'!${curvaColLetter}8` };
    }
    cell.numFmt = '0.00%';
    cell.font = { bold: true, color: { argb: 'FF1E3A8A' } };
    cell.alignment = { horizontal: 'center' };
  });

  modFilaPorcM.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
  modFilaPorcM.height = 20;

  // Fila % Avance Físico Acumulado en Modelo
  const modFilaPorcA = wsModelo.getRow(modTotalRowIdx + 2);
  wsModelo.mergeCells(`A${modTotalRowIdx + 2}:F${modTotalRowIdx + 2}`);
  const labelPorcA = modFilaPorcA.getCell(1);
  labelPorcA.value = '% AVANCE FÍSICO ACUMULADO:';
  labelPorcA.font = { bold: true, size: 9, color: { argb: 'FF1E3A8A' } };
  labelPorcA.alignment = { horizontal: 'right', vertical: 'middle' };

  resultado.columnas.forEach((col, idx) => {
    const colNum = modFixedHeaders.length + 1 + idx;
    const curvaColLetter = getColumnLetter(idx + 2);
    const cell = modFilaPorcA.getCell(colNum);
    cell.value = { formula: `'Cuadro Curva'!${curvaColLetter}9` };
    cell.numFmt = '0.00%';
    cell.font = { bold: true, color: { argb: 'FF1E3A8A' } };
    cell.alignment = { horizontal: 'center' };
  });

  modFilaPorcA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBAE6FD' } };
  modFilaPorcA.height = 20;

  // Generar buffer final
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
