'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import HeaderInstitucional from '@/components/HeaderInstitucional';
import {
  PlanConvalidacionState,
  PlanConvalidacionMetadata,
} from '@/modules/plan-convalidacion/types/convalidacion';
import { PlanConvalidacionApp } from '@/modules/plan-convalidacion/components/PlanConvalidacionApp';

export interface PlanConvalidacionEditorProps {
  initialState?: PlanConvalidacionState;
  prefillMetadata?: PlanConvalidacionMetadata;
  onSave: (state: PlanConvalidacionState) => Promise<void>;
  onVolver?: () => void;
}

type EstadoGuardado = 'guardado' | 'pendiente' | 'guardando' | 'error';

export function PlanConvalidacionEditor({
  initialState,
  prefillMetadata,
  onSave,
  onVolver,
}: PlanConvalidacionEditorProps) {
  const router = useRouter();

  // Guardar referencia del estado actual del plan
  const currentStateRef = useRef<PlanConvalidacionState | null>(initialState || null);
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>(
    initialState ? 'guardado' : 'pendiente'
  );
  const [ultimaGuardada, setUltimaGuardada] = useState<Date | null>(
    initialState?.ultimaModificacion ? new Date(initialState.ultimaModificacion) : null
  );

  // Escuchar actualizaciones del módulo convalidación
  const handleStateChange = useCallback((newState: PlanConvalidacionState) => {
    currentStateRef.current = newState;
    setEstadoGuardado('pendiente');
  }, []);

  // Ejecutar guardado persistente en SIGAC
  const handleGuardar = async () => {
    if (!currentStateRef.current) return;
    try {
      setEstadoGuardado('guardando');
      await onSave(currentStateRef.current);
      setEstadoGuardado('guardado');
      setUltimaGuardada(new Date());
    } catch (err: unknown) {
      console.error('Error al persistir el plan en SIGAC:', err);
      setEstadoGuardado('error');
    }
  };

  // Volver a la pantalla de selección y repositorio (con advertencia si hay cambios pendientes)
  const handleVolver = () => {
    if (estadoGuardado === 'pendiente') {
      const confirmacion = window.confirm(
        'Tenés cambios pendientes de guardado en el Plan de Trabajo. ¿Deseás salir de todos modos sin guardar?'
      );
      if (!confirmacion) return;
    }

    if (onVolver) {
      onVolver();
    } else {
      router.push('/plan-convalidacion');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      {/* 1. Header Global Oficial de SIGAC (Idéntico a Adenda y resto del portal) */}
      <HeaderInstitucional
        showHomeButton={true}
        onGoHome={() => router.push('/')}
      />

      {/* 2. Sub-barra limpia en tonos claros integrada dentro de la aplicación */}
      <div className="flex-1">
        <PlanConvalidacionApp
          initialState={initialState}
          prefillMetadata={prefillMetadata}
          onStateChange={handleStateChange}
          onVolver={handleVolver}
          estadoGuardado={estadoGuardado}
          ultimaGuardada={ultimaGuardada}
          onGuardar={handleGuardar}
        />
      </div>
    </div>
  );
}

export default PlanConvalidacionEditor;
