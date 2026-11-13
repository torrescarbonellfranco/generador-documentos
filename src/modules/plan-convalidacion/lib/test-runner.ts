import {
  calcularConvalidacion,
  autocompletarSaldosCierre,
  calcularAvanceProvisorioConAjuste,
  roundTo,
} from './convalidacionEngine';
import * as XLSX from 'xlsx';
import {
  parsearFojaMedicion,
  extraerNumeroFoja,
  normalizarCodigoItem,
  aplicarFojasEnPlanTrabajo,
  ResultadoFojaMedicion,
} from './fojaMedicionParser';
import { ItemContrato, MesConfig } from '@/modules/plan-convalidacion/types/convalidacion';
import {
  demoEscenarioA,
  demoEscenarioB,
  demoEscenarioC,
} from './demoData';

console.log('=== INICIANDO SUITE DE PRUEBAS DE CONVALIDACIÓN (NEUQUÉN) ===\n');

// TEST 1: Escenario A (Solo Disminución)
{
  console.log('TEST 1: Verificando Escenario A (Solo Disminución)...');
  const resA = calcularConvalidacion(
    demoEscenarioA.items,
    demoEscenarioA.mesesConfig,
    demoEscenarioA.obra.mesFinal
  );

  console.assert(resA.escenario === 'A_SOLO_DISMINUCION', 'Debe ser Escenario A');
  console.assert(!resA.hayAdicionales, 'No debe haber adicionales');
  console.assert(resA.hayDisminuciones, 'Debe haber disminuciones');
  console.assert(resA.columnas.length === 5, `Deben ser 5 columnas (sin desdoblar el mes 5), obtenido: ${resA.columnas.length}`);
  console.assert(resA.columnas[4].id === 'mes_5', 'Última columna debe ser mes_5');

  const ultimaFila = resA.curva[resA.curva.length - 1];
  console.assert(
    ultimaFila.montoAcumulado === resA.montoObraNuevo,
    `El monto acumulado final ($${ultimaFila.montoAcumulado}) debe coincidir con Monto Nuevo ($${resA.montoObraNuevo})`
  );
  console.assert(
    ultimaFila.porcentajeAcumulado < 1.0,
    `El porcentaje acumulado final (${ultimaFila.porcentajeAcumulado}) debe ser menor al 100% por disminución de obra`
  );
  console.log('✓ Escenario A verificado correctamente.\n');
}

// TEST 2: Escenario B (Solo Adicionales)
{
  console.log('TEST 2: Verificando Escenario B (Solo Adicionales)...');
  const resB = calcularConvalidacion(
    demoEscenarioB.items,
    demoEscenarioB.mesesConfig,
    demoEscenarioB.obra.mesFinal
  );

  console.assert(resB.escenario === 'B_SOLO_ADICIONALES', 'Debe ser Escenario B');
  console.assert(resB.hayAdicionales, 'Debe haber adicionales');
  console.assert(!resB.hayDisminuciones, 'No debe haber disminuciones');
  console.assert(
    resB.columnas.length === 5, // 3 previos + 2 del cierre
    `Deben ser 5 columnas (3 previas + 2 de cierre), obtenido: ${resB.columnas.length}`
  );

  const colOrig = resB.curva[resB.curva.length - 2];
  const colAdic = resB.curva[resB.curva.length - 1];

  console.assert(
    colOrig.montoAcumulado === resB.montoObraOriginal,
    `Obra original debe acumular exactamente Monto Original ($${resB.montoObraOriginal}), obtenido: $${colOrig.montoAcumulado}`
  );
  console.assert(
    colOrig.porcentajeAcumulado === 1.0,
    `Obra original debe acumular exactamente 100%, obtenido: ${colOrig.porcentajeAcumulado}`
  );
  console.assert(
    colAdic.montoAcumulado === resB.montoObraNuevo,
    `Columna adicional debe acumular Monto Nuevo ($${resB.montoObraNuevo}), obtenido: $${colAdic.montoAcumulado}`
  );
  console.assert(
    colAdic.porcentajeAcumulado > 1.0,
    `Columna adicional debe acumular más de 100% (${colAdic.porcentajeAcumulado})`
  );
  console.log('✓ Escenario B verificado correctamente.\n');
}

// TEST 3: Escenario C (Mixto: Disminución + Adicionales)
{
  console.log('TEST 3: Verificando Escenario C (Mixto: Disminución + Adicionales)...');
  const resC = calcularConvalidacion(
    demoEscenarioC.items,
    demoEscenarioC.mesesConfig,
    demoEscenarioC.obra.mesFinal
  );

  console.assert(resC.escenario === 'C_MIXTO', 'Debe ser Escenario C');
  console.assert(resC.hayAdicionales, 'Debe haber adicionales');
  console.assert(resC.hayDisminuciones, 'Debe haber disminuciones');

  const colOrig = resC.curva[resC.curva.length - 2];
  const colAdic = resC.curva[resC.curva.length - 1];

  console.assert(
    colOrig.columnaId === 'mes_6_orig',
    'Penúltima columna debe ser mes_6_orig'
  );
  console.assert(
    colAdic.columnaId === 'mes_6_adic',
    'Última columna debe ser mes_6_adic'
  );
  console.assert(
    colAdic.montoAcumulado === resC.montoObraNuevo,
    `Columna adicional debe acumular Monto Nuevo ($${resC.montoObraNuevo}), obtenido: $${colAdic.montoAcumulado}`
  );
  console.log('✓ Escenario C verificado correctamente.\n');
}

// TEST 4: Verificando "Autocompletar saldos en el cierre"
{
  console.log('TEST 4: Verificando Autocompletar Saldos en el cierre...');
  // Tomamos items sin avances en el cierre
  const itemsIncompletos = demoEscenarioC.items.map((it) => ({
    ...it,
    avancesPorColumna: {
      mes_1: it.avancesPorColumna.mes_1 || 0,
      mes_2: it.avancesPorColumna.mes_2 || 0,
      mes_3: it.avancesPorColumna.mes_3 || 0,
      mes_4: it.avancesPorColumna.mes_4 || 0,
      mes_5: it.avancesPorColumna.mes_5 || 0,
      // mes_6_orig y mes_6_adic en 0
    },
  }));

  const itemsCompletados = autocompletarSaldosCierre(
    itemsIncompletos,
    demoEscenarioC.obra.mesFinal,
    true
  );

  const resCompletado = calcularConvalidacion(
    itemsCompletados,
    demoEscenarioC.mesesConfig,
    demoEscenarioC.obra.mesFinal
  );

  console.assert(
    roundTo(resCompletado.totalPendienteOriginal, 2) === 0,
    `El saldo original pendiente debe ser 0.00, obtenido: ${resCompletado.totalPendienteOriginal}`
  );
  console.assert(
    roundTo(resCompletado.totalPendienteAdicional, 2) === 0,
    `El saldo adicional pendiente debe ser 0.00, obtenido: ${resCompletado.totalPendienteAdicional}`
  );
  console.assert(
    resCompletado.saldosFisicosCerrados,
    'Los saldos físicos deben marcarse como completamente cerrados'
  );
  console.log('✓ Autocompletar saldos verificado correctamente.\n');
}

// TEST 5: Parser de Cuadro Modificatorio (.xlsx) y Reconciliación
{
  console.log('TEST 5: Verificando Parser de Cuadro Modificatorio (.xlsx) y Reconciliación...');
  const XLSX = require('xlsx');
  const { parsearCuadroModificatorioExcel } = require('./cuadroModificatorioParser');

  const headers = [
    ['MUNICIPALIDAD DE NEUQUÉN', '', '', '', '', '', '', '', '', '', '', ''],
    ['CUADRO MODIFICATORIO DE OBRA', '', '', '', '', '', '', '', '', '', '', ''],
    ['OBRA: PAVIMENTACIÓN Y DRENAJE PLUVIAL', '', '', '', 'EXPEDIENTE: OE-1234-M-2024', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    [
      'ITEM',
      'DESCRIPCIÓN',
      'UNIDAD',
      'PRECIO UNITARIO',
      'CANT. AUTORIZ.',
      'CANT. A AUTORIZ.',
      'IMP. AUTORIZ.',
      'IMP. A AUTORIZ.',
      'DISM. CANT.',
      'DISM. IMP.',
      'AUM. CANT.',
      'AUM. IMP.',
    ],
    ['1', 'TRABAJOS PRELIMINARES', '', 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['1.1', 'Cartel de obra', 'GL', 500000, 1, 1, 500000, 500000, 0, 0, 0, 0],
    ['1.2', 'Limpieza y desmonte\ncon maquinaria', 'M2', 2000, 10000, 8000, 20000000, 16000000, 2000, 4000000, 0, 0],
    ['2', 'MOVIMIENTO DE SUELOS', '', 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['2.1', 'Excavación adicional', 'M3', 4000, 1000, 1500, 4000000, 6000000, 0, 0, 500, 2000000],
    ['2.2 (Nuevo)', 'Sub-base especial de tosca', 'M3', 6000, 0, 500, 0, 3000000, 0, 0, 500, 3000000],
    ['2.3', 'Cordón cuneta suprimido', 'ML', 8000, 500, 0, 4000000, 0, 500, 4000000, 0, 0],
    ['', '', '', '', '', 'TOTALES', 28500000, 25500000, '', 8000000, '', 5000000],
  ];

  const ws = XLSX.utils.aoa_to_sheet(headers);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cuadro Modificatorio');
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

  const resultado = parsearCuadroModificatorioExcel(buffer);

  console.assert(resultado.items.length === 7, `Esperados 7 ítems, obtenidos: ${resultado.items.length}`);
  console.assert(resultado.reconciliacion.reconciliado, 'El cuadro debe reconciliar al 100%');
  console.assert(resultado.reconciliacion.calculadoSuma.importesAutorizados === 28500000, 'Importe Autorizado');
  console.assert(resultado.reconciliacion.calculadoSuma.importesAAutorizar === 25500000, 'Importe A Autorizar');
  console.log('✓ Parser y Reconciliación verificados correctamente.\n');
}

// TEST 6: Validación de las 4 Reglas Estrictas de Saltos de Página y Texto Huérfano (Cuadro 596)
{
  console.log('TEST 6: Verificando 4 Reglas Estrictas con Cortes de Página y Texto Huérfano...');
  const XLSX = require('xlsx');
  const { parsearCuadroModificatorioExcel } = require('./cuadroModificatorioParser');

  const rows = [
    // Página 1: Encabezados
    ['MUNICIPALIDAD DE NEUQUÉN', '', '', '', '', '', '', '', '', '', '', ''],
    ['CUADRO MODIFICATORIO 596', '', '', '', '', '', '', '', '', '', '', ''],
    ['ITEM', 'DENOMINACION DE LOS TRABAJOS', 'UNID. MED.', 'PRECIO UNITARIO', 'AUTORIZ.', 'A AUTORIZ.', 'AUTORIZ.', 'A AUTORIZ.', '', '', '', ''],
    // Ítems página 1
    ['1', 'RUBRO TRABAJOS PRELIMINARES', '', 0, 0, 0, 0, 0, 0, 0, 0, 0], // Verdadero Rubro
    ['1.1', 'Cartel de obra', 'GL', 100000, 1, 1, 100000, 100000, 0, 0, 0, 0],
    
    // Salto de página 1 a 2: Encabezados repetidos
    ['MUNICIPALIDAD DE NEUQUÉN', '', '', '', '', '', '', '', '', '', '', ''],
    ['ITEM', 'DENOMINACION DE LOS TRABAJOS', 'UNID. MED.', 'PRECIO UNITARIO', 'AUTORIZ.', 'A AUTORIZ.', 'AUTORIZ.', 'A AUTORIZ.', '', '', '', ''],
    ['[1]', '[2]', '[3]', '[4]', '[5]', '[6]', '[7]', '[8]', '', '', '', ''],
    
    // Ítems página 2
    ['22', 'Excavación general', 'M3', 5000, 100, 100, 500000, 500000, 0, 0, 0, 0],
    ['23 (Nuevo)', 'RECONSTRUCCIÓN PAVIMENTO DE', 'M2', 12000, 0, 50, 0, 600000, 0, 0, 50, 600000], // Cortado al final de página!
    
    // Salto de página 2 a 3: Encabezados repetidos
    ['MUNICIPALIDAD DE NEUQUÉN', '', '', '', '', '', '', '', '', '', '', ''],
    ['SECRETARIA DE INFRAESTRUCTURA', '', '', '', '', '', '', '', '', '', '', ''],
    ['ITEM', 'DENOMINACION DE LOS TRABAJOS', 'UNID. MED.', 'PRECIO UNITARIO', 'AUTORIZ.', 'A AUTORIZ.', '', '', '', '', '', ''],
    
    // Texto Huérfano en página 3: fila sin Col A ni números
    ['', 'HORMIGÓN', '', '', '', '', '', '', '', '', '', ''], // Debe unirse al ítem 23 (Nuevo)!
    
    // Ítems siguientes página 3
    ['24', 'Cordón cuneta', 'ML', 8000, 20, 15, 160000, 120000, 5, 40000, 0, 0],
    
    // Pie del cuadro con totales oficiales
    ['', '', '', '', '', 'TOTALES', 760000, 1320000, '', 40000, '', 600000],
    ['', '', '', '', 'IMPORTES AUTORIZADOS:', '', 760000, '', '', '', '', ''],
    ['', '', '', '', 'IMPORTES A AUTORIZAR:', '', 1320000, '', '', '', '', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cuadro Modificatorio 596');
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

  const resultado = parsearCuadroModificatorioExcel(buffer);

  // 1. Verificar que NO se crearon rubros falsos
  const fakeRubro = resultado.items.find((it: any) => it.descripcion === 'HORMIGÓN');
  console.assert(!fakeRubro, 'No debe existir ningún rubro falso "HORMIGÓN"');

  // 2. Verificar que se unió la descripción huérfana al ítem 23 (Nuevo)
  const item23 = resultado.items.find((it: any) => it.numero === '23 (Nuevo)');
  console.assert(item23 !== undefined, 'Debe existir el ítem 23 (Nuevo)');
  console.assert(
    item23?.descripcion === 'RECONSTRUCCIÓN PAVIMENTO DE HORMIGÓN',
    `Descripción esperada "RECONSTRUCCIÓN PAVIMENTO DE HORMIGÓN", obtenida: "${item23?.descripcion}"`
  );

  // 3. Verificar que los ítems acumulados no se resetearon en los saltos de página
  // Esperados: Rubro 1, ítem 1.1, ítem 22, ítem 23 (Nuevo), ítem 24 -> Total 5 ítems
  console.assert(resultado.items.length === 5, `Esperados 5 ítems, obtenidos: ${resultado.items.length}`);

  // 4. Verificar reconciliación contra el pie
  console.assert(resultado.reconciliacion.reconciliado, 'Debe reconciliar al 100%');
  console.assert(resultado.reconciliacion.calculadoSuma.importesAutorizados === 760000, 'Importe Autorizado');
  console.assert(resultado.reconciliacion.calculadoSuma.importesAAutorizar === 1320000, 'Importe A Autorizar');

  console.log('✓ Las 4 reglas estrictas de corte de página y texto huérfano funcionan a la perfección.\n');
}

// TEST 7: Verificación del Exportador de Excel Oficial con 3 Hojas (Folio 15/16)
async function testExcel3Hojas() {
  console.log('TEST 7: Verificando Exportador Oficial de Excel con 3 Pestañas...');
  const { exportarExcelOficial } = require('./excelExport');
  const { demoEscenarioC } = require('./demoData');
  const { calcularConvalidacion } = require('./convalidacionEngine');
  const ExcelJS = require('exceljs');

  const resultado = calcularConvalidacion(
    demoEscenarioC.items,
    demoEscenarioC.mesesConfig,
    demoEscenarioC.obra.mesFinal
  );

  const blob = await exportarExcelOficial(
    demoEscenarioC.obra,
    resultado,
    demoEscenarioC.mesesConfig
  );

  console.assert(blob !== undefined, 'El blob no debe ser undefined');
  console.assert(blob.size > 0, 'El archivo debe tener bytes');

  // Leer el buffer con ExcelJS para verificar las 3 hojas
  const arrayBuffer = await blob.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(arrayBuffer));

  const sheetNames = wb.worksheets.map((s: any) => s.name);
  console.assert(
    sheetNames.includes('Plan Trabajo (Modelo)'),
    'Debe contener la hoja "Plan Trabajo (Modelo)"'
  );
  console.assert(
    sheetNames.includes('Cálculo Detallado'),
    'Debe contener la hoja "Cálculo Detallado"'
  );
  console.assert(
    sheetNames.includes('Cuadro Curva'),
    'Debe contener la hoja "Cuadro Curva"'
  );
  console.assert(
    wb.worksheets.length === 3,
    `Esperadas 3 hojas, obtenidas: ${wb.worksheets.length} (${sheetNames.join(', ')})`
  );

  // Verificar que la hoja de Modelo contiene la carátula y el nuevo membrete oficial
  const wsModelo = wb.getWorksheet('Plan Trabajo (Modelo)');
  const cellA1 = wsModelo?.getCell('A1').value;
  console.assert(
    typeof cellA1 === 'string' && cellA1.includes('MUNICIPALIDAD DE NEUQUÉN — ÁREA DE ALTERACIONES CONTRACTUALES'),
    `El membrete oficial debe ser "MUNICIPALIDAD DE NEUQUÉN — ÁREA DE ALTERACIONES CONTRACTUALES", obtenido: "${cellA1}"`
  );

  console.log('✓ Exportador Oficial verificado: 3 hojas generadas con éxito.\n');
}

// TEST 8: Verificando Método Municipal para Meses Provisorios vs. Definitivos
{
  console.log('TEST 8: Verificando Método Municipal (Provisorios % -> $ vs. Definitivos $ -> %)...');
  const itemsTest: ItemContrato[] = [
    {
      id: 'it1',
      numero: '1',
      descripcion: 'Movimiento de Suelo',
      precioUnitario: 1000,
      cantidadOriginal: 100, // Costo: 100.000
      cantidadNueva: 100,
      avancesPorColumna: {
        mes_1: 20, // 20%
        mes_2: 30, // 30%
        mes_3_orig: 50, // 50%
      },
    },
    {
      id: 'it2',
      numero: '2',
      descripcion: 'Hormigón H21',
      precioUnitario: 2000,
      cantidadOriginal: 50, // Costo: 100.000
      cantidadNueva: 60,    // Adicional: +10 (Costo modif: 120.000)
      avancesPorColumna: {
        mes_1: 10, // 20%
        mes_2: 15, // 30%
        mes_3_orig: 25, // 50%
        mes_3_adic: 10, // 10 adicionales
      },
    },
  ];

  // Monto Obra Original = 100.000 + 100.000 = 200.000
  // Incidencias originales: it1 = 0.5, it2 = 0.5
  // Mes 1: Definitivo con certificado emitido = $ 40.000,00
  // Mes 2: Provisorio. it1 ejecutó 30 (30%), it2 ejecutó 15 (30%).
  //        PorcMensual esperado = ROUND(0.3 * 0.5 + 0.3 * 0.5, 6) = 0.300000 (30%)
  //        MontoMensual esperado = ROUND(0.300000 * 200.000, 2) = $ 60.000,00
  const mesesCfg = [
    { mesNumero: 1, estado: 'definitivo' as const, montoCertificadoDefinitivo: 40000 },
    { mesNumero: 2, estado: 'provisorio' as const },
  ];

  const res = calcularConvalidacion(itemsTest, mesesCfg, 3);

  // Verificación Mes 1 (Definitivo)
  const filaM1 = res.curva[0];
  console.assert(filaM1.montoMensual === 40000, `Mes 1 monto debe ser 40000, obtenido: ${filaM1.montoMensual}`);
  console.assert(filaM1.porcentajeMensual === 0.2, `Mes 1 porcentaje debe ser 0.2, obtenido: ${filaM1.porcentajeMensual}`);

  // Verificación Mes 2 (Provisorio Municipal)
  const filaM2 = res.curva[1];
  console.assert(filaM2.porcentajeMensual === 0.3, `Mes 2 porcentaje debe ser 0.3, obtenido: ${filaM2.porcentajeMensual}`);
  console.assert(filaM2.montoMensual === 60000, `Mes 2 monto debe ser 60000, obtenido: ${filaM2.montoMensual}`);
  console.assert(filaM2.porcentajeAcumulado === 0.5, `Mes 2 acumulado % debe ser 0.5, obtenido: ${filaM2.porcentajeAcumulado}`);
  console.assert(filaM2.montoAcumulado === 100000, `Mes 2 acumulado $ debe ser 100000, obtenido: ${filaM2.montoAcumulado}`);

  // Verificación porcentajeAcumuladoOriginal en ItemCalculado
  const it1Calc = res.itemsCalculados.find((it) => it.item.id === 'it1');
  const it2Calc = res.itemsCalculados.find((it) => it.item.id === 'it2');
  console.assert(it1Calc?.porcentajeAcumuladoOriginal === 100, `Ítem 1 debe estar al 100%, obtenido: ${it1Calc?.porcentajeAcumuladoOriginal}`);
  console.assert(it2Calc?.porcentajeAcumuladoOriginal === 120, `Ítem 2 debe estar al 120% (ampliación), obtenido: ${it2Calc?.porcentajeAcumuladoOriginal}`);

  console.log('✓ Método Municipal para Provisorios y porcentajeAcumuladoOriginal verificados correctamente.\n');
}

// TEST 9: Verificando Regla de Ajuste Exacto de Cantidad en Mes Provisorio (Cierre sin error de redondeo)
{
  console.log('TEST 9: Verificando Regla de Ajuste Exacto de Cantidad en Mes Provisorio...');

  // Caso 1: Ítem con Cantidad Original 6.000, 33.33% en M1 y 33.33% en M2.
  // Al ingresar 33.34% en M3 (provisorio), debe ajustar por diferencia exacta a 2000.40 para cerrar a 6000.00
  const item6000: ItemContrato = {
    id: 'it6000',
    numero: '10',
    descripcion: 'Pintura',
    precioUnitario: 100,
    cantidadOriginal: 6000,
    cantidadNueva: 6000,
    avancesPorColumna: {
      mes_1: 1999.80, // 33.33%
      mes_2: 1999.80, // 33.33%
    },
  };

  const resAjuste = calcularAvanceProvisorioConAjuste(item6000, 3, 33.34);
  console.assert(
    resAjuste.esCompletado === true,
    'Debe marcarse como completado al alcanzar el 100%'
  );
  console.assert(
    resAjuste.cantidad === 2000.40,
    `La cantidad ajustada debe ser 2000.40 (6000 - 3999.60), obtenido: ${resAjuste.cantidad}`
  );
  console.assert(
    resAjuste.porcentajeEfectivo === 33.34,
    `El porcentaje efectivo debe ser 33.34%, obtenido: ${resAjuste.porcentajeEfectivo}`
  );

  const totalQ = 1999.80 + 1999.80 + resAjuste.cantidad;
  console.assert(
    totalQ === 6000,
    `El total acumulado debe ser exactamente 6000, obtenido: ${totalQ}`
  );

  // Caso 2: Ítem disminuido (H = 100, CV = 80). Tope = 80, PorcObjetivo = 80%.
  // Mes 1 = 40 (40%). Mes 2 (provisorio) se ingresa 40%. Debe ajustar a 40 para cerrar en 80.
  const itemDisminuido: ItemContrato = {
    id: 'itDisminuido',
    numero: '11',
    descripcion: 'Cordón Cuneta',
    precioUnitario: 500,
    cantidadOriginal: 100,
    cantidadNueva: 80,
    avancesPorColumna: {
      mes_1: 40, // 40%
    },
  };

  const resDisminuido = calcularAvanceProvisorioConAjuste(itemDisminuido, 2, 40);
  console.assert(
    resDisminuido.esCompletado === true,
    'Ítem disminuido debe completarse al alcanzar su objetivo del 80%'
  );
  console.assert(
    resDisminuido.cantidad === 40,
    `Cantidad debe ser 40, obtenido: ${resDisminuido.cantidad}`
  );
  console.assert(
    resDisminuido.porcentajeEfectivo === 40,
    `Porcentaje debe ser 40%, obtenido: ${resDisminuido.porcentajeEfectivo}`
  );

  console.log('✓ Regla de Ajuste Exacto por diferencia verificada correctamente.\n');
}

// TEST 10: Verificando Importador de Fojas de Medición (.xls / .xlsx)
{
  console.log('TEST 10: Verificando Importador de Fojas de Medición (Extracción Exclusiva de Cantidades Actuales)...');

  // 1. Verificar normalización de ítems
  console.assert(normalizarCodigoItem(' 3.6 (Nuevo) ') === '3.6', 'Debe quitar "(Nuevo)" y espacios');
  console.assert(normalizarCodigoItem('27 (nuevo)') === '27', 'Debe quitar "(nuevo)"');
  console.assert(normalizarCodigoItem('1.1') === '1.1', 'Debe mantener "1.1"');
  console.assert(normalizarCodigoItem('5') === '5', 'Debe mantener "5"');

  // 2. Construir un workbook en memoria que emule una Foja de Medición oficial (Col A = Item, Col G = Actual)
  const rowsFoja1 = [
    ['MUNICIPALIDAD DE NEUQUEN'],
    ['SECRETARIA DE INFRAESTRUCTURA Y PLANEAMIENTO URBANO'],
    ['FOJA DE MEDICIÓN Nº 1'],
    ['OBRA: PAVIMENTACIÓN BARRIO CONFLUENCIA'],
    ['EXPTE: 1234/2026'],
    [],
    ['Item', 'Designación', 'Unid.', 'Cant. Contrato', 'CANTIDAD', '', ''],
    ['', '', '', '', 'Anterior', 'Actual', 'Acumulada'],
    ['1', 'Movimiento de Suelo', 'm3', '100', '0', '25,50', '25,50'],
    ['1.1', 'Excavación no clasificada', 'm3', '50', '0', '15,00', '15,00'],
    ['3.6', 'Base granular', 'm3', '200', '0', '50,00', '50,00'],
    ['TOTALES AL PIE', '', '', '', '', '$ 1.234.567,89', ''],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(rowsFoja1);
  const wb1 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb1, ws1, 'Foja 1');

  const parsedFoja1 = parsearFojaMedicion(wb1, 'Foja de Medicion N1.xlsx');
  console.assert(parsedFoja1.numeroFoja === 1, `Debe detectar Foja Nº 1, obtenido: ${parsedFoja1.numeroFoja}`);
  console.assert(parsedFoja1.items.length === 3, `Debe extraer 3 ítems, obtenido: ${parsedFoja1.items.length}`);

  const item1 = parsedFoja1.items.find((it) => it.codigoItem === '1');
  const item11 = parsedFoja1.items.find((it) => it.codigoItem === '1.1');
  const item36 = parsedFoja1.items.find((it) => it.codigoItem === '3.6');

  console.assert(item1?.cantidadActual === 25.5, `Item 1 cantidad actual debe ser 25.5, obtenido: ${item1?.cantidadActual}`);
  console.assert(item11?.cantidadActual === 15.0, `Item 1.1 cantidad actual debe ser 15.0, obtenido: ${item11?.cantidadActual}`);
  console.assert(item36?.cantidadActual === 50.0, `Item 3.6 cantidad actual debe ser 50.0, obtenido: ${item36?.cantidadActual}`);

  // 3. Construir Foja 2
  const rowsFoja2 = [
    ['MUNICIPALIDAD DE NEUQUEN'],
    ['FOJA DE MEDICIÓN Nº 2'],
    [],
    ['Item', 'Designación', 'Unid.', 'Cant. Contrato', '', 'Actual', ''],
    ['1', 'Movimiento de Suelo', 'm3', '100', '', '30,00', ''],
    ['1.1', 'Excavación no clasificada', 'm3', '50', '', '20,00', ''],
    ['3.6', 'Base granular', 'm3', '200', '', '75,00', ''],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(rowsFoja2);
  const wb2 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb2, ws2, 'Foja 2');

  const parsedFoja2 = parsearFojaMedicion(wb2, 'Foja 2.xlsx');
  console.assert(parsedFoja2.numeroFoja === 2, `Debe detectar Foja Nº 2, obtenido: ${parsedFoja2.numeroFoja}`);

  // 4. Probar cruce y asignación en Plan de Trabajo
  // Incluye un ítem nuevo "27 (Nuevo)" que NO existe en las fojas 1 y 2
  const itemsPT: ItemContrato[] = [
    {
      id: 'pt1',
      numero: '1',
      descripcion: 'Movimiento de Suelo',
      precioUnitario: 1000,
      cantidadOriginal: 100,
      cantidadNueva: 100,
      avancesPorColumna: {},
    },
    {
      id: 'pt2',
      numero: '1.1',
      descripcion: 'Excavación no clasificada',
      precioUnitario: 500,
      cantidadOriginal: 50,
      cantidadNueva: 50,
      avancesPorColumna: {},
    },
    {
      id: 'pt3',
      numero: '3.6 (Nuevo)', // Con sufijo "(Nuevo)"
      descripcion: 'Base granular',
      precioUnitario: 800,
      cantidadOriginal: 200,
      cantidadNueva: 250,
      avancesPorColumna: {},
    },
    {
      id: 'pt4',
      numero: '27 (Nuevo)', // Ítem nuevo NO presente en Foja 1 ni en Foja 2
      descripcion: 'Señalización Adicional',
      precioUnitario: 200,
      cantidadOriginal: 0,
      cantidadNueva: 30,
      avancesPorColumna: {},
    },
  ];

  const mesesConfigInicial: MesConfig[] = [
    { mesNumero: 1, estado: 'provisorio' },
    { mesNumero: 2, estado: 'provisorio' },
    { mesNumero: 3, estado: 'provisorio' },
  ];

  const mesFinal = 4; // Cierre en mes 4

  const resAplicar = aplicarFojasEnPlanTrabajo(
    itemsPT,
    mesesConfigInicial,
    mesFinal,
    [parsedFoja1, parsedFoja2]
  );

  console.assert(resAplicar.maxNumeroFoja === 2, `Mayor foja debe ser 2, obtenido: ${resAplicar.maxNumeroFoja}`);

  // Verificar avances asignados por cruce
  const it1Actualizado = resAplicar.nuevosItems.find((it) => it.id === 'pt1');
  const it36Actualizado = resAplicar.nuevosItems.find((it) => it.id === 'pt3');
  const it27Actualizado = resAplicar.nuevosItems.find((it) => it.id === 'pt4');

  console.assert(it1Actualizado?.avancesPorColumna['mes_1'] === 25.5, `pt1 mes_1 debe ser 25.5, obtenido: ${it1Actualizado?.avancesPorColumna['mes_1']}`);
  console.assert(it1Actualizado?.avancesPorColumna['mes_2'] === 30.0, `pt1 mes_2 debe ser 30.0, obtenido: ${it1Actualizado?.avancesPorColumna['mes_2']}`);

  // "3.6 (Nuevo)" debe haber cruzado con "3.6"
  console.assert(it36Actualizado?.avancesPorColumna['mes_1'] === 50.0, `pt3 mes_1 debe ser 50.0, obtenido: ${it36Actualizado?.avancesPorColumna['mes_1']}`);
  console.assert(it36Actualizado?.avancesPorColumna['mes_2'] === 75.0, `pt3 mes_2 debe ser 75.0, obtenido: ${it36Actualizado?.avancesPorColumna['mes_2']}`);

  // "27 (Nuevo)" no estaba en las fojas: debe quedar en 0 sin error
  console.assert(it27Actualizado?.avancesPorColumna['mes_1'] === 0, `pt4 mes_1 debe ser 0, obtenido: ${it27Actualizado?.avancesPorColumna['mes_1']}`);
  console.assert(it27Actualizado?.avancesPorColumna['mes_2'] === 0, `pt4 mes_2 debe ser 0, obtenido: ${it27Actualizado?.avancesPorColumna['mes_2']}`);

  // Verificar que el corte de Definitivos se actualizó al mayor número de foja (2)
  const cfgM1 = resAplicar.nuevasConfigMeses.find((c) => c.mesNumero === 1);
  const cfgM2 = resAplicar.nuevasConfigMeses.find((c) => c.mesNumero === 2);
  const cfgM3 = resAplicar.nuevasConfigMeses.find((c) => c.mesNumero === 3);

  console.assert(cfgM1?.estado === 'definitivo', 'Mes 1 debe ser definitivo');
  console.assert(cfgM2?.estado === 'definitivo', 'Mes 2 debe ser definitivo');
  console.assert(cfgM3?.estado === 'provisorio', 'Mes 3 debe ser provisorio');

  // Verificar que el monto certificado definitivo quedó libre (undefined) para carga manual
  console.assert(cfgM1?.montoCertificadoDefinitivo === undefined, 'Monto definitivo debe quedar libre');
  console.assert(cfgM2?.montoCertificadoDefinitivo === undefined, 'Monto definitivo debe quedar libre');

  // Verificar que los precios unitarios y cantidades contractuales permanecieron intactos
  console.assert(it1Actualizado?.precioUnitario === 1000, 'Precio unitario debe permanecer intacto');
  console.assert(it1Actualizado?.cantidadOriginal === 100, 'Cantidad original debe permanecer intacta');

  console.log('✓ Importador de Fojas de Medición y cruce verificado exitosamente.\n');
}

testExcel3Hojas().then(() => {
  console.log('TODAS LAS PRUEBAS MATEMÁTICAS Y DE NEGOCIO PASARON EXITOSAMENTE!');
}).catch((err) => {
  console.error('Error en pruebas:', err);
  process.exit(1);
});
