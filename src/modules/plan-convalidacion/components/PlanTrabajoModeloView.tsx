'use client';

import React from 'react';
import {
  Printer,
  FileSpreadsheet,
  Building2,
  Calendar,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';
import {
  ResultadoConvalidacion,
  ObraGeneral,
  ItemCalculado,
  ColumnaCierreInfo,
} from '@/modules/plan-convalidacion/types/convalidacion';
import { formatMonedaArg, formatPorcentaje } from '@/modules/plan-convalidacion/lib/convalidacionEngine';

interface PlanTrabajoModeloViewProps {
  obra: ObraGeneral;
  resultado: ResultadoConvalidacion;
}

export const PlanTrabajoModeloView: React.FC<PlanTrabajoModeloViewProps> = ({
  obra,
  resultado,
}) => {
  const { itemsCalculados, columnas, curva, montoObraOriginal, montoObraNuevo } = resultado;

  const handleImprimir = () => {
    window.print();
  };

  /**
   * Calcula el porcentaje de avance físico de un ítem en una columna específica:
   * - Ítems básicos: Cantidad / CantidadOriginal (sobre el costo básico)
   * - Ítems nuevos (Cant. Orig = 0):
   *   - En columnas previas: '-'
   *   - En columna de adicionales: Cantidad / CantidadNueva (100% si se ejecuta completa)
   */
  const calcularPorcentajeItem = (calc: ItemCalculado, col: ColumnaCierreInfo): string => {
    if (calc.esTitulo) return '';

    const cantMes = calc.item.avancesPorColumna?.[col.id] || 0;
    if (cantMes === 0) return '-';

    const cantOrig = calc.item.cantidadOriginal || 0;
    const cantNueva = calc.item.cantidadNueva || 0;

    // Ítem nuevo (H_i === 0)
    if (cantOrig === 0) {
      if (col.esAdicional && cantNueva > 0) {
        const porcNuevo = (cantMes / cantNueva) * 100;
        return `${porcNuevo.toFixed(2)}%`;
      }
      return '-';
    }

    // Ítem básico (H_i > 0): Siempre sobre cantidad / costo básico original
    const porc = (cantMes / cantOrig) * 100;
    return `${porc.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Barra de Acciones de Vista Modelo */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Plan de Trabajo Modelo — Formato Oficial (Folio 15 y 16)
            </h3>
            <p className="text-[11px] text-slate-500">
              Avance porcentual por ítem con desdoble de convalidación, carátula oficial y bloque de firmas institucionales.
            </p>
          </div>
        </div>

        <button
          onClick={handleImprimir}
          className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-xs cursor-pointer"
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir / Guardar en PDF
        </button>
      </div>

      {/* DOCUMENTO OFICIAL PARA IMPRESIÓN (APAIZADO / FOLIO OFICIAL) */}
      <div className="print-container bg-white rounded-xl border border-slate-300 p-6 md:p-8 shadow-sm text-slate-900 font-sans print:border-none print:shadow-none print:p-0">
        
        {/* 1. MEMBRETE OFICIAL Y CARÁTULA INSTITUCIONAL */}
        <div className="border-b-2 border-slate-900 pb-4 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-900 text-white rounded flex items-center justify-center font-bold text-xl shadow-xs">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold uppercase tracking-tight text-slate-950">
                  MUNICIPALIDAD DE NEUQUÉN — ÁREA DE ALTERACIONES CONTRACTUALES
                </h1>
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 mt-0.5">
                  Plan de Trabajo Modelo por Convalidación Contractual
                </h2>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-mono font-bold uppercase">
                Régimen: Convalidación ({resultado.escenario === 'C_MIXTO' ? 'Escenario C - Mixto' : resultado.escenario === 'B_SOLO_ADICIONALES' ? 'Escenario B - Adicionales' : 'Escenario A - Disminución'})
              </span>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                Base Denominador: <strong className="text-slate-800">Monto Contrato Original</strong>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center border-t border-slate-200 pt-3">
            <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-900">
              Plan de Trabajo y Curva de Inversión por Convalidación
            </h2>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
              Modelo Oficial de Presentación — Avances Físicos Porcentuales
            </p>
          </div>
        </div>

        {/* 2. CUADRO DE DATOS GENERALES DE LA OBRA (CARÁTULA FOLIO 15) */}
        <div className="border border-slate-300 rounded-lg overflow-hidden mb-6 text-xs bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            {/* Columna Izquierda */}
            <div className="divide-y divide-slate-200">
              <div className="p-2.5 flex">
                <span className="w-40 font-bold uppercase text-slate-700">Obra:</span>
                <span className="font-semibold text-slate-950 flex-1">{obra.nombre}</span>
              </div>
              <div className="p-2.5 flex">
                <span className="w-40 font-bold uppercase text-slate-700">Expediente Original:</span>
                <span className="font-mono font-bold text-slate-900 flex-1">{obra.expedienteOriginal || obra.expediente}</span>
              </div>
              <div className="p-2.5 flex">
                <span className="w-40 font-bold uppercase text-slate-700">Expediente Ampliación:</span>
                <span className="font-mono font-semibold text-slate-900 flex-1">{obra.expedienteAmpliacion || 'S/D (Convalidación Directa)'}</span>
              </div>
              <div className="p-2.5 flex">
                <span className="w-40 font-bold uppercase text-slate-700">Empresa Contratista:</span>
                <span className="font-semibold text-slate-950 flex-1">{obra.contratista}</span>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="divide-y divide-slate-200">
              <div className="p-2.5 flex">
                <span className="w-44 font-bold uppercase text-slate-700">Fecha de Inicio:</span>
                <span className="font-medium text-slate-900 flex-1">{obra.fechaInicio || 'Según Acta de Inicio'}</span>
              </div>
              <div className="p-2.5 flex">
                <span className="w-44 font-bold uppercase text-slate-700">Plazo de Obra:</span>
                <span className="font-medium text-slate-900 flex-1">{obra.plazoObra || `${obra.plazoOriginalMeses} Meses`}</span>
              </div>
              <div className="p-2.5 flex">
                <span className="w-44 font-bold uppercase text-slate-700">Terminación s/Contrato:</span>
                <span className="font-medium text-slate-900 flex-1">{obra.fechaTerminacionContrato || '-'}</span>
              </div>
              <div className="p-2.5 flex">
                <span className="w-44 font-bold uppercase text-slate-700">Terminación c/Ampliación:</span>
                <span className="font-bold text-slate-950 flex-1">{obra.fechaTerminacionAmpliacion || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. TABLA MODELO: AVANCE PORCENTUAL POR ÍTEM */}
        <div className="overflow-x-auto border border-slate-300 rounded-lg">
          <table className="w-full text-left border-collapse text-[11px] print:text-[9.5px]">
            {/* Encabezado */}
            <thead className="bg-slate-100 text-slate-800 font-bold border-b-2 border-slate-400">
              <tr>
                <th className="py-2 px-2 w-10 text-center border-r border-slate-300">Nº</th>
                <th className="py-2 px-3 min-w-[200px] border-r border-slate-300">Descripción del Ítem</th>
                <th className="py-2 px-2.5 text-right w-24 border-r border-slate-300">Costo Básico ($)</th>
                <th className="py-2 px-1.5 text-right w-16 border-r border-slate-300">Inc. (%)</th>
                <th className="py-2 px-2.5 text-right w-24 border-r border-slate-300">Costo Modif. ($)</th>
                <th className="py-2 px-1.5 text-right w-16 border-r-2 border-slate-400">Inc. (%)</th>

                {/* Columnas de períodos */}
                {columnas.map((col) => (
                  <th
                    key={col.id}
                    className={`py-2 px-2 text-center min-w-[70px] border-r border-slate-300 ${
                      col.esAdicional ? 'bg-emerald-50 text-emerald-950 font-extrabold' : 'bg-slate-50'
                    }`}
                  >
                    <span>{col.label}</span>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Cuerpo de Ítems */}
            <tbody className="divide-y divide-slate-200">
              {itemsCalculados.map((calc) => {
                const isTitle = calc.esTitulo;

                return (
                  <tr
                    key={calc.item.id}
                    className={`${
                      isTitle
                        ? 'bg-slate-100 font-bold text-slate-950'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Nº */}
                    <td className="py-1 px-2 text-center border-r border-slate-200 font-mono font-semibold">
                      {calc.item.numero}
                    </td>

                    {/* Descripción */}
                    <td className="py-1 px-3 border-r border-slate-200">
                      <span className={isTitle ? 'font-bold uppercase tracking-wide' : 'font-medium'}>
                        {calc.item.descripcion}
                      </span>
                    </td>

                    {/* Costo Básico */}
                    <td className="py-1 px-2.5 text-right border-r border-slate-200 font-mono">
                      {!isTitle ? formatMonedaArg(calc.costoItemBasico) : '-'}
                    </td>

                    {/* Incidencia Original */}
                    <td className="py-1 px-1.5 text-right border-r border-slate-200 font-mono text-slate-600">
                      {!isTitle ? formatPorcentaje(calc.incidenciaOriginal, 2) : '-'}
                    </td>

                    {/* Costo Modificado */}
                    <td className="py-1 px-2.5 text-right border-r border-slate-200 font-mono font-semibold">
                      {!isTitle ? formatMonedaArg(calc.costoItemModificado) : '-'}
                    </td>

                    {/* Incidencia Modificada */}
                    <td className="py-1 px-1.5 text-right border-r-2 border-slate-400 font-mono font-semibold text-slate-800">
                      {!isTitle ? formatPorcentaje(calc.incidenciaNueva, 2) : '-'}
                    </td>

                    {/* Columnas mensuales con Porcentaje Físico */}
                    {columnas.map((col) => {
                      const porcStr = calcularPorcentajeItem(calc, col);

                      return (
                        <td
                          key={col.id}
                          className={`py-1 px-2 text-center border-r border-slate-200 font-mono ${
                            col.esAdicional ? 'bg-emerald-50/30' : ''
                          }`}
                        >
                          {porcStr !== '-' ? (
                            <span className="font-semibold text-slate-900">{porcStr}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>

            {/* Totales y Filas de Curva de Inversión al pie */}
            <tfoot className="border-t-2 border-slate-900 font-mono">
              {/* Fila 1: Totales de Costo e Incidencia */}
              <tr className="bg-slate-100 font-bold text-slate-900">
                <td colSpan={2} className="py-2 px-3 text-right uppercase font-sans tracking-wide text-xs">
                  Totales de Obra:
                </td>
                <td className="py-2 px-2.5 text-right border-r border-slate-300 text-blue-900">
                  {formatMonedaArg(montoObraOriginal)}
                </td>
                <td className="py-2 px-1.5 text-right border-r border-slate-300 text-blue-900">
                  100,00%
                </td>
                <td className="py-2 px-2.5 text-right border-r border-slate-300 text-emerald-950">
                  {formatMonedaArg(montoObraNuevo)}
                </td>
                <td className="py-2 px-1.5 text-right border-r-2 border-slate-400 text-emerald-950">
                  {formatPorcentaje(montoObraOriginal > 0 ? montoObraNuevo / montoObraOriginal : 0, 2)}
                </td>
                {columnas.map((col) => (
                  <td key={col.id} className="py-2 px-2 text-center border-r border-slate-200 text-slate-400">
                    -
                  </td>
                ))}
              </tr>

              {/* Fila 2: Avance Físico Mensual (%) */}
              <tr className="bg-blue-50/60 font-bold text-blue-950 border-t border-slate-300">
                <td colSpan={6} className="py-1.5 px-3 text-right uppercase font-sans tracking-wider text-[11px] border-r-2 border-slate-400">
                  % Avance Físico Mensual:
                </td>
                {columnas.map((col) => {
                  const fc = curva.find((c) => c.columnaId === col.id);
                  return (
                    <td key={col.id} className="py-1.5 px-2 text-center border-r border-slate-300 text-blue-900">
                      {fc ? `${(fc.porcentajeMensual * 100).toFixed(2)}%` : '0,00%'}
                    </td>
                  );
                })}
              </tr>

              {/* Fila 3: Avance Físico Acumulado (%) */}
              <tr className="bg-blue-100 font-extrabold text-blue-950 border-t border-slate-300">
                <td colSpan={6} className="py-1.5 px-3 text-right uppercase font-sans tracking-wider text-[11px] border-r-2 border-slate-400">
                  % Avance Físico Acumulado:
                </td>
                {columnas.map((col) => {
                  const fc = curva.find((c) => c.columnaId === col.id);
                  return (
                    <td key={col.id} className="py-1.5 px-2 text-center border-r border-slate-300 text-blue-950">
                      {fc ? `${(fc.porcentajeAcumulado * 100).toFixed(2)}%` : '0,00%'}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

      {/* ESTILOS DE IMPRESIÓN OFICIAL CSS */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            font-size: 9pt !important;
          }
          header, nav, .no-print {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          @page {
            size: landscape;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
};

