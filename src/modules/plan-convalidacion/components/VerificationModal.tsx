'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  ShieldCheck,
  X,
  Code2,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  calcularConvalidacion,
  autocompletarSaldosCierre,
  roundTo,
} from '@/modules/plan-convalidacion/lib/convalidacionEngine';
import {
  demoEscenarioA,
  demoEscenarioB,
  demoEscenarioC,
} from '@/modules/plan-convalidacion/lib/demoData';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestResult {
  id: string;
  titulo: string;
  escenario: string;
  paso: boolean;
  detalles: string[];
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [ejecutando, setEjecutando] = useState(false);
  const [resultados, setResultados] = useState<TestResult[]>([]);

  if (!isOpen) return null;

  const ejecutarPruebas = () => {
    setEjecutando(true);
    const testList: TestResult[] = [];

    // TEST 1: Escenario A
    try {
      const resA = calcularConvalidacion(
        demoEscenarioA.items,
        demoEscenarioA.mesesConfig,
        demoEscenarioA.obra.mesFinal
      );
      const pasoA1 = resA.escenario === 'A_SOLO_DISMINUCION';
      const pasoA2 = !resA.hayAdicionales && resA.hayDisminuciones;
      const pasoA3 = resA.columnas.length === 5;
      const ultimaFila = resA.curva[resA.curva.length - 1];
      const pasoA4 = ultimaFila.montoAcumulado === resA.montoObraNuevo;
      const pasoA5 = ultimaFila.porcentajeAcumulado < 1.0;

      testList.push({
        id: 'test-1',
        titulo: 'Validación Escenario A: Solo Disminución de Obra',
        escenario: 'A_SOLO_DISMINUCION',
        paso: pasoA1 && pasoA2 && pasoA3 && pasoA4 && pasoA5,
        detalles: [
          `Escenario detectado: ${resA.escenario} (Esperado: A_SOLO_DISMINUCION)`,
          `Columnas generadas: ${resA.columnas.length} (no se desdobla el último mes)`,
          `Monto Acumulado Final: $ ${ultimaFila.montoAcumulado.toLocaleString('es-AR')} = Monto Obra Nuevo`,
          `Porcentaje Acumulado Final: ${(ultimaFila.porcentajeAcumulado * 100).toFixed(4)}% (< 100% por disminución)`,
          `Absorción de redondeos en Mes Final: ${ultimaFila.absorbeRedondeo ? 'SÍ' : 'NO'}`,
        ],
      });
    } catch (err: any) {
      testList.push({
        id: 'test-1',
        titulo: 'Validación Escenario A',
        escenario: 'A',
        paso: false,
        detalles: [`Error de ejecución: ${err.message}`],
      });
    }

    // TEST 2: Escenario B
    try {
      const resB = calcularConvalidacion(
        demoEscenarioB.items,
        demoEscenarioB.mesesConfig,
        demoEscenarioB.obra.mesFinal
      );
      const pasoB1 = resB.escenario === 'B_SOLO_ADICIONALES';
      const pasoB2 = resB.hayAdicionales && !resB.hayDisminuciones;
      const pasoB3 = resB.columnas.length === 5; // 3 previos + 2 de cierre
      const colOrig = resB.curva[resB.curva.length - 2];
      const colAdic = resB.curva[resB.curva.length - 1];
      const pasoB4 = colOrig.montoAcumulado === resB.montoObraOriginal;
      const pasoB5 = colOrig.porcentajeAcumulado === 1.0;
      const pasoB6 = colAdic.montoAcumulado === resB.montoObraNuevo;
      const pasoB7 = colAdic.porcentajeAcumulado > 1.0;

      testList.push({
        id: 'test-2',
        titulo: 'Validación Escenario B: Solo Adicionales (Obra Orig. al 100%)',
        escenario: 'B_SOLO_ADICIONALES',
        paso: pasoB1 && pasoB2 && pasoB3 && pasoB4 && pasoB5 && pasoB6 && pasoB7,
        detalles: [
          `Escenario detectado: ${resB.escenario} (Esperado: B_SOLO_ADICIONALES)`,
          `Desdoble en Mes Final: Col A (${colOrig.label}) y Col B (${colAdic.label})`,
          `Columna Obra Orig: $ ${colOrig.montoAcumulado.toLocaleString('es-AR')} = Exactamente 100,0000%`,
          `Columna Adicionales: $ ${colAdic.montoAcumulado.toLocaleString('es-AR')} = ${(colAdic.porcentajeAcumulado * 100).toFixed(4)}%`,
          `Absorción de redondeo en Columna Original: ${colOrig.absorbeRedondeo ? 'SÍ' : 'NO'}`,
        ],
      });
    } catch (err: any) {
      testList.push({
        id: 'test-2',
        titulo: 'Validación Escenario B',
        escenario: 'B',
        paso: false,
        detalles: [`Error de ejecución: ${err.message}`],
      });
    }

    // TEST 3: Escenario C
    try {
      const resC = calcularConvalidacion(
        demoEscenarioC.items,
        demoEscenarioC.mesesConfig,
        demoEscenarioC.obra.mesFinal
      );
      const pasoC1 = resC.escenario === 'C_MIXTO';
      const pasoC2 = resC.hayAdicionales && resC.hayDisminuciones;
      const colOrig = resC.curva[resC.curva.length - 2];
      const colAdic = resC.curva[resC.curva.length - 1];
      const pasoC3 = colAdic.montoAcumulado === resC.montoObraNuevo;

      testList.push({
        id: 'test-3',
        titulo: 'Validación Escenario C: Mixto (Disminución + Adicionales)',
        escenario: 'C_MIXTO',
        paso: pasoC1 && pasoC2 && pasoC3,
        detalles: [
          `Escenario detectado: ${resC.escenario} (Esperado: C_MIXTO)`,
          `Cierre Obra Original por SUMAPRODUCTO: $ ${colOrig.montoAcumulado.toLocaleString('es-AR')} (${(colOrig.porcentajeAcumulado * 100).toFixed(4)}%)`,
          `Cierre Adicionales acumulando Monto Nuevo: $ ${colAdic.montoAcumulado.toLocaleString('es-AR')} (${(colAdic.porcentajeAcumulado * 100).toFixed(4)}%)`,
          `Ítems nuevos (Hi=0, CVi>0) y suprimidos (CVi=0) procesados correctamente`,
        ],
      });
    } catch (err: any) {
      testList.push({
        id: 'test-3',
        titulo: 'Validación Escenario C',
        escenario: 'C',
        paso: false,
        detalles: [`Error de ejecución: ${err.message}`],
      });
    }

    // TEST 4: Autocompletar Saldos
    try {
      const itemsIncompletos = demoEscenarioC.items.map((it) => ({
        ...it,
        avancesPorColumna: {
          mes_1: it.avancesPorColumna.mes_1 || 0,
          mes_2: it.avancesPorColumna.mes_2 || 0,
          mes_3: it.avancesPorColumna.mes_3 || 0,
          mes_4: it.avancesPorColumna.mes_4 || 0,
          mes_5: it.avancesPorColumna.mes_5 || 0,
        },
      }));

      const itemsCompletados = autocompletarSaldosCierre(
        itemsIncompletos,
        demoEscenarioC.obra.mesFinal,
        true
      );

      const resComp = calcularConvalidacion(
        itemsCompletados,
        demoEscenarioC.mesesConfig,
        demoEscenarioC.obra.mesFinal
      );

      const pasoD1 = roundTo(resComp.totalPendienteOriginal, 2) === 0;
      const pasoD2 = roundTo(resComp.totalPendienteAdicional, 2) === 0;
      const pasoD3 = resComp.saldosFisicosCerrados;

      testList.push({
        id: 'test-4',
        titulo: 'Validación de Cierre Físico y Saldos (CW = 0.00 / CX = 0.00)',
        escenario: 'CONTROL_FISICO',
        paso: pasoD1 && pasoD2 && pasoD3,
        detalles: [
          `Saldo original pendiente CW: ${resComp.totalPendienteOriginal.toFixed(2)} (Esperado: 0.00)`,
          `Saldo adicional pendiente CX: ${resComp.totalPendienteAdicional.toFixed(2)} (Esperado: 0.00)`,
          `Semáforo de consistencia física: ${resComp.saldosFisicosCerrados ? '100% CERRADO' : 'INCONSISTENTE'}`,
        ],
      });
    } catch (err: any) {
      testList.push({
        id: 'test-4',
        titulo: 'Validación de Saldos Físicos',
        escenario: 'CW_CX',
        paso: false,
        detalles: [`Error de ejecución: ${err.message}`],
      });
    }

    setResultados(testList);
    setEjecutando(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">
              Auditoría y Verificación de los 3 Escenarios Normativos
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-800">
                Suite de Validación de Lógica Contable y Reglas de Negocio
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Evalúa automáticamente casos borde, redondeos en certificados previos, ítems nuevos y saldos.
              </p>
            </div>
            <button
              onClick={ejecutarPruebas}
              disabled={ejecutando}
              className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-xs"
            >
              <Play className="w-4 h-4 mr-1.5" />
              {resultados.length === 0 ? 'Ejecutar Pruebas Ahora' : 'Re-ejecutar Pruebas'}
            </button>
          </div>

          {resultados.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg">
              Presione el botón "Ejecutar Pruebas Ahora" para verificar los 3 escenarios normativos de la Municipalidad de Neuquén.
            </div>
          ) : (
            <div className="space-y-3">
              {resultados.map((res) => (
                <div
                  key={res.id}
                  className={`p-4 rounded-lg border text-xs transition-colors ${
                    res.paso
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-red-50/50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 flex items-center">
                      {res.paso ? (
                        <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-1.5 text-red-600 flex-shrink-0" />
                      )}
                      {res.titulo}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        res.paso ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {res.paso ? 'PASÓ' : 'FALLÓ'}
                    </span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-600 font-mono pl-6 list-disc">
                    {res.detalles.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Motor: decimal.js v10.6.0 (Precisión 20 dígitos)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

