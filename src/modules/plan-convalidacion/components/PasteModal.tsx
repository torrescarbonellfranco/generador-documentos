'use client';

import React, { useState } from 'react';
import { Clipboard, Check, X, AlertCircle, FileText } from 'lucide-react';
import { ItemContrato } from '@/modules/plan-convalidacion/types/convalidacion';

interface PasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportarItems: (items: ItemContrato[], modo: 'reemplazar' | 'agregar') => void;
}

export const PasteModal: React.FC<PasteModalProps> = ({
  isOpen,
  onClose,
  onImportarItems,
}) => {
  const [textoPegado, setTextoPegado] = useState('');
  const [modo, setModo] = useState<'reemplazar' | 'agregar'>('reemplazar');
  const [itemsParseados, setItemsParseados] = useState<ItemContrato[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const parsearTexto = (raw: string) => {
    setTextoPegado(raw);
    setErrorMsg(null);
    if (!raw.trim()) {
      setItemsParseados([]);
      return;
    }

    try {
      const lines = raw.trim().split(/\r?\n/);
      const items: ItemContrato[] = [];

      lines.forEach((line, idx) => {
        // Separador tab (Excel) o coma o punto y coma
        let parts = line.split('\t');
        if (parts.length < 3 && line.includes(';')) {
          parts = line.split(';');
        }

        const cleanParts = parts.map((p) => p.trim());
        if (cleanParts.length === 0 || (cleanParts.length === 1 && !cleanParts[0])) return;

        // Formatos típicos de Excel:
        // Opción 1 (6 columnas): Nº | Descripción | Unidad | P.U. | Cant. Orig | Cant. Nueva
        // Opción 2 (5 columnas): Nº | Descripción | P.U. | Cant. Orig | Cant. Nueva
        // Opción 3 (4 columnas): Nº | Descripción | Cant. Orig | Cant. Nueva (P.U. por defecto 0)

        let numero = '';
        let descripcion = '';
        let unidad = 'gl';
        let precioUnitario = 0;
        let cantidadOriginal = 0;
        let cantidadNueva = 0;

        const parseNum = (str: string | undefined): number => {
          if (!str) return 0;
          // Quitar signos $, espacios y normalizar coma decimal argentina (ej: "1.234,56" -> 1234.56)
          let clean = str.replace(/\$/g, '').replace(/\s/g, '').trim();
          if (clean.includes(',') && clean.includes('.')) {
            // "1.234,56" -> punto como miles, coma como decimal
            clean = clean.replace(/\./g, '').replace(',', '.');
          } else if (clean.includes(',')) {
            clean = clean.replace(',', '.');
          }
          const num = parseFloat(clean);
          return isNaN(num) ? 0 : num;
        };

        if (cleanParts.length >= 6) {
          numero = cleanParts[0];
          descripcion = cleanParts[1];
          unidad = cleanParts[2] || 'gl';
          precioUnitario = parseNum(cleanParts[3]);
          cantidadOriginal = parseNum(cleanParts[4]);
          cantidadNueva = parseNum(cleanParts[5]);
        } else if (cleanParts.length === 5) {
          numero = cleanParts[0];
          descripcion = cleanParts[1];
          unidad = 'gl';
          precioUnitario = parseNum(cleanParts[2]);
          cantidadOriginal = parseNum(cleanParts[3]);
          cantidadNueva = parseNum(cleanParts[4]);
        } else if (cleanParts.length === 4) {
          numero = cleanParts[0];
          descripcion = cleanParts[1];
          cantidadOriginal = parseNum(cleanParts[2]);
          cantidadNueva = parseNum(cleanParts[3]);
        } else {
          numero = cleanParts[0] || `${idx + 1}`;
          descripcion = cleanParts.slice(1).join(' ');
        }

        // Si es una fila de encabezado accidental (ej: "Nº", "DESCRIPCIÓN"), ignorar
        if (
          numero.toLowerCase().includes('nº') ||
          numero.toLowerCase().includes('item') ||
          descripcion.toLowerCase().includes('descrip')
        ) {
          return;
        }

        items.push({
          id: `item-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
          numero,
          descripcion,
          unidad,
          precioUnitario,
          cantidadOriginal,
          cantidadNueva,
          avancesPorColumna: {},
        });
      });

      setItemsParseados(items);
    } catch (err: any) {
      setErrorMsg('No se pudo procesar el texto: ' + (err.message || 'Formato desconocido'));
    }
  };

  const handleConfirmar = () => {
    if (itemsParseados.length === 0) return;
    onImportarItems(itemsParseados, modo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Clipboard className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Pegado Masivo desde Excel / Planilla de Cálculo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 text-xs text-blue-900 space-y-1">
            <p className="font-semibold flex items-center">
              <FileText className="w-4 h-4 mr-1.5 text-blue-600" />
              Estructura recomendada de columnas copiadas en Excel (con o sin encabezados):
            </p>
            <p className="font-mono text-[11px] text-blue-800 bg-white/70 p-2 rounded border border-blue-100">
              Col A: Nº Ítem &nbsp;|&nbsp; Col B: Descripción &nbsp;|&nbsp; Col C: Unidad &nbsp;|&nbsp; Col D: Precio Unitario ($) &nbsp;|&nbsp; Col E: Cant. Original (H) &nbsp;|&nbsp; Col F: Cant. Nueva (CV)
            </p>
            <p className="text-slate-600 text-[11px]">
              * Soporta separadores por tabulador de Excel, números con formato de moneda ($) y coma decimal (1.234,56).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Pegar contenido aquí (Ctrl + V / Cmd + V):
            </label>
            <textarea
              rows={8}
              value={textoPegado}
              onChange={(e) => parsearTexto(e.target.value)}
              placeholder="1&#9;TRABAJOS PRELIMINARES&#9;gl&#9;0&#9;0&#9;0&#10;1.1&#9;Cartel de obra&#9;u&#9;650000&#9;1&#9;1&#10;1.2&#9;Limpieza y desmonte&#9;m2&#9;3200&#9;12500&#9;12500..."
              className="w-full font-mono text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Vista previa */}
          {itemsParseados.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center">
                  <Check className="w-4 h-4 mr-1 text-emerald-600" />
                  Se detectaron {itemsParseados.length} ítems válidos
                </span>
                <div className="flex items-center space-x-3 text-xs">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="modoImport"
                      value="reemplazar"
                      checked={modo === 'reemplazar'}
                      onChange={() => setModo('reemplazar')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-1.5 text-slate-700 font-medium">Reemplazar existentes</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="modoImport"
                      value="agregar"
                      checked={modo === 'agregar'}
                      onChange={() => setModo('agregar')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-1.5 text-slate-700 font-medium">Agregar al final</span>
                  </label>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg max-h-44 overflow-y-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-[11px] text-slate-600 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-1 px-2">Nº</th>
                      <th className="py-1 px-2">Descripción</th>
                      <th className="py-1 px-2">Unid.</th>
                      <th className="py-1 px-2 text-right">P.U.</th>
                      <th className="py-1 px-2 text-right">Cant. Orig</th>
                      <th className="py-1 px-2 text-right">Cant. Nueva</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {itemsParseados.slice(0, 10).map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1 px-2 font-bold">{it.numero}</td>
                        <td className="py-1 px-2 font-sans truncate max-w-[200px]">
                          {it.descripcion}
                        </td>
                        <td className="py-1 px-2">{it.unidad}</td>
                        <td className="py-1 px-2 text-right">{it.precioUnitario}</td>
                        <td className="py-1 px-2 text-right">{it.cantidadOriginal}</td>
                        <td className="py-1 px-2 text-right">{it.cantidadNueva}</td>
                      </tr>
                    ))}
                    {itemsParseados.length > 10 && (
                      <tr>
                        <td colSpan={6} className="py-1 px-2 text-center text-slate-500 italic bg-slate-50">
                          ... y {itemsParseados.length - 10} ítems más
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={itemsParseados.length === 0}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center shadow-sm"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Importar {itemsParseados.length} ítems
          </button>
        </div>

      </div>
    </div>
  );
};

