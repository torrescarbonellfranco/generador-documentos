'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ClipboardPaste,
  Plus,
  Trash2,
  Download,
  ArrowRight,
  Info,
  RefreshCw,
  FileCheck,
  ShieldCheck,
  Edit3,
  CornerLeftUp,
  Sparkles,
  X,
} from 'lucide-react';
import {
  ItemContrato,
  ItemCalculado,
  ObraGeneral,
  ReconciliacionCuadro,
  ResultadoImportacion,
} from '@/modules/plan-convalidacion/types/convalidacion';
import { formatMonedaArg, formatPorcentaje } from '@/modules/plan-convalidacion/lib/convalidacionEngine';
import {
  parsearCuadroModificatorioExcel,
  generarPlantillaCuadroModificatorio,
} from '@/modules/plan-convalidacion/lib/cuadroModificatorioParser';

interface Step1PresupuestoProps {
  obra: ObraGeneral;
  itemsCalculados: ItemCalculado[];
  montoObraOriginal: number;
  montoObraNuevo: number;
  reconciliacion?: ReconciliacionCuadro;
  onActualizarItems: (items: ItemContrato[], reconciliacion?: ReconciliacionCuadro) => void;
  onActualizarObra: (patch: Partial<ObraGeneral>) => void;
  onAbrirModalPegado: () => void;
  onIrAPaso2: () => void;
}

export const Step1Presupuesto: React.FC<Step1PresupuestoProps> = ({
  obra,
  itemsCalculados,
  montoObraOriginal,
  montoObraNuevo,
  reconciliacion,
  onActualizarItems,
  onActualizarObra,
  onAbrirModalPegado,
  onIrAPaso2,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [procesandoArchivo, setProcesandoArchivo] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Estado para editor detallado de descripción y fusión de texto
  const [itemEnEdicion, setItemEnEdicion] = useState<ItemContrato | null>(null);
  const [textoEdicion, setTextoEdicion] = useState<string>('');

  // Manejo de carga de archivo Excel (.xlsx / .xls)
  const procesarArchivoExcel = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorCarga('Por favor seleccione un archivo de Excel válido (.xlsx o .xls).');
      return;
    }

    try {
      setProcesandoArchivo(true);
      setErrorCarga(null);
      const buffer = await file.arrayBuffer();
      const resultado: ResultadoImportacion = parsearCuadroModificatorioExcel(buffer);

      if (resultado.items.length === 0) {
        setErrorCarga('No se encontraron ítems válidos en el archivo Excel.');
        return;
      }

      // Actualizar datos de la obra si se detectaron en la cabecera
      const patchObra: Partial<ObraGeneral> = {};
      if (resultado.metadatosDetectados?.obra) {
        patchObra.nombre = resultado.metadatosDetectados.obra;
      }
      if (resultado.metadatosDetectados?.expediente) {
        patchObra.expediente = resultado.metadatosDetectados.expediente;
      }
      if (resultado.metadatosDetectados?.contratista) {
        patchObra.contratista = resultado.metadatosDetectados.contratista;
      }
      if (Object.keys(patchObra).length > 0) {
        onActualizarObra(patchObra);
      }

      onActualizarItems(resultado.items, resultado.reconciliacion);
    } catch (err: any) {
      console.error('Error al procesar archivo:', err);
      setErrorCarga('Error al leer el archivo Excel: ' + (err.message || 'Formato desconocido'));
    } finally {
      setProcesandoArchivo(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      procesarArchivoExcel(e.dataTransfer.files[0]);
    }
  };

  const handleDescargarPlantilla = () => {
    const blob = generarPlantillaCuadroModificatorio();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Cuadro_Modificatorio_Plantilla.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Manejar cambio en celda de un ítem
  const handleChangeCell = (
    id: string,
    field: keyof ItemContrato,
    value: any
  ) => {
    const nuevosItems = itemsCalculados.map((ic) => {
      if (ic.item.id === id) {
        return {
          ...ic.item,
          [field]: value,
        };
      }
      return ic.item;
    });
    onActualizarItems(nuevosItems, reconciliacion);
  };

  const handleAgregarItem = (esTitulo: boolean = false) => {
    const nuevoId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const nuevoItem: ItemContrato = {
      id: nuevoId,
      numero: `${itemsCalculados.length + 1}`,
      descripcion: esTitulo ? 'NUEVO RUBRO / CAPÍTULO' : 'Nuevo Ítem de Obra',
      unidad: esTitulo ? '' : 'gl',
      precioUnitario: 0,
      cantidadOriginal: 0,
      cantidadNueva: 0,
      avancesPorColumna: {},
    };
    onActualizarItems([...itemsCalculados.map((c) => c.item), nuevoItem], reconciliacion);
  };

  const handleEliminarItem = (id: string) => {
    const nuevos = itemsCalculados.filter((c) => c.item.id !== id).map((c) => c.item);
    onActualizarItems(nuevos, reconciliacion);
  };

  const handleAbrirEdicionTexto = (item: ItemContrato) => {
    setItemEnEdicion(item);
    setTextoEdicion(item.descripcion);
  };

  const handleGuardarEdicionTexto = () => {
    if (!itemEnEdicion) return;
    handleChangeCell(itemEnEdicion.id, 'descripcion', textoEdicion);
    setItemEnEdicion(null);
  };

  const handleLimpiarEspaciosEdicion = () => {
    const limpio = textoEdicion
      .replace(/\r?\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    setTextoEdicion(limpio);
  };

  const handleFusionarConAnterior = (index: number) => {
    if (index <= 0) return;
    const itemActual = itemsCalculados[index].item;
    const itemAnterior = itemsCalculados[index - 1].item;

    const tieneValores =
      (itemActual.cantidadOriginal || 0) > 0 ||
      (itemActual.cantidadNueva || 0) > 0 ||
      (itemActual.precioUnitario || 0) > 0;

    if (tieneValores) {
      const confirmar = window.confirm(
        `El ítem "${itemActual.numero || index + 1}" contiene cantidades o precio cargado.\n\n¿Desea fusionar su descripción con el ítem anterior ("${itemAnterior.numero}") y eliminar esta fila?`
      );
      if (!confirmar) return;
    }

    const descFusionada = `${itemAnterior.descripcion.trim()} ${itemActual.descripcion.trim()}`.trim();
    const nuevosItems = itemsCalculados.map((c) => ({ ...c.item }));
    nuevosItems[index - 1].descripcion = descFusionada;
    nuevosItems.splice(index, 1);
    onActualizarItems(nuevosItems, reconciliacion);
  };

  const handleAvanzarPaso2 = () => {
    if (reconciliacion && !reconciliacion.reconciliado) {
      const confirmar = window.confirm(
        'ADVERTENCIA: El Cuadro Modificatorio presenta diferencias respecto a los totales oficiales del pie del documento.\n\n¿Desea avanzar al Plan de Trabajo de todas formas?'
      );
      if (!confirmar) return;
    }
    onIrAPaso2();
  };

  const badgeTipoAlteracion = (tipo: ItemCalculado['tipoAlteracion']) => {
    switch (tipo) {
      case 'titulo':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-800 tracking-wider">
            Rubro
          </span>
        );
      case 'item_nuevo':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
            + Ítem Nuevo
          </span>
        );
      case 'suprimido':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-300">
            Suprimido (CV=0)
          </span>
        );
      case 'disminuido':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
            Disminuido
          </span>
        );
      case 'adicional_item':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-300">
            + Aumento
          </span>
        );
      case 'sin_cambio':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
            Sin variación
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ============================================================== */}
      {/* MÓDULO 1: ZONA DE CARGA DRAG & DROP DEL CUADRO MODIFICATORIO    */}
      {/* ============================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center">
              <UploadCloud className="w-4 h-4 mr-1.5 text-blue-600" />
              Importador Inteligente de "Cuadro Modificatorio" (.xlsx)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Arrastrá el archivo oficial o convertidor desde PDF. El motor limpiará encabezados, agrupará rubros y validará la reconciliación matemática.
            </p>
          </div>
          <button
            onClick={handleDescargarPlantilla}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors shadow-2xs"
            title="Descargar plantilla de prueba oficial con el formato del Cuadro Modificatorio"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Descargar Plantilla (.xlsx)
          </button>
        </div>

        {/* Zona Drag & Drop */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            arrastrando
              ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                procesarArchivoExcel(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              {procesandoArchivo ? (
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              ) : (
                <FileSpreadsheet className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {procesandoArchivo
                  ? 'Procesando y validando Cuadro Modificatorio...'
                  : 'Arrastrá tu archivo "Cuadro Modificatorio.xlsx" aquí o hacé clic para explorar'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Mapea automáticamente: Ítems, Cantidades Autorizadas (H), Cantidades Nuevas (CV), P.U. y totales.
              </p>
            </div>
          </div>
        </div>

        {errorCarga && (
          <div className="mt-3 flex items-center p-3 rounded-lg bg-red-50 text-xs text-red-700 border border-red-200">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{errorCarga}</span>
          </div>
        )}

        {/* Tarjeta de Reconciliación Cruzada */}
        {reconciliacion && (
          <div className="mt-4 p-4 rounded-xl border transition-colors bg-white border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    Auditoría y Reconciliación del Cuadro Importado
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Comparación entre los totales leídos en el pie del Excel y la suma real de los ítems.
                  </p>
                </div>
              </div>
              <div>
                {reconciliacion.reconciliado ? (
                  <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Reconciliado 100% con el Cuadro Modificatorio
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 shadow-2xs">
                    <AlertTriangle className="w-4 h-4 mr-1.5 text-red-600" />
                    Alerta: faltan ítems o hay diferencia de {formatMonedaArg(
                      Math.max(
                        Math.abs((reconciliacion.leidoExcel.importesAutorizados || 0) - reconciliacion.calculadoSuma.importesAutorizados),
                        Math.abs((reconciliacion.leidoExcel.importesAAutorizar || 0) - reconciliacion.calculadoSuma.importesAAutorizar)
                      )
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Total Autorizado (Orig.)</span>
                <span className="font-bold font-mono text-slate-900 text-sm">
                  {formatMonedaArg(reconciliacion.calculadoSuma.importesAutorizados)}
                </span>
                {reconciliacion.leidoExcel.importesAutorizados && (
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Excel: {formatMonedaArg(reconciliacion.leidoExcel.importesAutorizados)}
                  </span>
                )}
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Total A Autorizar (Nuevo)</span>
                <span className="font-bold font-mono text-emerald-900 text-sm">
                  {formatMonedaArg(reconciliacion.calculadoSuma.importesAAutorizar)}
                </span>
                {reconciliacion.leidoExcel.importesAAutorizar && (
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Excel: {formatMonedaArg(reconciliacion.leidoExcel.importesAAutorizar)}
                  </span>
                )}
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-amber-700 block">Importe Disminuciones</span>
                <span className="font-bold font-mono text-amber-900 text-sm">
                  {formatMonedaArg(reconciliacion.calculadoSuma.importesDisminuciones)}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-blue-700 block">Importe Aumentos</span>
                <span className="font-bold font-mono text-blue-900 text-sm">
                  {formatMonedaArg(reconciliacion.calculadoSuma.importesAumentos)}
                </span>
              </div>
            </div>

            {reconciliacion.diferencias.length > 0 && (
              <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200 text-amber-800 text-[11px]">
                <strong className="block mb-1">Diferencias detectadas:</strong>
                <ul className="list-disc pl-5 space-y-0.5">
                  {reconciliacion.diferencias.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* DATOS GENERALES DEL EXPEDIENTE Y DE LA OBRA (FOLIO 15/16)      */}
      {/* ============================================================== */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center">
            <Info className="w-4 h-4 mr-1.5 text-blue-600" />
            Carátula Oficial y Datos del Contrato (Área de Alteraciones Contractuales)
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Completa la carátula oficial para el Plan de Trabajo Modelo y el Excel exportable
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nombre de la Obra:
            </label>
            <input
              type="text"
              value={obra.nombre}
              onChange={(e) => onActualizarObra({ nombre: e.target.value })}
              className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              placeholder="Ej: Pavimentación y Desagües Pluviales Bº Confluencia"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Expediente Original:
            </label>
            <input
              type="text"
              value={obra.expedienteOriginal || obra.expediente}
              onChange={(e) =>
                onActualizarObra({
                  expedienteOriginal: e.target.value,
                  expediente: e.target.value,
                })
              }
              className="w-full text-xs font-mono font-medium px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              placeholder="Ej: OE-09407-M-2024"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Expediente Ampliación / Convalidación:
            </label>
            <input
              type="text"
              value={obra.expedienteAmpliacion || ''}
              onChange={(e) => onActualizarObra({ expedienteAmpliacion: e.target.value })}
              className="w-full text-xs font-mono font-medium px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              placeholder="Ej: OE-9407-M-2024 Alc. 1/2025"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Empresa Contratista:
            </label>
            <input
              type="text"
              value={obra.contratista}
              onChange={(e) => onActualizarObra({ contratista: e.target.value })}
              className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              placeholder="Ej: Constructora Patagónica S.A."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Fecha de Inicio de Obra:
            </label>
            <input
              type="text"
              value={obra.fechaInicio || ''}
              onChange={(e) => onActualizarObra({ fechaInicio: e.target.value })}
              className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              placeholder="Ej: 01/03/2024"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Plazo de Obra (días / meses):
            </label>
            <input
              type="text"
              value={obra.plazoObra || `${obra.plazoOriginalMeses} Meses`}
              onChange={(e) => onActualizarObra({ plazoObra: e.target.value })}
              className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              placeholder="Ej: 180 días corridos (6 meses)"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Terminación s/Contrato:
            </label>
            <input
              type="text"
              value={obra.fechaTerminacionContrato || ''}
              onChange={(e) => onActualizarObra({ fechaTerminacionContrato: e.target.value })}
              className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              placeholder="Ej: 28/08/2024"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Terminación con Ampliación / Prórroga:
            </label>
            <input
              type="text"
              value={obra.fechaTerminacionAmpliacion || ''}
              onChange={(e) => onActualizarObra({ fechaTerminacionAmpliacion: e.target.value })}
              className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              placeholder="Ej: 26/10/2024"
            />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BARRA DE ACCIONES DE LA TABLA                                  */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={onAbrirModalPegado}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-2xs"
            title="Pegar columnas copiadas desde Excel o CSV"
          >
            <ClipboardPaste className="w-4 h-4 mr-1.5" />
            Pegado Manual (Portapapeles)
          </button>
          <button
            onClick={() => handleAgregarItem(false)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 mr-1 text-slate-500" />
            Agregar Ítem
          </button>
          <button
            onClick={() => handleAgregarItem(true)}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 mr-1 text-slate-500" />
            Agregar Rubro / Título
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-500">
            Total Ítems: <strong className="text-slate-900">{itemsCalculados.length}</strong>
          </span>
          <button
            onClick={handleAvanzarPaso2}
            className={`inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-2xs ${
              reconciliacion && !reconciliacion.reconciliado
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <span>Ir al Plan de Trabajo (Paso 2)</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TABLA DE ÍTEMS Y PRESUPUESTO (MODIFICADO VS. ORIGINAL)        */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-16 text-center">Nº</th>
                <th className="py-2.5 px-3 min-w-[220px]">Descripción del Ítem</th>
                <th className="py-2.5 px-2 w-14 text-center">Unid.</th>
                <th className="py-2.5 px-3 w-28 text-right">P. Unitario ($)</th>
                <th className="py-2.5 px-3 w-24 text-right bg-blue-50/50">Cant. Original</th>
                <th className="py-2.5 px-3 w-28 text-right bg-blue-50/50">Total Original ($)</th>
                <th className="py-2.5 px-2 w-20 text-right bg-blue-50/50">Incid. Orig</th>
                <th className="py-2.5 px-3 w-24 text-right bg-emerald-50/50">Cant. Nueva Autoriz.</th>
                <th className="py-2.5 px-3 w-28 text-right bg-emerald-50/50">Total Convalidado ($)</th>
                <th className="py-2.5 px-2 w-20 text-right bg-emerald-50/50">Incid. Convalidada</th>
                <th className="py-2.5 px-3 w-28 text-center">Alteración</th>
                <th className="py-2.5 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {itemsCalculados.map((calc, index) => {
                const it = calc.item;
                const isTitle = calc.esTitulo;

                return (
                  <tr
                    key={it.id}
                    className={`transition-colors ${
                      isTitle
                        ? 'bg-slate-100 font-bold text-slate-900'
                        : calc.tipoAlteracion === 'suprimido'
                        ? 'bg-red-50/30 hover:bg-red-50/50'
                        : calc.tipoAlteracion === 'item_nuevo'
                        ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Nº */}
                    <td className="py-1.5 px-3 text-center">
                      <input
                        type="text"
                        value={it.numero}
                        onChange={(e) => handleChangeCell(it.id, 'numero', e.target.value)}
                        className={`w-full text-center px-1 py-1 rounded border text-xs ${
                          isTitle
                            ? 'font-bold bg-transparent border-transparent'
                            : 'border-slate-300 font-mono bg-white'
                        }`}
                      />
                    </td>

                    {/* Descripción con edición detallada y fusión */}
                    <td className="py-1.5 px-3">
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={it.descripcion}
                          onChange={(e) => handleChangeCell(it.id, 'descripcion', e.target.value)}
                          className={`w-full px-2 py-1 rounded border text-xs ${
                            isTitle
                              ? 'font-bold bg-transparent border-transparent text-slate-900'
                              : 'border-slate-300 bg-white text-slate-800'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleAbrirEdicionTexto(it)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors shrink-0"
                          title="Editar descripción detallada"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleFusionarConAnterior(index)}
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors shrink-0"
                            title="Fusionar texto con el ítem anterior (corrige cortes de página de PDF)"
                          >
                            <CornerLeftUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Unidad */}
                    <td className="py-1.5 px-2 text-center">
                      {!isTitle && (
                        <input
                          type="text"
                          value={it.unidad || ''}
                          onChange={(e) => handleChangeCell(it.id, 'unidad', e.target.value)}
                          className="w-full text-center px-1 py-1 rounded border border-slate-300 text-xs bg-white text-slate-600 font-mono uppercase"
                          placeholder="M2"
                        />
                      )}
                    </td>

                    {/* Precio Unitario */}
                    <td className="py-1.5 px-3 text-right">
                      {!isTitle ? (
                        <input
                          type="number"
                          step="0.01"
                          value={it.precioUnitario || ''}
                          onChange={(e) =>
                            handleChangeCell(it.id, 'precioUnitario', parseFloat(e.target.value) || 0)
                          }
                          className="w-full text-right px-2 py-1 rounded border border-slate-300 text-xs font-mono bg-white text-slate-900 font-semibold"
                        />
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>

                    {/* Cantidad Original (H) */}
                    <td className="py-1.5 px-3 text-right bg-blue-50/20">
                      {!isTitle ? (
                        <input
                          type="number"
                          step="0.0001"
                          value={it.cantidadOriginal ?? ''}
                          onChange={(e) =>
                            handleChangeCell(it.id, 'cantidadOriginal', parseFloat(e.target.value) || 0)
                          }
                          className="w-full text-right px-2 py-1 rounded border border-blue-200 text-xs font-mono bg-white text-blue-950 font-semibold"
                        />
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>

                    {/* Total Original ($) */}
                    <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-700 bg-blue-50/20">
                      {!isTitle ? formatMonedaArg(calc.costoItemBasico) : '-'}
                    </td>

                    {/* Incidencia Original */}
                    <td className="py-1.5 px-2 text-right font-mono text-[11px] text-slate-600 bg-blue-50/20">
                      {!isTitle ? formatPorcentaje(calc.incidenciaOriginal, 2) : '-'}
                    </td>

                    {/* Cantidad Nueva (CV) */}
                    <td className="py-1.5 px-3 text-right bg-emerald-50/20">
                      {!isTitle ? (
                        <input
                          type="number"
                          step="0.0001"
                          value={it.cantidadNueva ?? ''}
                          onChange={(e) =>
                            handleChangeCell(it.id, 'cantidadNueva', parseFloat(e.target.value) || 0)
                          }
                          className="w-full text-right px-2 py-1 rounded border border-emerald-300 text-xs font-mono bg-white text-emerald-950 font-semibold"
                        />
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>

                    {/* Total Modificado ($) */}
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900 bg-emerald-50/20">
                      {!isTitle ? formatMonedaArg(calc.costoItemModificado) : '-'}
                    </td>

                    {/* Incidencia Nueva (Criterio Convalidación: Denominador Fijo Monto Original!) */}
                    <td className="py-1.5 px-2 text-right font-mono text-[11px] font-semibold text-slate-700 bg-emerald-50/20">
                      {!isTitle ? formatPorcentaje(calc.incidenciaNueva, 2) : '-'}
                    </td>

                    {/* Estado / Alteración */}
                    <td className="py-1.5 px-3 text-center">
                      {badgeTipoAlteracion(calc.tipoAlteracion)}
                    </td>

                    {/* Acciones */}
                    <td className="py-1.5 px-2 text-center">
                      <button
                        onClick={() => handleEliminarItem(it.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Eliminar fila"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totales del Presupuesto */}
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
              <tr>
                <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider text-xs">
                  Totales Reconciliados:
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-xs text-blue-900">
                  {formatMonedaArg(montoObraOriginal)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-[11px] text-blue-900">
                  100,00%
                </td>
                <td className="py-2.5 px-3"></td>
                <td className="py-2.5 px-3 text-right font-mono text-xs text-emerald-900">
                  {formatMonedaArg(montoObraNuevo)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-[11px] text-emerald-900">
                  {formatPorcentaje(montoObraOriginal > 0 ? montoObraNuevo / montoObraOriginal : 0, 2)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal de Edición Detallada de Descripción */}
      {itemEnEdicion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Editar Descripción - Ítem {itemEnEdicion.numero}
                </h4>
              </div>
              <button
                onClick={() => setItemEnEdicion(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Texto de la Especificación / Denominación:
              </label>
              <textarea
                value={textoEdicion}
                onChange={(e) => setTextoEdicion(e.target.value)}
                rows={6}
                className="w-full text-xs font-medium p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 leading-relaxed font-sans"
                placeholder="Ingrese o pegue el texto completo..."
                autoFocus
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleLimpiarEspaciosEdicion}
                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  title="Eliminar saltos de línea y dobles espacios comunes al copiar desde PDF"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Limpiar saltos de línea de PDF
                </button>
                <span className="text-[11px] text-slate-400 font-mono">
                  {textoEdicion.length} caracteres
                </span>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setItemEnEdicion(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarEdicionTexto}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
              >
                Guardar Descripción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
