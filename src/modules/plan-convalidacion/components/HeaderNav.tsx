'use client';

import React, { useState } from 'react';
import {
  Download,
  FolderOpen,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { ObraGeneral, ResultadoConvalidacion, MesConfig } from '@/modules/plan-convalidacion/types/convalidacion';
import { todosLosProyectosDemo, DemoProject } from '@/modules/plan-convalidacion/lib/demoData';
import { exportarExcelOficial } from '@/modules/plan-convalidacion/lib/excelExport';
import { ExportAuditModal } from '@/modules/plan-convalidacion/components/ExportAuditModal';

interface HeaderNavProps {
  obra: ObraGeneral;
  resultado: ResultadoConvalidacion;
  mesesConfig: MesConfig[];
  onCargarDemo: (demo: DemoProject) => void;
  onResetear: () => void;
  onAbrirVerificacion: () => void;
  onAjustarTopes?: () => void;
  onVolver?: () => void;
  estadoGuardado?: 'guardado' | 'pendiente' | 'guardando' | 'error';
  ultimaGuardada?: Date | null;
  onGuardar?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  obra,
  resultado,
  mesesConfig,
  onCargarDemo,
  onResetear,
  onAbrirVerificacion,
  onAjustarTopes,
  onVolver,
  estadoGuardado,
  ultimaGuardada,
  onGuardar,
}) => {
  const [exportando, setExportando] = useState(false);
  const [menuDemosAbierto, setMenuDemosAbierto] = useState(false);
  const [modalAuditoriaAbierto, setModalAuditoriaAbierto] = useState(false);

  const ejecutarDescargaExcel = async () => {
    try {
      setExportando(true);
      const blob = await exportarExcelOficial(obra, resultado, mesesConfig);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = (obra.expediente || obra.nombre || 'Convalidacion')
        .replace(/[^a-zA-Z0-9-_]/g, '_');
      a.download = `Plan_Trabajo_Curva_${cleanName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error al exportar Excel:', err);
      alert('Hubo un error al generar el archivo Excel oficial.');
    } finally {
      setExportando(false);
    }
  };

  const handleDescargarExcel = async () => {
    // Si hay alertas o excesos físicos, abrir diálogo de advertencia
    if (resultado.tieneAlertasFisicas && resultado.itemsConExceso.length > 0) {
      setModalAuditoriaAbierto(true);
      return;
    }
    await ejecutarDescargaExcel();
  };

  const handleAjustarYExportar = async () => {
    setModalAuditoriaAbierto(false);
    if (onAjustarTopes) {
      onAjustarTopes();
    }
    setTimeout(() => {
      ejecutarDescargaExcel();
    }, 100);
  };

  const handleExportarConAdvertencias = async () => {
    setModalAuditoriaAbierto(false);
    await ejecutarDescargaExcel();
  };

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Izquierda: Enlace de retorno, Expediente y Estado de persistencia */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onVolver && (
            <button
              type="button"
              onClick={onVolver}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              title="Volver a la selección de régimen y repositorio de planes"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>Volver a Verificación de Plan y Curva</span>
            </button>
          )}

          {obra.expediente ? (
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0038A8] border border-blue-200 font-mono text-xs font-bold">
              Expte: {obra.expediente}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
              Nuevo Plan
            </span>
          )}

          {/* Indicador de estado de guardado */}
          {estadoGuardado === 'guardado' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Guardado</span>
              {ultimaGuardada && (
                <span className="text-[10px] text-emerald-600/80 font-mono hidden md:inline">
                  ({ultimaGuardada.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </span>
          )}

          {estadoGuardado === 'pendiente' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Cambios pendientes</span>
            </span>
          )}

          {estadoGuardado === 'guardando' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-[#0038A8] border border-blue-200 text-[11px] font-semibold">
              <RefreshCw className="w-3.5 h-3.5 text-[#0038A8] animate-spin" />
              <span>Guardando...</span>
            </span>
          )}
        </div>

        {/* Derecha: Acciones limpias y estilizadas en el tema claro de SIGAC */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Auditoría / Tests */}
          <button
            type="button"
            onClick={onAbrirVerificacion}
            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
            title="Verificar los 3 escenarios con tests unitarios en tiempo real"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            <span className="hidden sm:inline">Auditoría / Tests</span>
          </button>

          {/* Selector de Casos Demo */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuDemosAbierto(!menuDemosAbierto)}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 mr-1 text-blue-600" />
              <span>Cargar Ejemplo</span>
            </button>

            {menuDemosAbierto && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-slate-900"
                onMouseLeave={() => setMenuDemosAbierto(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Casos Oficiales de Neuquén
                </div>
                {todosLosProyectosDemo.map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => {
                      onCargarDemo(demo);
                      setMenuDemosAbierto(false);
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors flex flex-col space-y-1 text-xs border-b border-slate-50 last:border-b-0 cursor-pointer"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{demo.nombre}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          demo.escenarioEsperado === 'C'
                            ? 'bg-purple-100 text-purple-800'
                            : demo.escenarioEsperado === 'B'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        Esc. {demo.escenarioEsperado}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 line-clamp-2">
                      {demo.descripcion}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Exportar Excel Oficial (.xlsx) */}
          <button
            type="button"
            onClick={handleDescargarExcel}
            disabled={exportando}
            className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            title="Descargar archivo Excel oficial con fórmulas vivas SUMAPRODUCTO e INDICE"
          >
            {exportando ? (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5" />
            )}
            <span>Exportar Excel Oficial (.xlsx)</span>
          </button>

          {/* Guardar Plan en SIGAC */}
          {onGuardar && (
            <button
              type="button"
              onClick={onGuardar}
              disabled={estadoGuardado === 'guardando'}
              className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-bold bg-[#0038A8] hover:bg-blue-700 active:bg-blue-800 text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              title="Guardar todos los cambios en el repositorio de SIGAC"
            >
              {estadoGuardado === 'guardando' ? (
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              <span>Guardar Plan en SIGAC</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal de Advertencia de Auditoría para Exportación */}
      <ExportAuditModal
        isOpen={modalAuditoriaAbierto}
        onClose={() => setModalAuditoriaAbierto(false)}
        itemsConExceso={resultado.itemsConExceso}
        onAjustarYExportar={handleAjustarYExportar}
        onExportarConAdvertencias={handleExportarConAdvertencias}
      />
    </div>
  );
};
