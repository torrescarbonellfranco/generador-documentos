'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Sliders,
  X,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import { ItemCalculado } from '@/modules/plan-convalidacion/types/convalidacion';
import { formatMonedaArg } from '@/modules/plan-convalidacion/lib/convalidacionEngine';

interface ExportAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemsConExceso: ItemCalculado[];
  onAjustarYExportar: () => void;
  onExportarConAdvertencias: () => void;
}

export const ExportAuditModal: React.FC<ExportAuditModalProps> = ({
  isOpen,
  onClose,
  itemsConExceso,
  onAjustarYExportar,
  onExportarConAdvertencias,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-950">
                Advertencia de Auditoría de Topes Físicos
              </h3>
              <p className="text-xs text-amber-800">
                Se detectaron {itemsConExceso.length} {itemsConExceso.length === 1 ? 'ítem' : 'ítems'} con cantidades ejecutadas que exceden los límites aprobados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-800 hover:text-amber-950 p-1 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <strong>Criterio Normativo de Obra Pública (Neuquén):</strong>
              <p className="mt-0.5 text-slate-600">
                En una convalidación contractual, los ítems disminuidos no pueden certificarse por encima de su nuevo tope en el contrato original, y los ítems suprimidos no deben registrar ejecución. Exportar el archivo Excel oficial con excesos físicos puede ser objetado por la inspección y el tribunal de cuentas.
              </p>
            </div>
          </div>

          {/* Listado de ítems con excesos */}
          <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
                <tr>
                  <th className="py-2 px-3 w-14">Ítem</th>
                  <th className="py-2 px-3">Descripción</th>
                  <th className="py-2 px-3 text-right">Tope Aprobado</th>
                  <th className="py-2 px-3 text-right">Total Ejecutado</th>
                  <th className="py-2 px-3">Motivo de Alerta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemsConExceso.map((ic) => (
                  <tr key={ic.item.id} className="hover:bg-amber-50/40">
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">
                      {ic.item.numero}
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-medium truncate max-w-[200px]" title={ic.item.descripcion}>
                      {ic.item.descripcion}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-900">
                      {ic.item.cantidadNueva.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-red-700">
                      {ic.cantidadEjecutadaTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-red-600 font-medium">
                      {ic.mensajeAlertaFisica || 'Excede cantidad permitida'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar y Revisar
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onExportarConAdvertencias}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
              title="Exportar archivo Excel con los valores actuales ingresados"
            >
              Exportar con Advertencias
            </button>
            <button
              onClick={onAjustarYExportar}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
              title="Ajustar cantidades al tope legal permitido y descargar el Excel oficial"
            >
              <Sliders className="w-3.5 h-3.5 mr-1.5" />
              Ajustar al Tope y Exportar (.xlsx)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

