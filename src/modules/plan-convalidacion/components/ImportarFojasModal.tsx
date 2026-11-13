'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck2,
  Trash2,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';
import { ItemContrato, MesConfig, ObraGeneral } from '@/modules/plan-convalidacion/types/convalidacion';
import {
  parsearFojaMedicion,
  aplicarFojasEnPlanTrabajo,
  ResultadoFojaMedicion,
  ResumenImportacionFojas,
} from '@/modules/plan-convalidacion/lib/fojaMedicionParser';

interface ImportarFojasModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemsActuales: ItemContrato[];
  mesesConfig: MesConfig[];
  obra: ObraGeneral;
  onAplicarFojas: (nuevosItems: ItemContrato[], nuevasConfig: MesConfig[]) => void;
}

export const ImportarFojasModal: React.FC<ImportarFojasModalProps> = ({
  isOpen,
  onClose,
  itemsActuales,
  mesesConfig,
  obra,
  onAplicarFojas,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fojasDetectadas, setFojasDetectadas] = useState<ResultadoFojaMedicion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Procesar archivos seleccionados (múltiples .xls o .xlsx)
  const procesarArchivos = async (archivos: FileList | File[]) => {
    setCargando(true);
    setErrorGlobal(null);
    const nuevasFojas: ResultadoFojaMedicion[] = [];
    const errores: string[] = [];

    for (let i = 0; i < archivos.length; i++) {
      const file = archivos[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        errores.push(`"${file.name}" no es un archivo Excel válido (.xls o .xlsx).`);
        continue;
      }

      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const resFoja = parsearFojaMedicion(workbook, file.name);
        nuevasFojas.push(resFoja);
      } catch (err: any) {
        errores.push(`Error al procesar "${file.name}": ${err.message || 'Formato no reconocido'}`);
      }
    }

    if (errores.length > 0) {
      setErrorGlobal(errores.join(' | '));
    }

    if (nuevasFojas.length > 0) {
      // Combinar con fojas existentes reemplazando si coincide el número de foja
      setFojasDetectadas((prev) => {
        const mapa = new Map<number, ResultadoFojaMedicion>();
        prev.forEach((f) => mapa.set(f.numeroFoja, f));
        nuevasFojas.forEach((f) => mapa.set(f.numeroFoja, f));
        return Array.from(mapa.values()).sort((a, b) => a.numeroFoja - b.numeroFoja);
      });
    }

    setCargando(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await procesarArchivos(e.dataTransfer.files);
    }
  };

  const handleEliminarFoja = (numeroFoja: number) => {
    setFojasDetectadas((prev) => prev.filter((f) => f.numeroFoja !== numeroFoja));
  };

  const handleConfirmar = () => {
    if (fojasDetectadas.length === 0) return;

    try {
      const resultado: ResumenImportacionFojas = aplicarFojasEnPlanTrabajo(
        itemsActuales,
        mesesConfig,
        obra.mesFinal,
        fojasDetectadas
      );

      onAplicarFojas(resultado.nuevosItems, resultado.nuevasConfigMeses);
      onClose();
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al aplicar las fojas al Plan de Trabajo.');
    }
  };

  const maxFoja = fojasDetectadas.length > 0 ? Math.max(...fojasDetectadas.map((f) => f.numeroFoja)) : 0;
  const corteSugerido = Math.min(obra.mesFinal - 1, maxFoja);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400 flex items-center justify-center text-blue-300">
              <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide uppercase">
                Importador de Fojas de Medición (.xls / .xlsx)
              </h3>
              <p className="text-xs text-slate-300">
                Extracción exclusiva de cantidades físicas ejecutadas (Foja Nº X → Mes X)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Zona Drag & Drop de Selección Múltiple */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  procesarArchivos(e.target.files);
                }
              }}
              className="hidden"
              id="file-fojas-input"
            />
            <label
              htmlFor="file-fojas-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-xs text-slate-700">
                <span className="font-bold text-blue-600 hover:underline">
                  Haga clic para seleccionar una o varias Fojas
                </span>{' '}
                o arrastre los archivos aquí
              </div>
              <p className="text-[11px] text-slate-400">
                Formatos soportados: <strong>.xls</strong> (Excel 97-2003) y <strong>.xlsx</strong> (Excel actual)
              </p>
            </label>
          </div>

          {cargando && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Procesando archivos de foja de medición...</span>
            </div>
          )}

          {errorGlobal && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorGlobal}</span>
            </div>
          )}

          {/* Lista de Fojas Detectadas */}
          {fojasDetectadas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center">
                  <FileCheck2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Fojas Reconocidas ({fojasDetectadas.length})
                </h4>
                <span className="text-[11px] text-slate-500">
                  Ordenadas cronológicamente por número de mes
                </span>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs max-h-56 overflow-y-auto">
                {fojasDetectadas.map((foja) => (
                  <div
                    key={foja.numeroFoja}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Mes {foja.numeroFoja}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center space-x-2">
                          <span>Foja de Medición Nº {foja.numeroFoja}</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            ({foja.nombreArchivo})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {foja.totalItems} ítems leídos · <strong>{foja.itemsConCantidad}</strong> con cantidad ejecutada
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleEliminarFoja(foja.numeroFoja)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded transition-colors"
                      title="Quitar esta foja de la importación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información y Garantía de No Sobrescritura */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
            <div className="font-bold text-slate-800 flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Reglas de aplicación en el Plan de Trabajo:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600">
              <li>
                <strong>Extracción exclusiva:</strong> Solo se actualizan las celdas de cantidades de los meses importados (Columna A <i>Ítem</i> contra Columna G <i>Actual</i>).
              </li>
              <li>
                <strong>Sin sobrescritura de carátula:</strong> No se modifica el nombre de la obra, contratista, expediente, precios unitarios ni cantidades contractuales.
              </li>
              <li>
                <strong>Ítems nuevos de la convalidación:</strong> Si un ítem nuevo no figuraba en las fojas previas, se asigna 0 sin generar advertencias.
              </li>
              {maxFoja > 0 && (
                <li>
                  <strong>Actualización de Definitivos:</strong> El selector de corte se actualizará a{' '}
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                    Hasta Mes {corteSugerido} Definitivos
                  </span>
                  , dejando el input del monto en pesos libre para su carga manual.
                </li>
              )}
            </ul>
          </div>

        </div>

        {/* Pie de Acciones */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={fojasDetectadas.length === 0}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              fojasDetectadas.length > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            <span>Aplicar {fojasDetectadas.length} Foja(s) al Plan de Trabajo</span>
          </button>
        </div>

      </div>
    </div>
  );
};

