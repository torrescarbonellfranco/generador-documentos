import Decimal from 'decimal.js';
import {
  ItemContrato,
  MesConfig,
  ItemCalculado,
  FilaCurvaInversion,
  ResultadoConvalidacion,
  ColumnaCierreInfo,
  EscenarioCierre,
} from '@/modules/plan-convalidacion/types/convalidacion';

// Configurar precisión de Decimal
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Redondeo seguro a N decimales usando Decimal.js
 */
export function roundTo(val: number | Decimal, decimals: number): number {
  return new Decimal(val).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Formateo de moneda según norma argentina: $ 1.234.567,89
 */
export function formatMonedaArg(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '$ 0,00';
  const parts = roundTo(val, 2).toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1];
  return `$ ${integerPart},${decimalPart}`;
}

/**
 * Formateo de porcentajes con cantidad configurable de decimales (ej: 4 decimales: 104,1690%)
 */
export function formatPorcentaje(val: number | undefined | null, decimals: number = 4): string {
  if (val === undefined || val === null || isNaN(val)) return '0,0000%';
  const pctValue = new Decimal(val).times(100);
  const parts = roundTo(pctValue, decimals).toFixed(decimals).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1] || '0'.repeat(decimals);
  return `${integerPart},${decimalPart}%`;
}

/**
 * Determina si una fila es título / rubro
 */
export function esFilaTitulo(item: ItemContrato): boolean {
  return (
    (item.precioUnitario === 0 || isNaN(item.precioUnitario)) &&
    (item.cantidadOriginal === 0 || isNaN(item.cantidadOriginal)) &&
    (item.cantidadNueva === 0 || isNaN(item.cantidadNueva))
  );
}

/**
 * Genera la lista de columnas de trabajo según el mes final y la presencia de adicionales
 */
export function generarColumnasCierre(
  mesFinal: number,
  hayAdicionales: boolean
): ColumnaCierreInfo[] {
  const columnas: ColumnaCierreInfo[] = [];

  // Meses previos al cierre: 1 .. mesFinal - 1
  for (let m = 1; m < mesFinal; m++) {
    columnas.push({
      id: `mes_${m}`,
      label: `Mes ${m}`,
      tipo: 'mes_previo',
      mesNumero: m,
      esAdicional: false,
    });
  }

  // Cierre en mesFinal
  if (!hayAdicionales) {
    // Escenario A: No se desdobla el mes final
    columnas.push({
      id: `mes_${mesFinal}`,
      label: `Mes ${mesFinal}`,
      tipo: 'cierre_original',
      mesNumero: mesFinal,
      esAdicional: false,
    });
  } else {
    // Escenarios B y C: Se desdobla en Obra Original y Adicionales
    columnas.push({
      id: `mes_${mesFinal}_orig`,
      label: `Mes ${mesFinal} (Obra Orig.)`,
      tipo: 'cierre_original',
      mesNumero: mesFinal,
      esAdicional: false,
    });
    columnas.push({
      id: `mes_${mesFinal}_adic`,
      label: `Mes ${mesFinal} (Adicionales)`,
      tipo: 'cierre_adicional',
      mesNumero: mesFinal,
      esAdicional: true,
    });
  }

  return columnas;
}

/**
 * Motor principal de cálculo de convalidación
 */
export function calcularConvalidacion(
  items: ItemContrato[],
  mesesConfig: MesConfig[],
  mesFinal: number
): ResultadoConvalidacion {
  // 1. Detección de Totales Globales
  let totalOriginalDec = new Decimal(0);
  let totalNuevoDec = new Decimal(0);
  let hayAdicionales = false;
  let hayDisminuciones = false;

  for (const it of items) {
    const pu = new Decimal(it.precioUnitario || 0);
    const h = new Decimal(it.cantidadOriginal || 0);
    const cv = new Decimal(it.cantidadNueva || 0);

    const esTitulo = esFilaTitulo(it);
    if (!esTitulo) {
      totalOriginalDec = totalOriginalDec.plus(pu.times(h));
      totalNuevoDec = totalNuevoDec.plus(pu.times(cv));

      if (cv.greaterThan(h)) {
        hayAdicionales = true;
      }
      if (cv.lessThan(h)) {
        hayDisminuciones = true;
      }
    }
  }

  const montoObraOriginal = roundTo(totalOriginalDec, 2);
  const montoObraNuevo = roundTo(totalNuevoDec, 2);
  const diferenciaNetaMonto = roundTo(totalNuevoDec.minus(totalOriginalDec), 2);
  const diferenciaNetaPorcentaje =
    montoObraOriginal > 0
      ? roundTo(totalNuevoDec.minus(totalOriginalDec).dividedBy(totalOriginalDec), 6)
      : 0;

  // 2. Determinar Escenario de Cierre
  let escenario: EscenarioCierre = 'A_SOLO_DISMINUCION';
  let descripcionEscenario = '';

  if (!hayAdicionales) {
    escenario = 'A_SOLO_DISMINUCION';
    descripcionEscenario =
      'Escenario A: Solo Disminución de Obra. La curva no se desdobla y concluye en Mes ' +
      mesFinal +
      '.';
  } else if (!hayDisminuciones) {
    escenario = 'B_SOLO_ADICIONALES';
    descripcionEscenario =
      'Escenario B: Solo Adicionales. Obra Original cierra exactamente al 100% en columna A y Adicionales en columna B.';
  } else {
    escenario = 'C_MIXTO';
    descripcionEscenario =
      'Escenario C: Mixto (Disminución + Adicionales). Obra Original cierra con el valor real ejecutado en columna A y Adicionales en columna B.';
  }

  // 3. Generar columnas
  const columnas = generarColumnasCierre(mesFinal, hayAdicionales);

  // Helper para buscar configuración de un mes
  const getConfigMes = (m: number): MesConfig => {
    return mesesConfig.find((c) => c.mesNumero === m) || { mesNumero: m, estado: 'provisorio' };
  };

  // 4. Calcular Control Físico por Ítem (CW_i y CX_i)
  const itemsCalculados: ItemCalculado[] = items.map((it) => {
    const esTitulo = esFilaTitulo(it);
    const pu = new Decimal(it.precioUnitario || 0);
    const h = new Decimal(it.cantidadOriginal || 0);
    const cv = new Decimal(it.cantidadNueva || 0);

    const costoItemBasico = roundTo(pu.times(h), 2);
    const costoItemModificado = roundTo(pu.times(cv), 2);

    const incidenciaOriginal =
      montoObraOriginal > 0 ? roundTo(new Decimal(costoItemBasico).dividedBy(montoObraOriginal), 6) : 0;
    const incidenciaNueva =
      montoObraOriginal > 0
        ? roundTo(new Decimal(costoItemModificado).dividedBy(montoObraOriginal), 6)
        : 0;

    let tipoAlteracion: ItemCalculado['tipoAlteracion'] = 'sin_cambio';
    if (esTitulo) {
      tipoAlteracion = 'titulo';
    } else if (h.isZero() && cv.greaterThan(0)) {
      tipoAlteracion = 'item_nuevo';
    } else if (cv.isZero() && h.greaterThan(0)) {
      tipoAlteracion = 'suprimido';
    } else if (cv.lessThan(h)) {
      tipoAlteracion = 'disminuido';
    } else if (cv.greaterThan(h)) {
      tipoAlteracion = 'adicional_item';
    }

    // Cantidad ejecutada de obra original
    let cantEjecutadaOrigDec = new Decimal(0);
    for (let m = 1; m < mesFinal; m++) {
      const q = it.avancesPorColumna?.[`mes_${m}`] || 0;
      cantEjecutadaOrigDec = cantEjecutadaOrigDec.plus(q);
    }
    // Sumar el mes final original
    const colCierreOrigId = hayAdicionales ? `mes_${mesFinal}_orig` : `mes_${mesFinal}`;
    const qCierreOrig = it.avancesPorColumna?.[colCierreOrigId] || 0;
    cantEjecutadaOrigDec = cantEjecutadaOrigDec.plus(qCierreOrig);

    const cantidadEjecutadaOriginal = roundTo(cantEjecutadaOrigDec, 4);

    // Cantidad ejecutada en columna de adicionales
    let cantEjecutadaAdicDec = new Decimal(0);
    if (hayAdicionales && !esTitulo) {
      const colAdicId = `mes_${mesFinal}_adic`;
      const qAdic = it.avancesPorColumna?.[colAdicId] || 0;
      cantEjecutadaAdicDec = new Decimal(qAdic);
    }
    const cantidadEjecutadaAdicional = roundTo(cantEjecutadaAdicDec, 4);

    // Total ejecutado (Orig + Adic)
    const cantEjecutadaTotalDec = cantEjecutadaOrigDec.plus(cantEjecutadaAdicDec);
    const cantidadEjecutadaTotal = roundTo(cantEjecutadaTotalDec, 4);

    // Cantidad tope de obra original permitida es min(H_i, CV_i)
    const topeOriginal = Decimal.min(h, cv);
    // Saldo real pendiente (permite negativo si hay exceso sobre el tope!)
    const saldoOrigRealDec = topeOriginal.minus(cantEjecutadaOrigDec);
    const cantidadPendienteOriginal = esTitulo ? 0 : roundTo(saldoOrigRealDec, 4);

    // Cantidad tope adicional es max(0, CV_i - H_i)
    const topeAdicional = Decimal.max(0, cv.minus(h));
    const saldoAdicRealDec = topeAdicional.minus(cantEjecutadaAdicDec);
    const cantidadPendienteAdicional = (hayAdicionales && !esTitulo) ? roundTo(saldoAdicRealDec, 4) : 0;

    // VALIDACIÓN DE TOPES FÍSICOS (REGLAS 1, 2 Y 3)
    let ejecucionEnItemSuprimido = false;
    let excedeTopeOriginal = false;
    let excesoOriginalMonto = 0;
    let excedeTopeTotal = false;
    let excesoTotalMonto = 0;
    let mensajeAlertaFisica: string | undefined = undefined;

    if (!esTitulo) {
      // Regla 1: Ítem Suprimido (Cant. Nueva === 0) con ejecución > 0
      if (cv.isZero() && cantEjecutadaTotalDec.greaterThan(0)) {
        ejecucionEnItemSuprimido = true;
        mensajeAlertaFisica = `Ítem suprimido (Cant. Nueva = 0): no admite ejecución (ejecutado: ${cantidadEjecutadaTotal})`;
      }
      // Regla 2: Exceso sobre Contrato Original
      else if (cantEjecutadaOrigDec.greaterThan(topeOriginal.plus(0.0001))) {
        excedeTopeOriginal = true;
        excesoOriginalMonto = roundTo(cantEjecutadaOrigDec.minus(topeOriginal), 4);
        mensajeAlertaFisica = `Excede tope de Obra Original en +${excesoOriginalMonto} unidades (tope: ${topeOriginal.toNumber()})`;
      }

      // Regla 3: Exceso sobre Cantidad Nueva Total (Total Ejecutado > Cant. Nueva)
      if (cantEjecutadaTotalDec.greaterThan(cv.plus(0.0001))) {
        excedeTopeTotal = true;
        excesoTotalMonto = roundTo(cantEjecutadaTotalDec.minus(cv), 4);
        if (!mensajeAlertaFisica) {
          mensajeAlertaFisica = `Exceso físico: Ejecutado (${cantidadEjecutadaTotal}) supera Cant. Nueva (${cv.toNumber()})`;
        }
      }
    }

    const tieneErrorFisico = ejecucionEnItemSuprimido || excedeTopeOriginal || excedeTopeTotal;

    // Porcentaje acumulado ejecutado sobre cantidad original: (Total Ejecutado / H_i) * 100
    let porcentajeAcumuladoOriginal = 0;
    if (!esTitulo) {
      if (h.greaterThan(0)) {
        porcentajeAcumuladoOriginal = roundTo(cantEjecutadaTotalDec.dividedBy(h).times(100), 2);
      } else if (cv.greaterThan(0)) {
        porcentajeAcumuladoOriginal = roundTo(cantEjecutadaTotalDec.dividedBy(cv).times(100), 2);
      }
    }

    return {
      item: it,
      esTitulo,
      costoItemBasico,
      incidenciaOriginal,
      costoItemModificado,
      incidenciaNueva,
      diferenciaCantidad: roundTo(cv.minus(h), 4),
      diferenciaMonto: roundTo(costoItemModificado - costoItemBasico, 2),
      tipoAlteracion,
      cantidadEjecutadaOriginal,
      cantidadEjecutadaAdicional,
      cantidadEjecutadaTotal,
      cantidadPendienteOriginal,
      cantidadPendienteAdicional,
      porcentajeAcumuladoOriginal,
      excedeTopeOriginal,
      excesoOriginalMonto,
      excedeTopeTotal,
      excesoTotalMonto,
      ejecucionEnItemSuprimido,
      tieneErrorFisico,
      mensajeAlertaFisica,
    };
  });

  const itemsConExceso = itemsCalculados.filter((it) => !it.esTitulo && it.tieneErrorFisico);
  const tieneAlertasFisicas = itemsConExceso.length > 0;
  const cantidadItemsConAlerta = itemsConExceso.length;

  const totalPendienteOriginal = itemsCalculados.reduce(
    (acc, it) => acc + (it.esTitulo ? 0 : Math.max(0, it.cantidadPendienteOriginal)),
    0
  );
  const totalPendienteAdicional = itemsCalculados.reduce(
    (acc, it) => acc + (it.esTitulo ? 0 : Math.max(0, it.cantidadPendienteAdicional)),
    0
  );
  const saldosFisicosCerrados =
    !tieneAlertasFisicas &&
    roundTo(totalPendienteOriginal, 2) === 0 &&
    (!hayAdicionales || roundTo(totalPendienteAdicional, 2) === 0);

  // 5. Construir la Curva de Inversión (Fila por Columna)
  const curva: FilaCurvaInversion[] = [];
  let acumuladoMontoDec = new Decimal(0);
  let acumuladoPorcDec = new Decimal(0);

  // Procesar meses previos (1 .. mesFinal - 1)
  for (let m = 1; m < mesFinal; m++) {
    const colId = `mes_${m}`;
    const cfg = getConfigMes(m);

    // Calcular avance físico teórico del mes
    let montoTeoricoDec = new Decimal(0);
    for (const it of items) {
      if (!esFilaTitulo(it)) {
        const pu = new Decimal(it.precioUnitario || 0);
        const q = new Decimal(it.avancesPorColumna?.[colId] || 0);
        montoTeoricoDec = montoTeoricoDec.plus(pu.times(q));
      }
    }
    const montoTeoricoFisico = roundTo(montoTeoricoDec, 2);

    let montoMensual = 0;
    let porcMensual = 0;

    if (cfg.estado === 'definitivo' && cfg.montoCertificadoDefinitivo !== undefined && cfg.montoCertificadoDefinitivo !== null) {
      // Meses Definitivos: El valor certificado exacto manda sobre el cálculo físico ($ -> %)
      montoMensual = roundTo(cfg.montoCertificadoDefinitivo, 2);
      porcMensual =
        montoObraOriginal > 0
          ? roundTo(new Decimal(montoMensual).dividedBy(montoObraOriginal), 6)
          : 0;
    } else {
      // Meses Provisorios (Método Municipal Neuquén: % -> $):
      // 1. Incidencia Original exacta: IncOrig_i = CostoItemBasico_i / MontoObraOriginal (0 si H_i = 0)
      // 2. Avance mensual del ítem s/ original: p_{i,m} = q_{i,m} / H_i (0 si H_i = 0)
      // 3. PorcMensual = ROUND(SUM(p_{i,m} * IncOrig_i), 6)
      // 4. MontoMensual = ROUND(PorcMensual * MontoObraOriginal, 2)
      let sumPorcIncDec = new Decimal(0);
      if (montoObraOriginal > 0) {
        for (const it of items) {
          if (!esFilaTitulo(it)) {
            const h = new Decimal(it.cantidadOriginal || 0);
            if (h.greaterThan(0)) {
              const pu = new Decimal(it.precioUnitario || 0);
              const q = new Decimal(it.avancesPorColumna?.[colId] || 0);
              const p_im = q.dividedBy(h);
              const incOrig_i = pu.times(h).dividedBy(montoObraOriginal);
              sumPorcIncDec = sumPorcIncDec.plus(p_im.times(incOrig_i));
            }
          }
        }
      }

      porcMensual = roundTo(sumPorcIncDec, 6);
      montoMensual = roundTo(new Decimal(porcMensual).times(montoObraOriginal), 2);
    }

    acumuladoMontoDec = acumuladoMontoDec.plus(montoMensual);
    acumuladoPorcDec = acumuladoPorcDec.plus(porcMensual);

    curva.push({
      columnaId: colId,
      label: `Mes ${m}`,
      tipo: 'mes_previo',
      mesNumero: m,
      estado: cfg.estado,
      montoMensual,
      porcentajeMensual: porcMensual,
      montoAcumulado: roundTo(acumuladoMontoDec, 2),
      porcentajeAcumulado: roundTo(acumuladoPorcDec, 6),
      montoTeoricoFisico,
    });
  }

  // Guardar acumulados inmediatamente previos al cierre
  const acumuladoPrevioMontoDec = acumuladoMontoDec;
  const acumuladoPrevioPorcDec = acumuladoPorcDec;

  // Procesar Columna(s) de Cierre según Escenario A, B o C
  if (escenario === 'A_SOLO_DISMINUCION') {
    // Escenario A: No se desdobla el último mes
    const colId = `mes_${mesFinal}`;
    const montoAcumuladoFinal = montoObraNuevo;
    const porcAcumuladoFinal =
      montoObraOriginal > 0
        ? roundTo(new Decimal(montoObraNuevo).dividedBy(montoObraOriginal), 6)
        : 0;

    // Absorbe redondeos previos
    const montoMensualFinal = roundTo(
      new Decimal(montoAcumuladoFinal).minus(acumuladoPrevioMontoDec),
      2
    );
    const porcMensualFinal = roundTo(
      new Decimal(porcAcumuladoFinal).minus(acumuladoPrevioPorcDec),
      6
    );

    curva.push({
      columnaId: colId,
      label: `Mes ${mesFinal}`,
      tipo: 'cierre_original',
      mesNumero: mesFinal,
      estado: 'provisorio',
      montoMensual: montoMensualFinal,
      porcentajeMensual: porcMensualFinal,
      montoAcumulado: montoAcumuladoFinal,
      porcentajeAcumulado: porcAcumuladoFinal,
      absorbeRedondeo: true,
    });
  } else if (escenario === 'B_SOLO_ADICIONALES') {
    // Escenario B: Solo adicionales. Obra Original cierra exactamente al 100%
    const colOrigId = `mes_${mesFinal}_orig`;
    const colAdicId = `mes_${mesFinal}_adic`;

    // 1. Columna Cierre Obra Original (100%)
    const montoAcumuladoOrig = montoObraOriginal;
    const porcAcumuladoOrig = 1.0; // 100.0000%
    const montoMensualOrig = roundTo(
      new Decimal(montoAcumuladoOrig).minus(acumuladoPrevioMontoDec),
      2
    );
    const porcMensualOrig = roundTo(new Decimal(1.0).minus(acumuladoPrevioPorcDec), 6);

    curva.push({
      columnaId: colOrigId,
      label: `Mes ${mesFinal} (Obra Orig.)`,
      tipo: 'cierre_original',
      mesNumero: mesFinal,
      estado: 'provisorio',
      montoMensual: montoMensualOrig,
      porcentajeMensual: porcMensualOrig,
      montoAcumulado: montoAcumuladoOrig,
      porcentajeAcumulado: porcAcumuladoOrig,
      absorbeRedondeo: true,
    });

    // 2. Columna Cierre Adicionales
    const montoAcumuladoAdic = montoObraNuevo;
    const porcAcumuladoAdic =
      montoObraOriginal > 0
        ? roundTo(new Decimal(montoObraNuevo).dividedBy(montoObraOriginal), 6)
        : 0;
    const montoMensualAdic = roundTo(
      new Decimal(montoAcumuladoAdic).minus(montoAcumuladoOrig),
      2
    );
    const porcMensualAdic = roundTo(new Decimal(porcAcumuladoAdic).minus(1.0), 6);

    curva.push({
      columnaId: colAdicId,
      label: `Mes ${mesFinal} (Adicionales)`,
      tipo: 'cierre_adicional',
      mesNumero: mesFinal,
      estado: 'provisorio',
      montoMensual: montoMensualAdic,
      porcentajeMensual: porcMensualAdic,
      montoAcumulado: montoAcumuladoAdic,
      porcentajeAcumulado: porcAcumuladoAdic,
      absorbeRedondeo: false,
    });
  } else {
    // Escenario C: Mixto (Disminución + Adicionales)
    const colOrigId = `mes_${mesFinal}_orig`;
    const colAdicId = `mes_${mesFinal}_adic`;

    // SUMAPRODUCTO exacto de cantidades ejecutadas de obra original por precio unitario
    // (acotadas a min(H_i, CV_i) para no computar adicionales en la columna de obra original)
    let sumaProductoOrigDec = new Decimal(0);
    for (const it of itemsCalculados) {
      if (!it.esTitulo) {
        const pu = new Decimal(it.item.precioUnitario || 0);
        const topeOrig = Decimal.min(
          it.item.cantidadOriginal || 0,
          it.item.cantidadNueva || 0
        );
        // Cantidad física acumulada de obra original (hasta mesFinal_orig)
        const cantAcumOrig = Decimal.min(it.cantidadEjecutadaOriginal, topeOrig);
        sumaProductoOrigDec = sumaProductoOrigDec.plus(pu.times(cantAcumOrig));
      }
    }

    const montoAcumuladoOrig = roundTo(sumaProductoOrigDec, 2);
    const porcAcumuladoOrig =
      montoObraOriginal > 0
        ? roundTo(new Decimal(montoAcumuladoOrig).dividedBy(montoObraOriginal), 6)
        : 0;

    const montoMensualOrig = roundTo(
      new Decimal(montoAcumuladoOrig).minus(acumuladoPrevioMontoDec),
      2
    );
    const porcMensualOrig = roundTo(
      new Decimal(porcAcumuladoOrig).minus(acumuladoPrevioPorcDec),
      6
    );

    curva.push({
      columnaId: colOrigId,
      label: `Mes ${mesFinal} (Obra Orig.)`,
      tipo: 'cierre_original',
      mesNumero: mesFinal,
      estado: 'provisorio',
      montoMensual: montoMensualOrig,
      porcentajeMensual: porcMensualOrig,
      montoAcumulado: montoAcumuladoOrig,
      porcentajeAcumulado: porcAcumuladoOrig,
      absorbeRedondeo: true,
    });

    // 2. Columna Cierre Adicionales
    const montoAcumuladoAdic = montoObraNuevo;
    const porcAcumuladoAdic =
      montoObraOriginal > 0
        ? roundTo(new Decimal(montoObraNuevo).dividedBy(montoObraOriginal), 6)
        : 0;

    const montoMensualAdic = roundTo(
      new Decimal(montoAcumuladoAdic).minus(montoAcumuladoOrig),
      2
    );
    const porcMensualAdic = roundTo(
      new Decimal(porcAcumuladoAdic).minus(porcAcumuladoOrig),
      6
    );

    curva.push({
      columnaId: colAdicId,
      label: `Mes ${mesFinal} (Adicionales)`,
      tipo: 'cierre_adicional',
      mesNumero: mesFinal,
      estado: 'provisorio',
      montoMensual: montoMensualAdic,
      porcentajeMensual: porcMensualAdic,
      montoAcumulado: montoAcumuladoAdic,
      porcentajeAcumulado: porcAcumuladoAdic,
      absorbeRedondeo: false,
    });
  }

  return {
    montoObraOriginal,
    montoObraNuevo,
    diferenciaNetaMonto,
    diferenciaNetaPorcentaje,
    hayAdicionales,
    hayDisminuciones,
    escenario,
    descripcionEscenario,
    columnas,
    itemsCalculados,
    curva,
    totalPendienteOriginal,
    totalPendienteAdicional,
    saldosFisicosCerrados,
    itemsConExceso,
    tieneAlertasFisicas,
    cantidadItemsConAlerta,
  };
}

/**
 * Ajusta automáticamente las cantidades al tope permitido por contrato:
 * - Ítems suprimidos (CV = 0) se limpian a 0
 * - Meses de obra original se acotan a mín(H, CV)
 * - Columna de adicionales se acota a máx(0, CV - H)
 */
export function ajustarCantidadesAlTope(
  items: ItemContrato[],
  mesFinal: number,
  hayAdicionales: boolean
): ItemContrato[] {
  return items.map((it) => {
    if (esFilaTitulo(it)) return it;
    const h = new Decimal(it.cantidadOriginal || 0);
    const cv = new Decimal(it.cantidadNueva || 0);
    const topeOrig = Decimal.min(h, cv);
    const topeAdic = Decimal.max(0, cv.minus(h));

    // Si es ítem suprimido (cv === 0), todas las cantidades a 0
    if (cv.isZero()) {
      return {
        ...it,
        avancesPorColumna: {},
      };
    }

    const nuevosAvances: Record<string, number> = { ...(it.avancesPorColumna || {}) };

    // Acotar cantidades de meses 1 .. mesFinal - 1
    let sumOrig = new Decimal(0);
    for (let m = 1; m < mesFinal; m++) {
      const key = `mes_${m}`;
      let q = new Decimal(nuevosAvances[key] || 0);
      if (sumOrig.plus(q).greaterThan(topeOrig)) {
        q = Decimal.max(0, topeOrig.minus(sumOrig));
      }
      nuevosAvances[key] = roundTo(q, 4);
      sumOrig = sumOrig.plus(q);
    }

    // Mes final obra original absorbe el saldo restante hasta topeOrig
    const colCierreOrig = hayAdicionales ? `mes_${mesFinal}_orig` : `mes_${mesFinal}`;
    const saldoOrig = Decimal.max(0, topeOrig.minus(sumOrig));
    nuevosAvances[colCierreOrig] = roundTo(saldoOrig, 4);

    // Columna de adicionales acotada al topeAdic
    if (hayAdicionales) {
      const colAdic = `mes_${mesFinal}_adic`;
      nuevosAvances[colAdic] = roundTo(topeAdic, 4);
    }

    return {
      ...it,
      avancesPorColumna: nuevosAvances,
    };
  });
}

/**
 * Función pura para autocompletar saldos pendientes en el cierre:
 * - Vuelca CW_i en la columna de cierre de Obra Original
 * - Vuelca CX_i en la columna de Adicionales (si hay adicionales)
 */
export function autocompletarSaldosCierre(
  items: ItemContrato[],
  mesFinal: number,
  hayAdicionales: boolean
): ItemContrato[] {
  return items.map((it) => {
    if (esFilaTitulo(it)) {
      return it;
    }

    const h = new Decimal(it.cantidadOriginal || 0);
    const cv = new Decimal(it.cantidadNueva || 0);

    // Sumar lo ejecutado en meses 1 .. mesFinal - 1
    let sumPrevDec = new Decimal(0);
    for (let m = 1; m < mesFinal; m++) {
      const q = it.avancesPorColumna?.[`mes_${m}`] || 0;
      sumPrevDec = sumPrevDec.plus(q);
    }

    // Saldo para Obra Original: min(H_i, CV_i) - sumPrev
    const topeOrig = Decimal.min(h, cv);
    const saldoOrig = Decimal.max(0, topeOrig.minus(sumPrevDec)).toNumber();

    const nuevoAvance: Record<string, number> = { ...(it.avancesPorColumna || {}) };

    if (!hayAdicionales) {
      nuevoAvance[`mes_${mesFinal}`] = roundTo(saldoOrig, 4);
    } else {
      nuevoAvance[`mes_${mesFinal}_orig`] = roundTo(saldoOrig, 4);

      // Saldo Adicional: max(0, CV_i - H_i)
      const saldoAdic = Decimal.max(0, cv.minus(h)).toNumber();
      nuevoAvance[`mes_${mesFinal}_adic`] = roundTo(saldoAdic, 4);
    }

    return {
      ...it,
      avancesPorColumna: nuevoAvance,
    };
  });
}

/**
 * Calcula el avance en un mes provisorio a partir de un porcentaje ingresado:
 * - Calcula PorcObjetivo = min(H, CV) / H * 100
 * - Suma cantidades y porcentajes de meses previos (1 .. colMesNumero - 1)
 * - Si totalPct >= PorcObjetivo - 0.01%: ajusta por diferencia exacta contra min(H, CV) - sumPrevQ
 *   evitando errores residuales de redondeo.
 * - Sino: calcula roundTo((porcentaje / 100) * H, 4).
 */
export function calcularAvanceProvisorioConAjuste(
  item: ItemContrato,
  colMesNumero: number,
  porcentajeIngresado: number
): { cantidad: number; porcentajeEfectivo: number; esCompletado: boolean } {
  const h = item.cantidadOriginal || 0;
  const cv = item.cantidadNueva || 0;
  if (h <= 0) {
    return { cantidad: 0, porcentajeEfectivo: 0, esCompletado: false };
  }

  const tope = Math.min(h, cv);
  const porcObjetivo = roundTo((tope / h) * 100, 4);

  // Sumar cantidades ejecutadas en meses previos (1 .. colMesNumero - 1)
  let sumPrevQDec = new Decimal(0);
  for (let m = 1; m < colMesNumero; m++) {
    const q = item.avancesPorColumna?.[`mes_${m}`] || 0;
    sumPrevQDec = sumPrevQDec.plus(q);
  }
  const sumPrevQ = sumPrevQDec.toNumber();
  const sumPrevPct = roundTo((sumPrevQ / h) * 100, 4);

  const totalPct = sumPrevPct + porcentajeIngresado;

  // Si completa el objetivo contractual (o lo supera dentro de tolerancia)
  if (totalPct >= porcObjetivo - 0.01) {
    const qAjustada = Math.max(0, roundTo(new Decimal(tope).minus(sumPrevQDec), 4));
    const porcEfectivo = Math.max(0, roundTo(porcObjetivo - sumPrevPct, 2));
    return { cantidad: qAjustada, porcentajeEfectivo: porcEfectivo, esCompletado: true };
  } else {
    const q = roundTo(new Decimal(porcentajeIngresado).dividedBy(100).times(h), 4);
    return { cantidad: q, porcentajeEfectivo: roundTo(porcentajeIngresado, 2), esCompletado: false };
  }
}

