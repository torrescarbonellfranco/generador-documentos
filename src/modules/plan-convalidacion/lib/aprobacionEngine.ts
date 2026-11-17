import Decimal from 'decimal.js';
import {
  ItemContrato,
  MesConfig,
  ItemCalculado,
  FilaCurvaInversion,
  ResultadoConvalidacion,
  ColumnaCierreInfo,
} from '@/modules/plan-convalidacion/types/convalidacion';
import { roundTo } from './convalidacionEngine';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Genera la lista de columnas continuas para el régimen de Aprobación (Mes 1 a Mes mesFinal)
 * Aprobación NO desdobla el último mes en Obra Original y Adicionales.
 */
export function generarColumnasAprobacion(mesFinal: number): ColumnaCierreInfo[] {
  const columnas: ColumnaCierreInfo[] = [];

  for (let m = 1; m < mesFinal; m++) {
    columnas.push({
      id: `mes_${m}`,
      label: `Mes ${m}`,
      tipo: 'mes_previo',
      mesNumero: m,
      esAdicional: false,
    });
  }

  // Mes final de cierre unificado (sin desdoblamiento)
  columnas.push({
    id: `mes_${mesFinal}`,
    label: `Mes ${mesFinal}`,
    tipo: 'cierre_original',
    mesNumero: mesFinal,
    esAdicional: false,
  });

  return columnas;
}

/**
 * Obtiene el último mes con certificado definitivo correlativo (Principio de Correlatividad)
 */
export function obtenerCorteDefinitivoCorrelativo(
  mesesConfig: MesConfig[],
  mesFinal: number
): number {
  let maxDef = 0;
  for (let m = 1; m < mesFinal; m++) {
    const cfg = mesesConfig.find((c) => c.mesNumero === m);
    if (cfg?.estado === 'definitivo') {
      maxDef = m;
    } else {
      break; // Corte estricto en el primer mes provisorio
    }
  }
  return maxDef;
}

/**
 * Motor de Cálculo Oficial "Por Aprobación" (Basado en 8480 M 2025 - ALC 01-2026.xlsx)
 *
 * El denominador base para toda la serie de la curva es el Monto de Obra Nuevo
 * (MontoObraNuevo = SUM(CantNueva_i * PrecioUnitario_i)), garantizando un cierre
 * exacto al 100,0000% y por el monto aprobado.
 */
export function calcularAprobacion(
  items: ItemContrato[],
  mesesConfig: MesConfig[],
  mesFinal: number
): ResultadoConvalidacion {
  const columnas = generarColumnasAprobacion(mesFinal);
  const corteDefinitivo = obtenerCorteDefinitivoCorrelativo(mesesConfig, mesFinal);

  // 1. Detección de Totales Globales
  let totalOriginalDec = new Decimal(0);
  let totalNuevoDec = new Decimal(0);
  let hayAdicionales = false;
  let hayDisminuciones = false;

  for (const it of items) {
    const pu = new Decimal(it.precioUnitario || 0);
    const cantOrig = new Decimal(it.cantidadOriginal || 0);
    const cantNueva = new Decimal(it.cantidadNueva || 0);

    const costoOrig = pu.times(cantOrig);
    const costoNuevo = pu.times(cantNueva);

    totalOriginalDec = totalOriginalDec.plus(costoOrig);
    totalNuevoDec = totalNuevoDec.plus(costoNuevo);

    if (cantNueva.greaterThan(cantOrig)) hayAdicionales = true;
    if (cantNueva.lessThan(cantOrig)) hayDisminuciones = true;
  }

  const montoObraOriginal = roundTo(totalOriginalDec.toNumber(), 2);
  const montoObraNuevo = roundTo(totalNuevoDec.toNumber(), 2);
  const diferenciaNetaMonto = roundTo(montoObraNuevo - montoObraOriginal, 2);
  const diferenciaNetaPorcentaje =
    montoObraOriginal > 0
      ? roundTo(diferenciaNetaMonto / montoObraOriginal, 6)
      : 0;

  // 2. Cálculos e Incidencias por Ítem (Denominador Único = MontoObraNuevo)
  const itemsCalculados: ItemCalculado[] = [];
  const itemsConExceso: ItemCalculado[] = [];
  let totalPendienteDec = new Decimal(0);

  for (const it of items) {
    const pu = new Decimal(it.precioUnitario || 0);
    const cantOrig = new Decimal(it.cantidadOriginal || 0);
    const cantNueva = new Decimal(it.cantidadNueva || 0);

    const esTitulo =
      pu.isZero() && cantOrig.isZero() && cantNueva.isZero();

    const costoItemBasico = roundTo(pu.times(cantOrig).toNumber(), 2);
    const costoItemModificado = roundTo(pu.times(cantNueva).toNumber(), 2);

    const incidenciaOriginal =
      montoObraOriginal > 0
        ? roundTo(new Decimal(costoItemBasico).dividedBy(montoObraOriginal).toNumber(), 6)
        : 0;

    // En Aprobación: IncNueva_i = CostoItemModificado_i / MontoObraNuevo
    const incidenciaNueva =
      montoObraNuevo > 0
        ? roundTo(new Decimal(costoItemModificado).dividedBy(montoObraNuevo).toNumber(), 6)
        : 0;

    const diferenciaCantidad = roundTo(cantNueva.minus(cantOrig).toNumber(), 4);
    const diferenciaMonto = roundTo(costoItemModificado - costoItemBasico, 2);

    let tipoAlteracion: ItemCalculado['tipoAlteracion'] = 'sin_cambio';
    if (esTitulo) {
      tipoAlteracion = 'titulo';
    } else if (cantOrig.isZero() && cantNueva.greaterThan(0)) {
      tipoAlteracion = 'item_nuevo';
    } else if (cantNueva.isZero() && cantOrig.greaterThan(0)) {
      tipoAlteracion = 'suprimido';
    } else if (cantNueva.lessThan(cantOrig)) {
      tipoAlteracion = 'disminuido';
    } else if (cantNueva.greaterThan(cantOrig)) {
      tipoAlteracion = 'adicional_item';
    }

    // Suma de cantidades ejecutadas en todos los meses (Mes 1 a Mes mesFinal)
    let ejecutadoTotalDec = new Decimal(0);
    if (!esTitulo) {
      for (const col of columnas) {
        const val = it.avancesPorColumna?.[col.id] || 0;
        ejecutadoTotalDec = ejecutadoTotalDec.plus(new Decimal(val));
      }
    }

    const cantidadEjecutadaTotal = roundTo(ejecutadoTotalDec.toNumber(), 4);
    // En Aprobación, el saldo pendiente es respecto de la Cantidad Nueva (CV_i)
    const pendienteDec = Decimal.max(0, cantNueva.minus(ejecutadoTotalDec));
    const cantidadPendiente = roundTo(pendienteDec.toNumber(), 4);

    if (!esTitulo) {
      totalPendienteDec = totalPendienteDec.plus(pendienteDec);
    }

    const porcentajeAcumuladoOriginal =
      cantNueva.greaterThan(0)
        ? roundTo(ejecutadoTotalDec.dividedBy(cantNueva).times(100).toNumber(), 4)
        : 0;

    // Auditoría y validaciones de topes físicos por Cantidad Nueva autorizada
    const ejecucionEnItemSuprimido =
      !esTitulo && cantNueva.isZero() && cantidadEjecutadaTotal > 0.0001;

    const excedeTopeTotal =
      !esTitulo &&
      cantNueva.greaterThan(0) &&
      ejecutadoTotalDec.minus(cantNueva).toNumber() > 0.0005;

    const tieneErrorFisico = ejecucionEnItemSuprimido || excedeTopeTotal;

    let mensajeAlertaFisica: string | undefined;
    if (ejecucionEnItemSuprimido) {
      mensajeAlertaFisica = `Ítem suprimido (Cant. Nueva = 0): tiene ${cantidadEjecutadaTotal.toFixed(2)} certificadas`;
    } else if (excedeTopeTotal) {
      const exceso = roundTo(ejecutadoTotalDec.minus(cantNueva).toNumber(), 2);
      mensajeAlertaFisica = `Excede Cant. Nueva en ${exceso.toFixed(2)} ${it.unidad || 'unidades'}`;
    }

    const calc: ItemCalculado = {
      item: it,
      esTitulo,
      costoItemBasico,
      incidenciaOriginal,
      costoItemModificado,
      incidenciaNueva,
      diferenciaCantidad,
      diferenciaMonto,
      tipoAlteracion,
      cantidadEjecutadaOriginal: cantidadEjecutadaTotal,
      cantidadEjecutadaAdicional: 0,
      cantidadEjecutadaTotal,
      cantidadPendienteOriginal: cantidadPendiente,
      cantidadPendienteAdicional: 0,
      porcentajeAcumuladoOriginal,
      excedeTopeOriginal: false,
      excesoOriginalMonto: 0,
      excedeTopeTotal,
      excesoTotalMonto: excedeTopeTotal ? roundTo(pu.times(ejecutadoTotalDec.minus(cantNueva)).toNumber(), 2) : 0,
      ejecucionEnItemSuprimido,
      tieneErrorFisico,
      mensajeAlertaFisica,
    };

    itemsCalculados.push(calc);
    if (tieneErrorFisico) {
      itemsConExceso.push(calc);
    }
  }

  // 3. Cuadro de Curva Oficial "Por Aprobación"
  const curva: FilaCurvaInversion[] = [];
  let prevPorcAcumDec = new Decimal(0);
  let prevMontoAcumDec = new Decimal(0);

  for (let idx = 0; idx < columnas.length; idx++) {
    const col = columnas[idx];
    const m = col.mesNumero;
    const esFinal = m === mesFinal;
    const cfg = mesesConfig.find((c) => c.mesNumero === m);
    const esDefinitivo = !esFinal && m <= corteDefinitivo;

    let montoMensual = 0;
    let porcentajeMensual = 0;
    let montoAcumulado = 0;
    let porcentajeAcumulado = 0;

    if (esDefinitivo) {
      // 3.1 Mes Definitivo (1 <= m <= K):
      // MontoMensual[m] = MontoCertificadoIngresado[m]
      // PorcMensual[m] = ROUND(MontoMensual[m] / MontoObraNuevo, 6)
      montoMensual = roundTo(cfg?.montoCertificadoDefinitivo || 0, 2);
      porcentajeMensual =
        montoObraNuevo > 0 ? roundTo(montoMensual / montoObraNuevo, 6) : 0;

      const porcAcumDec = prevPorcAcumDec.plus(new Decimal(porcentajeMensual));
      const montoAcumDec = prevMontoAcumDec.plus(new Decimal(montoMensual));

      porcentajeAcumulado = roundTo(porcAcumDec.toNumber(), 6);
      montoAcumulado = roundTo(montoAcumDec.toNumber(), 2);

      prevPorcAcumDec = porcAcumDec;
      prevMontoAcumDec = montoAcumDec;
    } else if (!esFinal) {
      // 3.2 Mes Provisorio (K < m < mesFinal):
      // PorcMensual[m] = ROUND(SUM_i(p_{i,m} * IncNueva_i), 6)
      // donde p_{i,m} = CantEjecutada_{i,m} / CantNueva_i
      let sumaIncidenciasDec = new Decimal(0);

      for (const calc of itemsCalculados) {
        if (calc.esTitulo) continue;
        const cantNueva = calc.item.cantidadNueva || 0;
        if (cantNueva <= 0) continue;

        const val = calc.item.avancesPorColumna?.[col.id] || 0;
        if (val === 0) continue;

        // Proporción de avance del ítem en este mes (0 a 1)
        const p_im = new Decimal(val).dividedBy(new Decimal(cantNueva));
        const incNueva = new Decimal(calc.incidenciaNueva);
        sumaIncidenciasDec = sumaIncidenciasDec.plus(p_im.times(incNueva));
      }

      porcentajeMensual = roundTo(sumaIncidenciasDec.toNumber(), 6);
      montoMensual = roundTo(
        new Decimal(porcentajeMensual).times(new Decimal(montoObraNuevo)).toNumber(),
        2
      );

      const porcAcumDec = prevPorcAcumDec.plus(new Decimal(porcentajeMensual));
      const montoAcumDec = prevMontoAcumDec.plus(new Decimal(montoMensual));

      porcentajeAcumulado = roundTo(porcAcumDec.toNumber(), 6);
      montoAcumulado = roundTo(montoAcumDec.toNumber(), 2);

      prevPorcAcumDec = porcAcumDec;
      prevMontoAcumDec = montoAcumDec;
    } else {
      // 3.3 Mes Final (m = mesFinal): Cierre exacto al 100,0000% y MontoObraNuevo
      porcentajeAcumulado = 1.0;
      montoAcumulado = montoObraNuevo;

      porcentajeMensual = roundTo(
        new Decimal(1.0).minus(prevPorcAcumDec).toNumber(),
        6
      );
      montoMensual = roundTo(
        new Decimal(montoObraNuevo).minus(prevMontoAcumDec).toNumber(),
        2
      );
    }

    curva.push({
      columnaId: col.id,
      label: col.label,
      tipo: col.tipo,
      mesNumero: col.mesNumero,
      estado: esDefinitivo ? 'definitivo' : 'provisorio',
      montoMensual,
      porcentajeMensual,
      montoAcumulado,
      porcentajeAcumulado,
      absorbeRedondeo: esFinal,
    });
  }

  const totalPendienteOriginal = roundTo(totalPendienteDec.toNumber(), 4);
  const saldosFisicosCerrados = totalPendienteOriginal <= 0.0001;

  return {
    montoObraOriginal,
    montoObraNuevo,
    diferenciaNetaMonto,
    diferenciaNetaPorcentaje,
    hayAdicionales,
    hayDisminuciones,
    escenario: 'B_SOLO_ADICIONALES', // Compatibilidad de tipo
    descripcionEscenario: 'Régimen por Aprobación (100% sobre Monto Aprobado)',
    columnas,
    itemsCalculados,
    curva,
    totalPendienteOriginal,
    totalPendienteAdicional: 0,
    saldosFisicosCerrados,
    itemsConExceso,
    tieneAlertasFisicas: itemsConExceso.length > 0,
    cantidadItemsConAlerta: itemsConExceso.length,
  };
}

/**
 * Autocompleta los saldos físicos pendientes de cada ítem en el mes final
 * para que todos los ítems con Cantidad Nueva > 0 cierren al 100,00% de ejecución.
 */
export function autocompletarSaldosAprobacion(
  items: ItemContrato[],
  mesFinal: number
): ItemContrato[] {
  const colFinalId = `mes_${mesFinal}`;

  return items.map((it) => {
    // Si es título, no tiene avances
    if (
      (it.precioUnitario === 0 || isNaN(it.precioUnitario)) &&
      (it.cantidadOriginal === 0 || isNaN(it.cantidadOriginal)) &&
      (it.cantidadNueva === 0 || isNaN(it.cantidadNueva))
    ) {
      return it;
    }

    const cantNueva = it.cantidadNueva || 0;
    if (cantNueva <= 0) {
      // Ítems suprimidos no deben tener avance en el cierre
      const avances = { ...(it.avancesPorColumna || {}) };
      delete avances[colFinalId];
      return { ...it, avancesPorColumna: avances };
    }

    // Sumar avances de meses previos (Mes 1 a Mes mesFinal - 1)
    let ejecutadoPrevioDec = new Decimal(0);
    for (let m = 1; m < mesFinal; m++) {
      const val = it.avancesPorColumna?.[`mes_${m}`] || 0;
      ejecutadoPrevioDec = ejecutadoPrevioDec.plus(new Decimal(val));
    }

    // Saldo necesario para completar exactamente la Cantidad Nueva
    const saldoFinal = Decimal.max(
      0,
      new Decimal(cantNueva).minus(ejecutadoPrevioDec)
    );

    return {
      ...it,
      avancesPorColumna: {
        ...(it.avancesPorColumna || {}),
        [colFinalId]: roundTo(saldoFinal.toNumber(), 4),
      },
    };
  });
}

/**
 * Calcula el avance en cantidad física a partir del porcentaje deseado sobre Cantidad Nueva.
 * Si es el último mes provisorio y se desea cerrar al 100%, ajusta por diferencia.
 */
export function calcularAvanceProvisorioAprobacion(
  item: ItemContrato,
  mesNumero: number,
  porcAvanceDeseado: number,
  esUltimoProvisorio: boolean = false
): { cantidad: number } {
  const cantNueva = item.cantidadNueva || 0;
  if (cantNueva <= 0) return { cantidad: 0 };

  if (esUltimoProvisorio && porcAvanceDeseado >= 99.999) {
    // Ajuste por diferencia exacta
    let sumaPreviosDec = new Decimal(0);
    for (let m = 1; m < mesNumero; m++) {
      const v = item.avancesPorColumna?.[`mes_${m}`] || 0;
      sumaPreviosDec = sumaPreviosDec.plus(new Decimal(v));
    }
    const resto = Decimal.max(0, new Decimal(cantNueva).minus(sumaPreviosDec));
    return { cantidad: roundTo(resto.toNumber(), 4) };
  }

  const cantidad = roundTo(
    new Decimal(porcAvanceDeseado)
      .dividedBy(100)
      .times(new Decimal(cantNueva))
      .toNumber(),
    4
  );
  return { cantidad };
}

