'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { ObraGeneral, ResultadoConvalidacion } from '@/modules/plan-convalidacion/types/convalidacion';
import { formatMonedaArg, formatPorcentaje } from '@/modules/plan-convalidacion/lib/convalidacionEngine';

interface SummaryKPIsProps {
  obra: ObraGeneral;
  resultado: ResultadoConvalidacion;
  onActualizarObra: (patch: Partial<ObraGeneral>) => void;
}

export const SummaryKPIs: React.FC<SummaryKPIsProps> = ({
  obra,
  resultado,
  onActualizarObra,
}) => {
  const esAumento = resultado.diferenciaNetaMonto > 0;
  const esDisminucion = resultado.diferenciaNetaMonto < 0;

  // Badge config según Escenario
  const badgeConfig = {
    A_SOLO_DISMINUCION: {
      label: 'Escenario A: Solo Disminución de Obra',
      sublabel: 'Columna única al cierre (sin desdoblamiento). Acumula Monto Nuevo.',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      dotClass: 'bg-emerald-500',
    },
    B_SOLO_ADICIONALES: {
      label: 'Escenario B: Solo Adicionales (100% Orig.)',
      sublabel: 'Desdoble en Mes Final: Obra Orig. cierra exacto al 100%, y Adicionales acumula saldo.',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
      dotClass: 'bg-blue-500',
    },
    C_MIXTO: {
      label: 'Escenario C: Mixto (Disminución + Adicionales)',
      sublabel: 'Desdoble en Mes Final: Obra Orig. computa SUMAPRODUCTO de original ejecutada, y Adicionales el saldo.',
      badgeClass: 'bg-purple-50 text-purple-900 border-purple-300',
      dotClass: 'bg-purple-600',
    },
  }[resultado.escenario];

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 items-center">
          
          {/* KPI 1: Monto de Obra Original */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Monto Contrato Original</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                Denominador Fijo
              </span>
            </div>
            <div className="mt-1 text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {formatMonedaArg(resultado.montoObraOriginal)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Base 100,0000%
            </div>
          </div>

          {/* KPI 2: Monto de Obra Nuevo / Convalidado */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Monto Convalidado Total</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">
                Convalidación
              </span>
            </div>
            <div className="mt-1 text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {formatMonedaArg(resultado.montoObraNuevo)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Cierre acumulado: {formatPorcentaje(resultado.montoObraOriginal > 0 ? resultado.montoObraNuevo / resultado.montoObraOriginal : 0, 4)}
            </div>
          </div>

          {/* KPI 3: Diferencia Neta */}
          <div className={`rounded-lg p-3 border flex flex-col justify-between ${
            esAumento
              ? 'bg-blue-50/50 border-blue-200'
              : esDisminucion
              ? 'bg-amber-50/50 border-amber-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span>Alteración Neta</span>
              {esAumento ? (
                <span className="flex items-center text-blue-700 text-[10px] font-bold">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> AUMENTO
                </span>
              ) : esDisminucion ? (
                <span className="flex items-center text-amber-700 text-[10px] font-bold">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> ECONOMÍA
                </span>
              ) : (
                <span className="text-slate-500 text-[10px]">SIN VARIACIÓN</span>
              )}
            </div>
            <div className={`mt-1 text-base sm:text-lg font-bold tracking-tight ${
              esAumento ? 'text-blue-900' : esDisminucion ? 'text-amber-900' : 'text-slate-900'
            }`}>
              {formatMonedaArg(resultado.diferenciaNetaMonto)}
            </div>
            <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
              {resultado.diferenciaNetaPorcentaje >= 0 ? '+' : ''}
              {formatPorcentaje(resultado.diferenciaNetaPorcentaje, 2)}
            </div>
          </div>

          {/* KPI 4: Escenario Detectado Automáticamente */}
          <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Régimen y Escenario Normativo
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-medium text-slate-500">
                  Mes Final:
                </span>
                <select
                  value={obra.mesFinal}
                  onChange={(e) => {
                    const mf = parseInt(e.target.value, 10);
                    onActualizarObra({
                      mesFinal: mf,
                      cantidadMeses: Math.max(obra.cantidadMeses, mf),
                    });
                  }}
                  className="text-xs font-bold bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Mes {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-1.5 flex items-start space-x-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${badgeConfig.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full mr-1.5 ${badgeConfig.dotClass}`} />
                {badgeConfig.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-tight line-clamp-1">
              {badgeConfig.sublabel}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

