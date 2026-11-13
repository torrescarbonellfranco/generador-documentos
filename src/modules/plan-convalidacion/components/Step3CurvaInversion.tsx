'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  ArrowLeft,
  FileCheck,
  TrendingUp,
  Building2,
  Info,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  FileCheck2,
} from 'lucide-react';
import { ResultadoConvalidacion, ObraGeneral } from '@/modules/plan-convalidacion/types/convalidacion';
import { formatMonedaArg, formatPorcentaje } from '@/modules/plan-convalidacion/lib/convalidacionEngine';
import { MemoriaCalculoDrawer } from './MemoriaCalculoDrawer';
import { PlanTrabajoModeloView } from './PlanTrabajoModeloView';

interface Step3CurvaInversionProps {
  obra: ObraGeneral;
  resultado: ResultadoConvalidacion;
  onIrAPaso2: () => void;
}

export const Step3CurvaInversion: React.FC<Step3CurvaInversionProps> = ({
  obra,
  resultado,
  onIrAPaso2,
}) => {
  const [vistaActiva, setVistaActiva] = useState<'modelo' | 'curva'>('modelo');
  const { curva, escenario, hayAdicionales, montoObraOriginal, montoObraNuevo } = resultado;

  // Consolidación temporal del Gráfico: un único período temporal por mes (Mes 1 a Mes {mesFinal})
  // El último mes unifica Obra Original + Adicionales en el Porcentaje Acumulado Final
  const chartDataConsolidado = useMemo(() => {
    const data = [];
    for (let m = 1; m < obra.mesFinal; m++) {
      const fc = curva.find((c) => c.mesNumero === m);
      if (fc) {
        data.push({
          name: `Mes ${m}`,
          mesNumero: m,
          porcentajeAcumulado: +(fc.porcentajeAcumulado * 100),
          montoAcumulado: fc.montoAcumulado,
          montoMensual: fc.montoMensual,
          desglose: null,
        });
      }
    }

    // Mes Final consolidado en un único período temporal
    const fcOrig = curva.find((c) => c.tipo === 'cierre_original');
    const fcAdic = curva.find((c) => c.tipo === 'cierre_adicional');
    const fcFinal = fcAdic || fcOrig;

    if (fcFinal) {
      const porcFinal = +(fcFinal.porcentajeAcumulado * 100);
      const porcOrig = fcOrig ? +(fcOrig.porcentajeAcumulado * 100) : porcFinal;
      const porcAdic = fcAdic ? +(porcFinal - porcOrig) : 0;

      data.push({
        name: `Mes ${obra.mesFinal}`,
        mesNumero: obra.mesFinal,
        porcentajeAcumulado: porcFinal,
        montoAcumulado: fcFinal.montoAcumulado,
        montoMensual: (fcOrig?.montoMensual || 0) + (fcAdic?.montoMensual || 0),
        desglose: fcAdic
          ? {
              total: porcFinal,
              obraOrig: porcOrig,
              adicionales: porcAdic,
              montoTotal: fcFinal.montoAcumulado,
            }
          : null,
      });
    }

    return data;
  }, [curva, obra.mesFinal]);

  // Eje Y dinámico: ajusta automáticamente el máximo cuando supera el 100%
  const yDomainMax = useMemo(() => {
    const vals = chartDataConsolidado.map((d) => d.porcentajeAcumulado);
    const max = Math.max(100, ...vals);
    return Math.ceil((max + 10) / 10) * 10;
  }, [chartDataConsolidado]);

  // Etiqueta personalizada visible sobre cada nodo con formato 0,00%
  const renderCustomizedLabel = (props: any) => {
    const { x, y, value } = props;
    if (value === undefined || value === null) return null;
    const texto = `${Number(value).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;

    return (
      <g>
        <rect
          x={x - 27}
          y={y - 28}
          width={54}
          height={20}
          rx={4}
          fill="#ffffff"
          stroke="#94a3b8"
          strokeWidth={1}
          filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.08))"
        />
        <text
          x={x}
          y={y - 15}
          fill="#1e3a8a"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fontFamily="monospace"
          fontWeight="bold"
        >
          {texto}
        </text>
      </g>
    );
  };

  // Tooltip personalizado con desglose en el último mes
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-md text-xs space-y-1.5">
          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between gap-4">
            <span className="uppercase tracking-wider">{label}</span>
            <span className="font-mono text-blue-700 font-extrabold text-sm">
              {data.porcentajeAcumulado.toLocaleString('es-AR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}%
            </span>
          </div>
          <div className="text-slate-600 font-mono text-[11px]">
            Inversión Acumulada: <strong className="text-slate-900">{formatMonedaArg(data.montoAcumulado)}</strong>
          </div>
          {data.desglose && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-[11px] bg-blue-50/60 p-2 rounded">
              <span className="font-bold text-blue-950 block mb-1">
                Desglose Convalidación (Mes {obra.mesFinal}):
              </span>
              <div className="text-slate-700 flex justify-between">
                <span>• Obra Original:</span>
                <strong className="font-mono">
                  {data.desglose.obraOrig.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}%
                </strong>
              </div>
              <div className="text-emerald-800 flex justify-between">
                <span>• Adicionales:</span>
                <strong className="font-mono">
                  +{data.desglose.adicionales.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}%
                </strong>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Botón Volver y Selector de Sub-Vistas */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          onClick={onIrAPaso2}
          className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1 text-slate-500" />
          Volver al Plan de Trabajo (Paso 2)
        </button>

        {/* Selector de Pestañas: Modelo Folio 15/16 vs. Curva S */}
        <div className="bg-slate-200/80 p-1 rounded-xl flex items-center space-x-1 border border-slate-300">
          <button
            onClick={() => setVistaActiva('modelo')}
            className={`inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              vistaActiva === 'modelo'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-4 h-4 mr-1.5 text-blue-600" />
            Plan de Trabajo Modelo (Folio 15/16)
          </button>
          <button
            onClick={() => setVistaActiva('curva')}
            className={`inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              vistaActiva === 'curva'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-1.5 text-emerald-600" />
            Cuadro de Curva & Gráfico S
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">Régimen:</span>
          <span>Convalidación (Denominador: {formatMonedaArg(montoObraOriginal)})</span>
        </div>
      </div>

      {/* VISTA 1: PLAN DE TRABAJO MODELO OFICIAL (FOLIO 15 Y 16) */}
      {vistaActiva === 'modelo' ? (
        <PlanTrabajoModeloView obra={obra} resultado={resultado} />
      ) : (
        /* VISTA 2: CUADRO DE CURVA Y GRÁFICO S */
        <>
          {/* Memoria de Cálculo Colapsable */}
          <MemoriaCalculoDrawer resultado={resultado} obra={obra} />

          {/* Cuadro Oficial Municipal de 4 Filas */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  MUNICIPALIDAD DE NEUQUÉN — ÁREA DE ALTERACIONES CONTRACTUALES
                </h3>
              </div>
              <span className="text-[11px] text-slate-300 font-mono">
                Expte: {obra.expediente || 'S/N'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-60 sticky left-0 bg-slate-100 z-10 border-r border-slate-300">
                      Concepto / Período
                    </th>
                    {curva.map((fc) => (
                      <th
                    key={fc.columnaId}
                    className={`py-3 px-3 text-center min-w-[140px] border-r border-slate-300 ${
                      fc.tipo === 'cierre_adicional'
                        ? 'bg-emerald-100 text-emerald-950 font-bold'
                        : fc.tipo === 'cierre_original'
                        ? 'bg-blue-100 text-blue-950 font-bold'
                        : 'text-slate-800'
                    }`}
                  >
                    <div>{fc.label}</div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                      {fc.tipo === 'cierre_adicional'
                        ? 'Saldo Adicional'
                        : fc.tipo === 'cierre_original'
                        ? 'Cierre Obra Orig.'
                        : `Mes ${fc.mesNumero}`}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-xs">
              
              {/* Fila 1: Avance Físico Mensual (%) */}
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-sans font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-300">
                  Avance Físico Mensual (%)
                </td>
                {curva.map((fc) => (
                  <td
                    key={fc.columnaId}
                    className="py-2.5 px-3 text-right border-r border-slate-200 text-slate-700"
                  >
                    {formatPorcentaje(fc.porcentajeMensual, 4)}
                  </td>
                ))}
              </tr>

              {/* Fila 2: Avance Físico Acumulado (%) */}
              <tr className="bg-blue-50/30 hover:bg-blue-50/50 font-bold">
                <td className="py-2.5 px-4 font-sans font-bold text-blue-950 sticky left-0 bg-blue-50/90 z-10 border-r border-slate-300">
                  Avance Físico Acumulado (%)
                </td>
                {curva.map((fc) => (
                  <td
                    key={fc.columnaId}
                    className="py-2.5 px-3 text-right border-r border-slate-200 text-blue-900"
                  >
                    {formatPorcentaje(fc.porcentajeAcumulado, 4)}
                  </td>
                ))}
              </tr>

              {/* Fila 3: Inversión Mensual ($) */}
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-sans font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-300">
                  Inversión Mensual ($)
                </td>
                {curva.map((fc) => (
                  <td
                    key={fc.columnaId}
                    className="py-2.5 px-3 text-right border-r border-slate-200 text-slate-900 font-semibold"
                  >
                    {formatMonedaArg(fc.montoMensual)}
                  </td>
                ))}
              </tr>

              {/* Fila 4: Inversión Acumulada ($) */}
              <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 font-bold">
                <td className="py-2.5 px-4 font-sans font-bold text-emerald-950 sticky left-0 bg-emerald-50/90 z-10 border-r border-slate-300">
                  Inversión Acumulada ($)
                </td>
                {curva.map((fc) => (
                  <td
                    key={fc.columnaId}
                    className="py-2.5 px-3 text-right border-r border-slate-200 text-emerald-900 text-[13px]"
                  >
                    {formatMonedaArg(fc.montoAcumulado)}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico Oficial de Curva de Inversión S (Solo Línea con Marcadores y Etiquetas) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center">
              <TrendingUp className="w-4 h-4 mr-1.5 text-blue-600" />
              Curva de Inversión Acumulada por Convalidación (Línea S)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Avance Físico Acumulado (%) temporal consolidado (Mes 1 a Mes {obra.mesFinal}), unificando el último período con adicionales incluidos.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-4 h-0.5 bg-blue-700" />
              <span className="text-slate-700 font-semibold">Curva de Avance Acumulado</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-4 h-0.5 bg-red-600 border border-red-600 border-dashed" />
              <span className="text-red-700 font-medium">100,00% Base Original</span>
            </div>
          </div>
        </div>

        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartDataConsolidado} margin={{ top: 35, right: 35, left: 15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fontWeight: 'bold', fill: '#334155' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                domain={[0, yDomainMax]}
                tick={{ fontSize: 11, fill: '#475569' }}
                tickFormatter={(val) => `${val}%`}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={{ stroke: '#cbd5e1' }}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Línea horizontal punteada de referencia en 100,00% */}
              <ReferenceLine
                y={100}
                stroke="#dc2626"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: '100,00% (Contrato Básico)',
                  position: 'insideTopLeft',
                  fill: '#b91c1c',
                  fontSize: 11,
                  fontWeight: 'bold',
                }}
              />

              {/* Línea Curva S con Marcadores y Etiquetas de datos visibles */}
              <Line
                type="monotone"
                dataKey="porcentajeAcumulado"
                name="Avance Acumulado Total (%)"
                stroke="#1d4ed8"
                strokeWidth={3.5}
                dot={{ r: 6, fill: '#ffffff', stroke: '#1d4ed8', strokeWidth: 3 }}
                activeDot={{ r: 8, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                label={renderCustomizedLabel}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Explicación Normativa y Contable */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-700 space-y-3">
        <h4 className="font-bold text-slate-900 text-sm flex items-center">
          <Info className="w-4 h-4 mr-1.5 text-blue-600" />
          Fundamentos del Régimen de Convalidación (Neuquén)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">1. Denominador Fijo</span>
            <p className="text-slate-600">
              A diferencia de una aprobación ordinaria, la convalidación <strong>no recalibra el 100%</strong> al nuevo monto contractual. Toda la serie porcentual se divide siempre por el <strong>Monto de Obra Original</strong>.
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">2. Cierre Acumulado Flexible</span>
            <p className="text-slate-600">
              El porcentaje final acumulado puede cerrar por debajo del 100% (ej. 94,45%) si predominan economías/supresiones, o superar el 100% (ej. 104,17%) si existen adicionales netos.
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">3. Absorción de Redondeos</span>
            <p className="text-slate-600">
              La columna de cierre de Obra Original absorbe por diferencia aritmética exacta los centavos acumulados de certificados previos definitivos y provisorios para garantizar un balance sin discrepancias.
            </p>
          </div>
        </div>
      </div>
    </>
  )}
</div>
);
};

