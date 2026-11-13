'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Calculator,
  Layers,
  CheckCircle,
  FileText,
  Percent,
} from 'lucide-react';
import { ResultadoConvalidacion, ObraGeneral } from '@/modules/plan-convalidacion/types/convalidacion';
import { formatMonedaArg, formatPorcentaje } from '@/modules/plan-convalidacion/lib/convalidacionEngine';

interface MemoriaCalculoDrawerProps {
  resultado: ResultadoConvalidacion;
  obra: ObraGeneral;
}

export const MemoriaCalculoDrawer: React.FC<MemoriaCalculoDrawerProps> = ({
  resultado,
  obra,
}) => {
  const [abierto, setAbierto] = useState(false);
  const { escenario, montoObraOriginal, montoObraNuevo, curva, hayAdicionales } = resultado;

  const colOrig = curva.find((c) => c.tipo === 'cierre_original');
  const colAdic = curva.find((c) => c.tipo === 'cierre_adicional');

  return (
    <div className="bg-white rounded-xl border border-blue-200 overflow-hidden shadow-xs">
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full px-5 py-3.5 bg-blue-50/60 hover:bg-blue-50 transition-colors flex items-center justify-between text-left"
      >
        <div className="flex items-center space-x-2.5">
          <Calculator className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-xs font-bold text-blue-950 uppercase tracking-wide">
            ¿Cómo se calcula este cuadro? — Memoria de Cálculo Administrativa y Contable
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
            {escenario === 'C_MIXTO'
              ? 'Escenario C: Mixto'
              : escenario === 'B_SOLO_ADICIONALES'
              ? 'Escenario B: Adicionales'
              : 'Escenario A: Disminución'}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-blue-700 font-semibold">
          <span>{abierto ? 'Ocultar detalles' : 'Ver memoria de cálculo'}</span>
          {abierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {abierto && (
        <div className="p-5 text-xs text-slate-700 space-y-4 border-t border-blue-100 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Tarjeta 1: Base Fija de Convalidación */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-slate-900 font-bold">
                <span className="flex items-center">
                  <Percent className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  1. Base Fija Inamovible
                </span>
                <span className="text-[10px] font-mono text-slate-500">D95</span>
              </div>
              <p className="text-[11px] text-slate-600">
                A diferencia de una aprobación tradicional, la convalidación <strong>mantiene fijo el Monto Original</strong> como denominador de toda la serie:
              </p>
              <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px] font-bold text-slate-900">
                Denominador = {formatMonedaArg(montoObraOriginal)}
              </div>
              <p className="text-[10px] text-slate-500 italic">
                El cierre total acumulado alcanza {formatPorcentaje(montoObraOriginal > 0 ? montoObraNuevo / montoObraOriginal : 0, 4)} sobre este valor.
              </p>
            </div>

            {/* Tarjeta 2: Cierre de Obra Original */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-slate-900 font-bold">
                <span className="flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  2. Cierre Contrato Original
                </span>
                <span className="text-[10px] font-mono text-slate-500">Mes {obra.mesFinal} (Orig.)</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {escenario === 'C_MIXTO' ? (
                  <>
                    Calculado por <strong>SUMAPRODUCTO exacto</strong> de cantidades ejecutadas del contrato original (topeadas a mín(Cant. Original, Cant. Nueva)) por precio unitario:
                  </>
                ) : escenario === 'B_SOLO_ADICIONALES' ? (
                  <>
                    El contrato original <strong>cierra exactamente al 100,0000%</strong> ($ {formatMonedaArg(montoObraOriginal)}), absorbiendo redondeos previos de certificados:
                  </>
                ) : (
                  <>
                    Cierra en una columna única acumulando el <strong>Monto de Obra Nuevo</strong> ($ {formatMonedaArg(montoObraNuevo)}):
                  </>
                )}
              </p>
              <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px] font-bold text-slate-900 flex justify-between">
                <span>Acumulado Orig:</span>
                <span>{formatMonedaArg(colOrig?.montoAcumulado)} ({formatPorcentaje(colOrig?.porcentajeAcumulado, 4)})</span>
              </div>
            </div>

            {/* Tarjeta 3: Cierre de Adicionales */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-slate-900 font-bold">
                <span className="flex items-center">
                  <Layers className="w-3.5 h-3.5 mr-1 text-purple-600" />
                  3. Cierre de Adicionales
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {hayAdicionales ? `Mes ${obra.mesFinal} (Adic.)` : 'Sin adicionales'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                {hayAdicionales ? (
                  <>
                    Se obtiene por <strong>diferencia matemática estricta</strong> entre el Monto Convalidado Final y lo acumulado en Obra Original:
                  </>
                ) : (
                  <>
                    Al no existir adicionales netos, toda la economía queda reflejada directamente en la columna única final.
                  </>
                )}
              </p>
              {hayAdicionales && (
                <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px] font-bold text-slate-900 flex justify-between">
                  <span>Monto Adicional:</span>
                  <span>{formatMonedaArg(colAdic?.montoMensual)} ({formatPorcentaje(colAdic?.porcentajeMensual, 4)})</span>
                </div>
              )}
            </div>

          </div>

          {/* Métodos de Certificación: Definitivos vs Provisorios */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center">
              <Calculator className="w-4 h-4 mr-1.5 text-blue-600" />
              Cálculo por Período: Certificados Definitivos ($ → %) vs. Provisorios (% → $)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              {/* Definitivos */}
              <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-emerald-900">
                  <span className="flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Meses Definitivos (Mes 1 a Mes K)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                    $ → %
                  </span>
                </div>
                <p className="text-slate-600">
                  El dato maestro indiscutible es el <strong>Monto Certificado en Pesos ($)</strong> emitido. El porcentaje surge de la relación con el Monto Original fijo:
                </p>
                <div className="p-2 bg-slate-50 rounded border border-slate-200 font-mono text-[10px] text-slate-800 space-y-0.5">
                  <div>• MontoMensual = MontoCertificadoIngresado</div>
                  <div>• PorcMensual = ROUND(MontoMensual / MontoObraOriginal; 6)</div>
                </div>
              </div>

              {/* Provisorios */}
              <div className="p-3 bg-white rounded-lg border border-blue-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-blue-900">
                  <span className="flex items-center">
                    <Percent className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    Meses Provisorios (Mes K+1 al Cierre)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                    % → $ (Método Municipal)
                  </span>
                </div>
                <p className="text-slate-600">
                  Se calcula el <strong>avance porcentual del ítem (p_im = q_im / H_i)</strong> ponderado por su <strong>Incidencia Original</strong> exacta sin truncar:
                </p>
                <div className="p-2 bg-slate-50 rounded border border-slate-200 font-mono text-[10px] text-slate-800 space-y-0.5">
                  <div>1. PorcMensual = ROUND(SUM(p_im × IncOrig_i); 6)</div>
                  <div>2. MontoMensual = ROUND(PorcMensual × MontoObraOriginal; 2)</div>
                  <div>3. Acumulados = AcumuladoAnterior + Mensual</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-start space-x-2 text-[11px] text-blue-900">
            <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Consistencia con la Planilla Oficial de la Municipalidad de Neuquén:</strong> La columna de cierre de obra original absorbe centavos de redondeos acumulados en certificados provisorios o definitivos, de modo que la inversión acumulada al cierre coincide exactamente con el monto convalidado sin diferencias decimales.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

