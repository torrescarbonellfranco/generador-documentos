'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  TrendingUp,
  Sliders,
  CheckCircle2,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  ClipboardPaste,
} from 'lucide-react';
import { HeaderNav } from '@/modules/plan-convalidacion/components/HeaderNav';
import { SummaryKPIs } from '@/modules/plan-convalidacion/components/SummaryKPIs';
import { Step1Presupuesto } from '@/modules/plan-convalidacion/components/Step1Presupuesto';
import { Step2PlanTrabajo } from '@/modules/plan-convalidacion/components/Step2PlanTrabajo';
import { Step3CurvaInversion } from '@/modules/plan-convalidacion/components/Step3CurvaInversion';
import { PasteModal } from '@/modules/plan-convalidacion/components/PasteModal';
import { VerificationModal } from '@/modules/plan-convalidacion/components/VerificationModal';
import { demoEscenarioC, DemoProject } from '@/modules/plan-convalidacion/lib/demoData';
import {
  calcularConvalidacion,
  autocompletarSaldosCierre,
  ajustarCantidadesAlTope,
} from '@/modules/plan-convalidacion/lib/convalidacionEngine';
import {
  ItemContrato,
  ObraGeneral,
  MesConfig,
  ReconciliacionCuadro,
  PlanConvalidacionState,
  PlanConvalidacionMetadata,
} from '@/modules/plan-convalidacion/types/convalidacion';

export interface PlanConvalidacionAppProps {
  initialState?: PlanConvalidacionState;
  prefillMetadata?: PlanConvalidacionMetadata;
  onStateChange?: (state: PlanConvalidacionState) => void;
  onVolver?: () => void;
  estadoGuardado?: 'guardado' | 'pendiente' | 'guardando' | 'error';
  ultimaGuardada?: Date | null;
  onGuardar?: () => void;
}

export function PlanConvalidacionApp({
  initialState,
  prefillMetadata,
  onStateChange,
  onVolver,
  estadoGuardado,
  ultimaGuardada,
  onGuardar,
}: PlanConvalidacionAppProps) {
  const planIdRef = useRef<string>(
    initialState?.id || `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  );
  const fechaCreacionRef = useRef<string>(
    initialState?.fechaCreacion || new Date().toISOString()
  );

  // Inicialización inteligente del estado
  const initialData = useMemo(() => {
    if (initialState) {
      return {
        obra: initialState.obra,
        items: initialState.items,
        mesesConfig: initialState.mesesConfig,
        reconciliacion: initialState.reconciliacion,
        pasoActivo: initialState.pasoActivo || 1,
      };
    }

    if (prefillMetadata) {
      const expStr =
        prefillMetadata.expedienteAmpliacion ||
        prefillMetadata.expedienteOriginal ||
        prefillMetadata.expedienteId ||
        '';

      const obraPrefill: ObraGeneral = {
        nombre: prefillMetadata.obra || 'Nueva Obra Pública Municipal',
        expediente: expStr,
        expedienteOriginal: prefillMetadata.expedienteOriginal || expStr,
        expedienteAmpliacion: prefillMetadata.expedienteAmpliacion || '',
        contratista: prefillMetadata.empresa || '',
        plazoOriginalMeses: 6,
        cantidadMeses: 6,
        mesFinal: 6,
        fechaInicio: prefillMetadata.fechaInicio || '',
        plazoObra: prefillMetadata.plazoObra || '6 meses',
      };

      const mesesPrefill: MesConfig[] = Array.from({ length: 6 }, (_, i) => ({
        mesNumero: i + 1,
        estado: 'provisorio',
      }));

      return {
        obra: obraPrefill,
        items: [],
        mesesConfig: mesesPrefill,
        reconciliacion: undefined,
        pasoActivo: 1 as 1 | 2 | 3,
      };
    }

    // Por defecto, demo oficial Neuquén Escenario C
    return {
      obra: demoEscenarioC.obra,
      items: demoEscenarioC.items,
      mesesConfig: demoEscenarioC.mesesConfig,
      reconciliacion: undefined,
      pasoActivo: 1 as 1 | 2 | 3,
    };
  }, [initialState, prefillMetadata]);

  // Estado del proyecto
  const [obra, setObra] = useState<ObraGeneral>(initialData.obra);
  const [items, setItems] = useState<ItemContrato[]>(initialData.items);
  const [mesesConfig, setMesesConfig] = useState<MesConfig[]>(initialData.mesesConfig);
  const [reconciliacion, setReconciliacion] = useState<ReconciliacionCuadro | undefined>(
    initialData.reconciliacion
  );

  // Navegación de pasos (1: Cuadro Modificatorio / Presupuesto, 2: Plan de Trabajo, 3: Curva de Inversión)
  const [pasoActivo, setPasoActivo] = useState<1 | 2 | 3>(initialData.pasoActivo);

  // Modales
  const [modalPegadoAbierto, setModalPegadoAbierto] = useState(false);
  const [modalVerifAbierto, setModalVerifAbierto] = useState(false);

  // Notificar cambios de estado hacia el wrapper padre (PlanConvalidacionEditor)
  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    if (onStateChange) {
      onStateChange({
        id: initialState?.id || planIdRef.current,
        expedienteId: prefillMetadata?.expedienteId || initialState?.expedienteId || obra.expediente,
        titulo: initialState?.titulo || obra.nombre || 'Plan de Convalidación',
        fechaCreacion: initialState?.fechaCreacion || fechaCreacionRef.current,
        ultimaModificacion: new Date().toISOString(),
        version: initialState?.version || 1,
        obra,
        items,
        mesesConfig,
        reconciliacion,
        pasoActivo,
      });
    }
  }, [obra, items, mesesConfig, reconciliacion, pasoActivo, onStateChange, initialState, prefillMetadata]);

  // Cálculo de convalidación en tiempo real (puro y memorizado)
  const resultado = useMemo(() => {
    return calcularConvalidacion(items, mesesConfig, obra.mesFinal);
  }, [items, mesesConfig, obra.mesFinal]);

  // Manejo de carga de proyectos demo
  const handleCargarDemo = (demo: DemoProject) => {
    setObra(demo.obra);
    setItems(demo.items);
    setMesesConfig(demo.mesesConfig);
    setReconciliacion(undefined);
  };

  const handleResetear = () => {
    if (window.confirm('¿Desea restablecer todos los datos del proyecto?')) {
      setObra({
        nombre: 'Nueva Obra Pública Municipal',
        expediente: 'OE-0000-M-2024',
        contratista: '',
        plazoOriginalMeses: 6,
        cantidadMeses: 6,
        mesFinal: 6,
      });
      setItems([]);
      setMesesConfig(
        Array.from({ length: 6 }, (_, i) => ({
          mesNumero: i + 1,
          estado: 'provisorio',
        }))
      );
      setReconciliacion(undefined);
      setPasoActivo(1);
    }
  };

  const handleActualizarItems = (
    nuevosItems: ItemContrato[],
    nuevaReconciliacion?: ReconciliacionCuadro
  ) => {
    setItems(nuevosItems);
    if (nuevaReconciliacion !== undefined) {
      setReconciliacion(nuevaReconciliacion);
    }
  };

  // Autocompletar saldos pendientes
  const handleAutocompletarSaldos = () => {
    const nuevosItems = autocompletarSaldosCierre(
      items,
      obra.mesFinal,
      resultado.hayAdicionales
    );
    setItems(nuevosItems);
  };

  // Ajustar cantidades al tope físico contractual
  const handleAjustarTopes = () => {
    const itemsAjustados = ajustarCantidadesAlTope(
      items,
      obra.mesFinal,
      resultado.hayAdicionales
    );
    setItems(itemsAjustados);
  };

  // Importar ítems desde modal de pegado
  const handleImportarItems = (
    nuevosItems: ItemContrato[],
    modo: 'reemplazar' | 'agregar'
  ) => {
    if (modo === 'reemplazar') {
      setItems(nuevosItems);
      setReconciliacion(undefined);
    } else {
      setItems((prev) => [...prev, ...nuevosItems]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* 1. Header con Branding y Acciones Principales */}
      <HeaderNav
        obra={obra}
        resultado={resultado}
        mesesConfig={mesesConfig}
        onCargarDemo={handleCargarDemo}
        onResetear={handleResetear}
        onAbrirVerificacion={() => setModalVerifAbierto(true)}
        onAjustarTopes={handleAjustarTopes}
        onVolver={onVolver}
        estadoGuardado={estadoGuardado}
        ultimaGuardada={ultimaGuardada}
        onGuardar={onGuardar}
      />

      {/* 2. Barra Superior de Resumen (KPIs en tiempo real) */}
      <SummaryKPIs
        obra={obra}
        resultado={resultado}
        onActualizarObra={(patch) => setObra((prev) => ({ ...prev, ...patch }))}
      />

      {/* 3. Pestañas de Navegación de Flujo */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 text-xs font-bold" aria-label="Tabs">
            <button
              onClick={() => setPasoActivo(1)}
              className={`py-3.5 px-1 border-b-2 transition-colors flex items-center space-x-2 ${
                pasoActivo === 1
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-slate-200 text-slate-800">
                1
              </span>
              <span>Paso 1: Importar Cuadro Modificatorio (.xlsx)</span>
              <span className="ml-1 text-[11px] font-normal text-slate-400">
                ({items.length} ítems)
              </span>
            </button>

            <button
              onClick={() => setPasoActivo(2)}
              className={`py-3.5 px-1 border-b-2 transition-colors flex items-center space-x-2 ${
                pasoActivo === 2
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-slate-200 text-slate-800">
                2
              </span>
              <span>Paso 2: Plan de Trabajo y Avances Físicos</span>
              {resultado.saldosFisicosCerrados ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Saldos al 100%" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500" title="Saldos pendientes" />
              )}
            </button>

            <button
              onClick={() => setPasoActivo(3)}
              className={`py-3.5 px-1 border-b-2 transition-colors flex items-center space-x-2 ${
                pasoActivo === 3
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-slate-200 text-slate-800">
                3
              </span>
              <span>Paso 3: Cuadro de Curva de Inversión y Gráfico</span>
            </button>
          </nav>
        </div>
      </div>

      {/* 4. Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {pasoActivo === 1 && (
          <Step1Presupuesto
            obra={obra}
            itemsCalculados={resultado.itemsCalculados}
            montoObraOriginal={resultado.montoObraOriginal}
            montoObraNuevo={resultado.montoObraNuevo}
            reconciliacion={reconciliacion}
            onActualizarItems={handleActualizarItems}
            onActualizarObra={(patch) => setObra((prev) => ({ ...prev, ...patch }))}
            onAbrirModalPegado={() => setModalPegadoAbierto(true)}
            onIrAPaso2={() => setPasoActivo(2)}
          />
        )}

        {pasoActivo === 2 && (
          <Step2PlanTrabajo
            obra={obra}
            resultado={resultado}
            mesesConfig={mesesConfig}
            onActualizarItems={setItems}
            onActualizarMesesConfig={setMesesConfig}
            onAutocompletarSaldos={handleAutocompletarSaldos}
            onIrAPaso1={() => setPasoActivo(1)}
            onIrAPaso3={() => setPasoActivo(3)}
          />
        )}

        {pasoActivo === 3 && (
          <Step3CurvaInversion
            obra={obra}
            resultado={resultado}
            onIrAPaso2={() => setPasoActivo(2)}
          />
        )}
      </main>

      {/* Modales */}
      <PasteModal
        isOpen={modalPegadoAbierto}
        onClose={() => setModalPegadoAbierto(false)}
        onImportarItems={handleImportarItems}
      />

      <VerificationModal
        isOpen={modalVerifAbierto}
        onClose={() => setModalVerifAbierto(false)}
      />
    </div>
  );
}

export default PlanConvalidacionApp;

