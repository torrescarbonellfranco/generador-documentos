'use client';

import React, { useState, useMemo } from 'react';
import {
  Wand2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Lock,
  Unlock,
  Info,
  Check,
  HelpCircle,
  ShieldAlert,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ItemContrato,
  ItemCalculado,
  ResultadoConvalidacion,
  MesConfig,
  MesEstado,
  ObraGeneral,
} from '@/modules/plan-convalidacion/types/convalidacion';
import {
  formatMonedaArg,
  formatPorcentaje,
  ajustarCantidadesAlTope,
  calcularAvanceProvisorioConAjuste,
  roundTo,
} from '@/modules/plan-convalidacion/lib/convalidacionEngine';
import { MemoriaCalculoDrawer } from './MemoriaCalculoDrawer';
import { ImportarFojasModal } from './ImportarFojasModal';

interface Step2PlanTrabajoProps {
  obra: ObraGeneral;
  resultado: ResultadoConvalidacion;
  mesesConfig: MesConfig[];
  onActualizarItems: (items: ItemContrato[]) => void;
  onActualizarMesesConfig: (configs: MesConfig[]) => void;
  onAutocompletarSaldos: () => void;
  onIrAPaso1: () => void;
  onIrAPaso3: () => void;
}

export const Step2PlanTrabajo: React.FC<Step2PlanTrabajoProps> = ({
  obra,
  resultado,
  mesesConfig,
  onActualizarItems,
  onActualizarMesesConfig,
  onAutocompletarSaldos,
  onIrAPaso1,
  onIrAPaso3,
}) => {
  const { columnas, itemsCalculados, curva, hayAdicionales, tieneAlertasFisicas, itemsConExceso } = resultado;

  // Estado para el modal de importación de Fojas de Medición
  const [modalFojasAbierto, setModalFojasAbierto] = useState(false);

  // Actualizar cantidad ejecutada en una celda
  const handleUpdateAvance = (itemId: string, colId: string, value: number) => {
    const nuevosItems = itemsCalculados.map((ic) => {
      if (ic.item.id === itemId) {
        return {
          ...ic.item,
          avancesPorColumna: {
            ...(ic.item.avancesPorColumna || {}),
            [colId]: value,
          },
        };
      }
      return ic.item;
    });
    onActualizarItems(nuevosItems);
  };

  // Completar saldo de un ítem en un mes provisorio
  const handleCompletarProvisorio = (item: ItemContrato, colMesNumero: number, colId: string, porcRestante: number) => {
    const { cantidad } = calcularAvanceProvisorioConAjuste(item, colMesNumero, porcRestante);
    handleUpdateAvance(item.id, colId, cantidad);
  };

  // Determinar el último mes definitivo correlativo (Principio de correlatividad)
  const corteActual = useMemo(() => {
    let maxDef = 0;
    for (let m = 1; m < obra.mesFinal; m++) {
      const cfg = mesesConfig.find((c) => c.mesNumero === m);
      if (cfg?.estado === 'definitivo') {
        maxDef = m;
      } else {
        break; // Corte estricto en el primer mes provisorio
      }
    }
    return maxDef;
  }, [mesesConfig, obra.mesFinal]);

  // Manejar cambio de corte único de Certificados Definitivos
  const handleCambiarCorteDefinitivo = (k: number) => {
    const maxMeses = obra.mesFinal;
    const nuevasConfig: MesConfig[] = [];
    for (let m = 1; m < maxMeses; m++) {
      const cfgExistente = mesesConfig.find((c) => c.mesNumero === m);
      if (m <= k) {
        nuevasConfig.push({
          mesNumero: m,
          estado: 'definitivo',
          montoCertificadoDefinitivo: cfgExistente?.montoCertificadoDefinitivo,
        });
      } else {
        nuevasConfig.push({
          mesNumero: m,
          estado: 'provisorio',
          montoCertificadoDefinitivo: undefined,
        });
      }
    }
    onActualizarMesesConfig(nuevasConfig);
  };

  const handleUpdateMontoCertificado = (mesNumero: number, monto: number) => {
    const existe = mesesConfig.some((m) => m.mesNumero === mesNumero);
    let nuevasConfig: MesConfig[];
    if (existe) {
      nuevasConfig = mesesConfig.map((m) =>
        m.mesNumero === mesNumero ? { ...m, montoCertificadoDefinitivo: monto } : m
      );
    } else {
      nuevasConfig = [
        ...mesesConfig,
        { mesNumero, estado: 'definitivo', montoCertificadoDefinitivo: monto },
      ];
    }
    onActualizarMesesConfig(nuevasConfig);
  };

  // Ajustar automáticamente al tope físico permitido
  const handleAjustarAlTope = () => {
    const itemsAjustados = ajustarCantidadesAlTope(
      itemsCalculados.map((c) => c.item),
      obra.mesFinal,
      hayAdicionales
    );
    onActualizarItems(itemsAjustados);
  };

  return (
    <div className="space-y-6">
      
      {/* ============================================================== */}
      {/* 1. MEMORIA DE CÁLCULO COLAPSABLE                               */}
      {/* ============================================================== */}
      <MemoriaCalculoDrawer resultado={resultado} obra={obra} />

      {/* ============================================================== */}
      {/* 2. BANNER DE AUDITORÍA FÍSICA Y CONTROL DE TOPES               */}
      {/* ============================================================== */}
      {tieneAlertasFisicas && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-red-900 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide flex items-center text-red-900">
                Alerta de Auditoría Física: {resultado.cantidadItemsConAlerta} ítem(s) superan topes contractuales o tienen ejecución en ítems suprimidos
              </h4>
              <p className="text-[11px] text-red-700 mt-0.5">
                Ítems observados:{' '}
                <strong>
                  {itemsConExceso.map((it) => `Ítem ${it.item.numero}`).join(', ')}
                </strong>
                . Revise las cantidades cargadas para no certificar por encima de las cantidades autorizadas.
              </p>
            </div>
          </div>

          <button
            onClick={handleAjustarAlTope}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors shadow-2xs"
            title="Ajusta automáticamente las cantidades para que no superen los topes contractuales aprobados"
          >
            <Wand2 className="w-3.5 h-3.5 mr-1.5" />
            Ajustar automáticamente al tope
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. BARRA DE CONTROL Y ACCIONES PRINCIPALES                     */}
      {/* ============================================================== */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          {/* Botón para Importar Fojas de Medición */}
          <button
            onClick={() => setModalFojasAbierto(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-xs cursor-pointer"
            title="Importar fojas de medición individuales o múltiples (.xls / .xlsx) para extraer y cargar automáticamente las cantidades actuales"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Importar Fojas de Medición (.xls / .xlsx)
          </button>

          <button
            onClick={onAutocompletarSaldos}
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
            title="Vuelca automáticamente los saldos pendientes en el cierre (Obra Original y Adicionales) para cerrar a cero"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Autocompletar saldos pendientes en el cierre
          </button>

          {/* Semáforo Global de Cierre con Lenguaje Claro */}
          <div className="flex items-center space-x-2 pl-2">
            {tieneAlertasFisicas ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                <AlertTriangle className="w-4 h-4 mr-1.5 text-red-600" />
                Alerta de Exceso Físico ({resultado.cantidadItemsConAlerta} ítems)
              </span>
            ) : resultado.saldosFisicosCerrados ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                Saldos Físicos Completos (Pend. Orig: 0,00 | Pend. Adic: 0,00)
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-600" />
                Saldos pendientes de asignar: Pend. Orig = {resultado.totalPendienteOriginal.toFixed(2)}
                {hayAdicionales && ` | Pend. Adic = ${resultado.totalPendienteAdicional.toFixed(2)}`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onIrAPaso1}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 mr-1 text-slate-500" />
            Paso 1: Cuadro Modificatorio
          </button>
          <button
            onClick={onIrAPaso3}
            className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <span>Ver Cuadro y Curva (Paso 3)</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3.1 CORRELATIVIDAD DE CERTIFICADOS DEFINITIVOS (CORTE ÚNICO)   */}
      {/* ============================================================== */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <label htmlFor="select-corte-def" className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Certificados Definitivos emitidos hasta el Mes:
              </label>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {corteActual === 0 ? 'Todos Provisorios' : `Meses 1 al ${corteActual} Definitivos`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Principio de correlatividad estricta de obra pública: los meses 1 a {corteActual || 'K'} son <strong>Definitivos</strong> (con monto fijo en $); los posteriores son <strong>Provisorios</strong> calculados por cómputo físico.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            id="select-corte-def"
            value={corteActual}
            onChange={(e) => handleCambiarCorteDefinitivo(parseInt(e.target.value, 10))}
            className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value={0}>Ninguno (Todos Provisorios)</option>
            {Array.from({ length: Math.max(0, obra.mesFinal - 1) }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Hasta Mes {m} (Meses 1 a {m} Definitivos)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. GRILLA PRINCIPAL DEL PLAN DE TRABAJO                        */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 sticky top-0 z-20">
              
              {/* Fila 1 de Encabezado: Títulos de columnas y Controles de Meses */}
              <tr className="text-[11px] font-bold">
                {/* Columnas fijas izquierda */}
                <th className="py-2.5 px-3 w-14 text-center sticky left-0 bg-slate-100 z-30 border-r border-slate-300">
                  Nº
                </th>
                <th className="py-2.5 px-3 min-w-[220px] sticky left-14 bg-slate-100 z-30 border-r-2 border-slate-300">
                  Descripción del Ítem
                </th>
                <th className="py-2.5 px-2 w-14 text-center border-r border-slate-200">
                  Unid.
                </th>
                <th className="py-2.5 px-2.5 w-24 text-right border-r border-slate-200">
                  P. Unit. ($)
                </th>
                <th className="py-2.5 px-2.5 w-24 text-right border-r border-slate-200 bg-blue-50/70">
                  Cant. Original
                </th>
                <th className="py-2.5 px-2.5 w-26 text-right border-r-2 border-slate-300 bg-emerald-50/70">
                  Cant. Nueva Autoriz.
                </th>

                {/* Columnas Dinámicas de Meses */}
                {columnas.map((col) => {
                  const cfgMes = mesesConfig.find((m) => m.mesNumero === col.mesNumero);
                  const esDefinitivo = cfgMes?.estado === 'definitivo';

                  return (
                    <th
                      key={col.id}
                      className={`py-2 px-2.5 text-center min-w-[145px] border-r border-slate-300 ${
                        col.esAdicional
                          ? 'bg-emerald-100 text-emerald-950'
                          : col.tipo === 'cierre_original'
                          ? 'bg-blue-100 text-blue-950'
                          : 'bg-slate-50 text-slate-900'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="font-bold text-xs">{col.label}</span>

                        {/* Estado del Período bajo regla de correlatividad */}
                        {col.tipo === 'mes_previo' ? (
                          esDefinitivo ? (
                            <>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                <Lock className="w-2.5 h-2.5 mr-1 text-emerald-700" />
                                Definitivo
                              </span>
                              {/* Input de Monto Certificado Definitivo */}
                              <div className="w-full mt-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={cfgMes?.montoCertificadoDefinitivo ?? ''}
                                  onChange={(e) =>
                                    handleUpdateMontoCertificado(
                                      col.mesNumero,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  placeholder="Monto Cert. ($)"
                                  className="w-full text-right text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-400 bg-white text-emerald-950 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                                  title="Valor Certificado Definitivo ($) exacto"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center mt-0.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                <Unlock className="w-2.5 h-2.5 mr-1 text-slate-400" />
                                Provisorio
                              </span>
                              <span className="text-[9px] text-blue-700 mt-0.5 font-sans font-semibold">
                                (Avance % s/ Orig.)
                              </span>
                            </div>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            Cierre Convalidación
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}

                {/* Columnas fijas derecha: Control Físico con Lenguaje Claro y Tooltips */}
                <th className="py-2.5 px-2.5 min-w-[125px] text-right bg-slate-100 border-l-2 border-slate-300 text-slate-800">
                  <div className="flex items-center justify-end space-x-1">
                    <span>Ejecutado Contrato Orig.</span>
                    <span
                      title="Suma de cantidades ejecutadas imputables al contrato básico hasta el mes final"
                      className="text-slate-400 hover:text-slate-600 cursor-help"
                    >
                      ⓘ
                    </span>
                  </div>
                </th>

                <th className="py-2.5 px-2.5 min-w-[130px] text-center bg-amber-50 text-amber-950 border-r border-slate-300">
                  <div className="flex items-center justify-center space-x-1">
                    <span>Pendiente Contrato Orig.</span>
                    <span
                      title="Cantidad restante por certificar del contrato básico con sus disminuciones aplicadas: mín(Cant. Original, Cant. Nueva) - Ejecutado Orig."
                      className="text-amber-600 hover:text-amber-800 cursor-help"
                    >
                      ⓘ
                    </span>
                  </div>
                </th>

                {hayAdicionales && (
                  <th className="py-2.5 px-2.5 min-w-[125px] text-center bg-emerald-50 text-emerald-950 border-r border-slate-300">
                    <div className="flex items-center justify-center space-x-1">
                      <span>Pendiente Adicionales</span>
                      <span
                        title="Cantidad restante por ejecutar correspondiente a ampliaciones o ítems nuevos: máx(0, Cant. Nueva - Cant. Original) - Ejecutado Adic."
                        className="text-emerald-700 hover:text-emerald-900 cursor-help"
                      >
                        ⓘ
                      </span>
                    </div>
                  </th>
                )}

                <th className="py-2.5 px-2.5 min-w-[110px] text-right bg-blue-50/80 text-blue-950 font-bold border-r border-slate-300">
                  <div className="flex items-center justify-end space-x-1">
                    <span>Total Ejecutado</span>
                    <span
                      title="Total de cantidades ejecutadas físicas acumuladas (Contrato Original + Adicionales)"
                      className="text-blue-500 hover:text-blue-700 cursor-help"
                    >
                      ⓘ
                    </span>
                  </div>
                </th>

                {/* Columna Resumen: % Acumulado s/ Original */}
                <th className="py-2.5 px-2.5 min-w-[125px] text-center bg-indigo-50/80 text-indigo-950 font-bold">
                  <div className="flex items-center justify-center space-x-1">
                    <span>% Acum. s/ Orig.</span>
                    <span
                      title="Porcentaje total acumulado ejecutado respecto de la cantidad original: (Total Ejecutado / Cant. Original) × 100"
                      className="text-indigo-500 hover:text-indigo-700 cursor-help"
                    >
                      ⓘ
                    </span>
                  </div>
                </th>
              </tr>
            </thead>

            {/* Cuerpo de la Tabla */}
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {itemsCalculados.map((calc) => {
                const it = calc.item;
                const isTitle = calc.esTitulo;

                // Estilo por alerta física
                const tieneError = calc.tieneErrorFisico;
                let filaBg = 'hover:bg-slate-50/80';
                if (isTitle) {
                  filaBg = 'bg-slate-100 font-bold font-sans text-slate-900';
                } else if (calc.ejecucionEnItemSuprimido) {
                  filaBg = 'bg-red-50/70 border-l-4 border-l-red-500';
                } else if (calc.excedeTopeTotal) {
                  filaBg = 'bg-red-50/40 border-l-4 border-l-red-400';
                } else if (calc.excedeTopeOriginal) {
                  filaBg = 'bg-amber-50/50 border-l-4 border-l-amber-400';
                }

                // Base de referencia para porcentaje del ítem: Cantidad Original (o Nueva si es ítem nuevo)
                const baseRef = (it.cantidadOriginal || 0) > 0 ? it.cantidadOriginal : (it.cantidadNueva || 0);

                return (
                  <tr key={it.id} className={filaBg}>
                    {/* Nº Sticky */}
                    <td className="py-1.5 px-2 text-center sticky left-0 bg-white z-10 border-r border-slate-300 font-bold">
                      {it.numero}
                    </td>

                    {/* Descripción Sticky con Alerta Visual */}
                    <td className="py-1.5 px-3 sticky left-14 bg-white z-10 border-r-2 border-slate-300 font-sans max-w-[260px]">
                      <div className="truncate font-medium text-slate-900" title={it.descripcion}>
                        {it.descripcion}
                      </div>
                      {/* Badge de error físico no bloqueante */}
                      {tieneError && calc.mensajeAlertaFisica && (
                        <div className="text-[10px] text-red-600 font-sans font-bold flex items-center mt-0.5 line-clamp-1" title={calc.mensajeAlertaFisica}>
                          <AlertTriangle className="w-3 h-3 mr-1 flex-shrink-0 text-red-500" />
                          <span>{calc.mensajeAlertaFisica}</span>
                        </div>
                      )}
                    </td>

                    {/* Unidad */}
                    <td className="py-1.5 px-2 text-center border-r border-slate-200 text-slate-500">
                      {!isTitle ? it.unidad || 'GL' : ''}
                    </td>

                    {/* Precio Unitario */}
                    <td className="py-1.5 px-2.5 text-right border-r border-slate-200 text-slate-700">
                      {!isTitle ? formatMonedaArg(it.precioUnitario) : '-'}
                    </td>

                    {/* Cantidad Original */}
                    <td className="py-1.5 px-2.5 text-right border-r border-slate-200 bg-blue-50/20 text-blue-950 font-semibold">
                      {!isTitle ? it.cantidadOriginal.toFixed(2) : '-'}
                    </td>

                    {/* Cantidad Nueva Autorizada */}
                    <td className="py-1.5 px-2.5 text-right border-r-2 border-slate-300 bg-emerald-50/20 text-emerald-950 font-semibold">
                      {!isTitle ? it.cantidadNueva.toFixed(2) : '-'}
                    </td>

                    {/* Columnas Mensuales */}
                    {columnas.map((col) => {
                      const val = it.avancesPorColumna?.[col.id] || 0;
                      const celdaInvalida = calc.ejecucionEnItemSuprimido && val > 0;

                      const cfgMes = mesesConfig.find((m) => m.mesNumero === col.mesNumero);
                      const esDefinitivo = cfgMes?.estado === 'definitivo';
                      const esProvisorio = col.tipo === 'mes_previo' && !esDefinitivo;

                      if (isTitle) {
                        return (
                          <td key={col.id} className="py-1 px-1.5 border-r border-slate-200 text-center text-slate-300">
                            -
                          </td>
                        );
                      }

                      // CASO 1: Mes Provisorio (Input: % de avance del ítem arriba, Cantidad equivalente abajo)
                      if (esProvisorio) {
                        const h = it.cantidadOriginal || 0;
                        const cv = it.cantidadNueva || 0;

                        // Ítems nuevos (Cant. Original = 0): deshabilitados en provisorios
                        if (h <= 0) {
                          return (
                            <td
                              key={col.id}
                              className="py-1 px-1.5 border-r border-slate-200 text-center bg-slate-50/50"
                              title="Ítem nuevo: se imputa íntegramente en la columna de Adicionales"
                            >
                              <span className="text-slate-400 font-bold font-sans">-</span>
                            </td>
                          );
                        }

                        const tope = Math.min(h, cv);
                        const porcObjetivo = (tope / h) * 100;

                        // Cantidades previas acumuladas antes de este mes
                        let sumPrevQ = 0;
                        for (let m = 1; m < col.mesNumero; m++) {
                          sumPrevQ += it.avancesPorColumna?.[`mes_${m}`] || 0;
                        }
                        const sumPrevPct = (sumPrevQ / h) * 100;
                        const saldoRestanteQ = Math.max(0, tope - sumPrevQ);
                        const porcRestante = Math.max(0, porcObjetivo - sumPrevPct);

                        // Si el ítem ya alcanzó el tope en este mes, mostrar el porcentaje exacto complementario (ej: 33.34%)
                        let displayPct = 0;
                        if (val > 0) {
                          if (Math.abs((sumPrevQ + val) - tope) <= 0.001) {
                            displayPct = roundTo(porcObjetivo - sumPrevPct, 2);
                          } else {
                            displayPct = roundTo((val / h) * 100, 2);
                          }
                        }

                        return (
                          <td
                            key={col.id}
                            className={`py-1 px-1.5 border-r border-slate-200 text-right ${
                              col.esAdicional ? 'bg-emerald-50/10' : ''
                            }`}
                          >
                            <div className="flex flex-col items-end">
                              <div className="relative w-full">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={val === 0 ? '' : displayPct}
                                  onChange={(e) => {
                                    const p = parseFloat(e.target.value) || 0;
                                    if (p === 0) {
                                      handleUpdateAvance(it.id, col.id, 0);
                                    } else {
                                      const { cantidad } = calcularAvanceProvisorioConAjuste(it, col.mesNumero, p);
                                      handleUpdateAvance(it.id, col.id, cantidad);
                                    }
                                  }}
                                  placeholder="0"
                                  className={`w-full text-right px-1.5 py-0.5 rounded border text-xs font-mono focus:outline-none focus:ring-1 pr-4 ${
                                    celdaInvalida
                                      ? 'border-red-500 bg-red-100 text-red-900 font-bold focus:ring-red-500'
                                      : val > 0
                                      ? 'border-blue-400 bg-white font-bold text-slate-900'
                                      : 'border-slate-200 bg-transparent text-slate-400'
                                  }`}
                                  title={`Porcentaje de avance sobre cantidad original (${it.cantidadOriginal} ${it.unidad || 'u.'})`}
                                />
                                <span className="absolute right-1 top-0.5 text-[9px] text-slate-400 pointer-events-none font-bold">
                                  %
                                </span>
                              </div>

                              <div className="flex items-center justify-between w-full mt-0.5 px-0.5 text-[9px] font-mono">
                                {val === 0 && saldoRestanteQ > 0.001 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleCompletarProvisorio(it, col.mesNumero, col.id, porcRestante)}
                                    className="text-[9px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                                    title={`Completar restante exacto (${porcRestante.toFixed(2)}% = ${saldoRestanteQ.toFixed(2)} ${it.unidad || 'u.'})`}
                                  >
                                    Completar {porcRestante.toFixed(2)}%
                                  </button>
                                ) : (
                                  <span className="text-slate-400">
                                    {val > 0 ? `${val.toFixed(2)} ${it.unidad || 'u.'}` : '0.00 u.'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // CASO 2: Mes Definitivo o Cierre (Input: Cantidad física arriba, % abajo)
                      const baseRef = (it.cantidadOriginal || 0) > 0 ? it.cantidadOriginal : (it.cantidadNueva || 0);
                      const porcEquiv = baseRef > 0 ? (val / baseRef) * 100 : 0;

                      return (
                        <td
                          key={col.id}
                          className={`py-1 px-1.5 border-r border-slate-200 text-right ${
                            col.esAdicional ? 'bg-emerald-50/10' : ''
                          }`}
                        >
                          <div className="flex flex-col items-end">
                            <input
                              type="number"
                              step="0.0001"
                              value={val === 0 ? '' : val}
                              onChange={(e) =>
                                handleUpdateAvance(
                                  it.id,
                                  col.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className={`w-full text-right px-1.5 py-0.5 rounded border text-xs font-mono focus:outline-none focus:ring-1 ${
                                celdaInvalida
                                  ? 'border-red-500 bg-red-100 text-red-900 font-bold focus:ring-red-500'
                                  : val > 0
                                  ? 'border-blue-400 bg-white font-bold text-slate-900'
                                  : 'border-slate-200 bg-transparent text-slate-400'
                              }`}
                              title={
                                celdaInvalida
                                  ? 'Error: Este ítem está suprimido (Cant. Nueva = 0) y no admite ejecución.'
                                  : `Cantidad física en ${it.unidad || 'unidades'}`
                              }
                            />
                            <span
                              className="text-[9px] font-mono text-slate-400 tracking-tight mt-0.5 pr-0.5"
                              title="Porcentaje equivalente sobre cantidad base"
                            >
                              {porcEquiv.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    {/* Ejecutado Contrato Orig. */}
                    <td className="py-1.5 px-2.5 text-right border-l-2 border-slate-300 text-slate-800 font-semibold">
                      {!isTitle ? calc.cantidadEjecutadaOriginal.toFixed(2) : '-'}
                    </td>

                    {/* Pendiente Contrato Orig. */}
                    <td className="py-1.5 px-2.5 text-right border-r border-slate-300">
                      {!isTitle ? (
                        calc.cantidadPendienteOriginal < -0.001 ? (
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300"
                            title={`Excede tope de Obra Original en +${calc.excesoOriginalMonto} unidades`}
                          >
                            {calc.cantidadPendienteOriginal.toFixed(2)} ⚠
                          </span>
                        ) : Math.abs(calc.cantidadPendienteOriginal) <= 0.001 ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            0,00
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                            {calc.cantidadPendienteOriginal.toFixed(2)}
                          </span>
                        )
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Pendiente Adicionales */}
                    {hayAdicionales && (
                      <td className="py-1.5 px-2.5 text-right border-r border-slate-300">
                        {!isTitle ? (
                          calc.cantidadPendienteAdicional < -0.001 ? (
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300"
                              title="Excede cantidad de adicionales autorizada"
                            >
                              {calc.cantidadPendienteAdicional.toFixed(2)} ⚠
                            </span>
                          ) : Math.abs(calc.cantidadPendienteAdicional) <= 0.001 ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              0,00
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                              {calc.cantidadPendienteAdicional.toFixed(2)}
                            </span>
                          )
                        ) : (
                          '-'
                        )}
                      </td>
                    )}

                    {/* Total Ejecutado */}
                    <td className="py-1.5 px-2.5 text-right bg-blue-50/20 border-r border-slate-300">
                      {!isTitle ? (
                        calc.excedeTopeTotal ? (
                          <span
                            className="font-bold text-red-700 bg-red-100 px-1 py-0.5 rounded border border-red-300"
                            title={`Supera Cant. Nueva (${it.cantidadNueva}) en +${calc.excesoTotalMonto}`}
                          >
                            {calc.cantidadEjecutadaTotal.toFixed(2)} ⚠
                          </span>
                        ) : (
                          <span className="font-bold text-slate-900">
                            {calc.cantidadEjecutadaTotal.toFixed(2)}
                          </span>
                        )
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* % Acumulado s/ Original */}
                    <td className="py-1.5 px-2 text-center bg-indigo-50/20">
                      {!isTitle ? (
                        it.cantidadOriginal > 0 ? (
                          calc.porcentajeAcumuladoOriginal > 100.0001 ? (
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300"
                              title={`Ampliación de obra: supera el 100% de la cantidad original (${calc.porcentajeAcumuladoOriginal.toFixed(2)}%)`}
                            >
                              {calc.porcentajeAcumuladoOriginal.toFixed(2)}% ↑
                            </span>
                          ) : calc.porcentajeAcumuladoOriginal < 99.9999 ? (
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                              title={`Pendiente / Disminución: inferior al 100% original (${calc.porcentajeAcumuladoOriginal.toFixed(2)}%)`}
                            >
                              {calc.porcentajeAcumuladoOriginal.toFixed(2)}% ↓
                            </span>
                          ) : (
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300"
                              title="Completo: 100,00% de la cantidad básica ejecutada"
                            >
                              100,00% ✓
                            </span>
                          )
                        ) : (
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                            title={`Ítem nuevo (${calc.porcentajeAcumuladoOriginal.toFixed(2)}% s/ Cant. Nueva)`}
                          >
                            {calc.porcentajeAcumuladoOriginal.toFixed(2)}% (Nuevo)
                          </span>
                        )
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Pie de Tabla con Resúmenes de la Curva */}
            <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold text-[11px] sticky bottom-0 z-20">
              {/* Fila 1: Monto Mensual ($) */}
              <tr>
                <td
                  colSpan={6}
                  className="py-2 px-3 text-right sticky left-0 bg-slate-100 z-30 border-r-2 border-slate-300 uppercase tracking-wide text-slate-700"
                >
                  Inversión Mensual ($):
                </td>
                {curva.map((fc) => (
                  <td
                    key={fc.columnaId}
                    className="py-2 px-2 text-right border-r border-slate-300 font-mono text-slate-900"
                  >
                    {formatMonedaArg(fc.montoMensual)}
                  </td>
                ))}
                <td colSpan={hayAdicionales ? 5 : 4} className="bg-slate-200"></td>
              </tr>

              {/* Fila 2: Porcentaje Mensual (%) */}
              <tr>
                <td
                  colSpan={6}
                  className="py-1.5 px-3 text-right sticky left-0 bg-slate-100 z-30 border-r-2 border-slate-300 uppercase tracking-wide text-slate-700"
                >
                  Avance Mensual (%):
                </td>
                {curva.map((fc) => (
                  <td
                    key={fc.columnaId}
                    className="py-1.5 px-2 text-right border-r border-slate-300 font-mono text-blue-900"
                  >
                    {formatPorcentaje(fc.porcentajeMensual, 4)}
                  </td>
                ))}
                <td colSpan={hayAdicionales ? 5 : 4} className="bg-slate-200"></td>
              </tr>

              {/* Fila 3: Porcentaje Acumulado (%) */}
              <tr className="bg-slate-200">
                <td
                  colSpan={6}
                  className="py-2 px-3 text-right sticky left-0 bg-slate-200 z-30 border-r-2 border-slate-300 uppercase tracking-wide text-slate-900"
                >
                  Avance Acumulado (%):
                </td>
                {curva.map((fc) => (
                  <td
                    key={fc.columnaId}
                    className="py-2 px-2 text-right border-r border-slate-400 font-mono text-xs text-slate-950 font-bold"
                  >
                    {formatPorcentaje(fc.porcentajeAcumulado, 4)}
                  </td>
                ))}
                <td colSpan={hayAdicionales ? 5 : 4} className="bg-slate-300"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal de Importación de Fojas de Medición (.xls / .xlsx) */}
      <ImportarFojasModal
        isOpen={modalFojasAbierto}
        onClose={() => setModalFojasAbierto(false)}
        itemsActuales={itemsCalculados.map((ic) => ic.item)}
        mesesConfig={mesesConfig}
        obra={obra}
        onAplicarFojas={(nuevosItems, nuevasConfig) => {
          onActualizarItems(nuevosItems);
          onActualizarMesesConfig(nuevasConfig);
        }}
      />
    </div>
  );
};
