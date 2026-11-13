'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import HeaderInstitucional from '@/components/HeaderInstitucional';
import ModalAuthVerificacion from '@/components/auth/ModalAuthVerificacion';
import { useAuth } from '@/context/AuthContext';
import {
  PlanConvalidacionEditor,
} from '@/modules/plan-convalidacion/PlanConvalidacionEditor';
import {
  PlanConvalidacionState,
  PlanConvalidacionMetadata,
  obtenerPlanPorId,
  obtenerPlanPorExpediente,
  guardarPlan,
  crearPlanInicial,
} from '@/modules/plan-convalidacion';

export default function PlanConvalidacionExpedientePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { isVerificacionAuthenticated, isLoading: authLoading } = useAuth();

  const rawExpteId = (params?.expedienteId as string) || '';
  const decodedExpteId = decodeURIComponent(rawExpteId);

  const [planState, setPlanState] = useState<PlanConvalidacionState | null>(null);
  const [prefill, setPrefill] = useState<PlanConvalidacionMetadata | undefined>();
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    if (!decodedExpteId) return;

    // 1. Buscar si ya existe un plan guardado por ID o por número de expediente
    let planExistente = obtenerPlanPorId(decodedExpteId);
    if (!planExistente) {
      planExistente = obtenerPlanPorExpediente(decodedExpteId);
    }

    if (planExistente) {
      setPlanState(planExistente);
      setCargando(false);
      return;
    }

    // 2. Si no existe, construir prefillMetadata a partir de la URL y los parámetros
    const obraQuery = searchParams.get('obra') || '';
    const empresaQuery = searchParams.get('empresa') || '';
    const montoQuery = searchParams.get('montoOriginal');
    const diasQuery = searchParams.get('dias');
    const regimenQuery = (searchParams.get('regimen') as 'convalidacion' | 'aprobacion') || 'convalidacion';

    let montoNum: number | undefined;
    if (montoQuery) {
      const limpio = montoQuery.replace(/[$\s.]/g, '').replace(',', '.');
      const val = parseFloat(limpio);
      if (!isNaN(val)) montoNum = val;
    }

    const prefillData: PlanConvalidacionMetadata = {
      expedienteId: decodedExpteId,
      expedienteOriginal: decodedExpteId.startsWith('plan-') ? '' : decodedExpteId,
      expedienteAmpliacion: decodedExpteId.startsWith('plan-') ? '' : decodedExpteId,
      obra: obraQuery || undefined,
      empresa: empresaQuery || undefined,
      montoOriginal: montoNum,
      plazoObra: diasQuery ? `${diasQuery} días` : undefined,
      regimen: regimenQuery,
    };

    setPrefill(prefillData);

    // Crear un plan inicial prellenado y persistirlo
    const nuevoPlan = crearPlanInicial(prefillData);
    setPlanState(nuevoPlan);
    setCargando(false);
  }, [decodedExpteId, searchParams]);

  const handleSave = async (state: PlanConvalidacionState) => {
    // Persistir directamente en el almacenamiento de SIGAC
    guardarPlan(state);
    setPlanState(state);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800 text-xs font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-[#0038A8] border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600 font-semibold">
            Verificando autorización de acceso...
          </span>
        </div>
      </div>
    );
  }

  if (!isVerificacionAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <HeaderInstitucional showHomeButton={true} onGoHome={() => router.push('/')} />
        <div className="flex-1 flex items-center justify-center p-4">
          <ModalAuthVerificacion
            isOpen={true}
            onClose={() => router.push('/')}
            onSuccess={() => {}}
          />
        </div>
      </div>
    );
  }

  if (cargando || !planState) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800 text-xs font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-[#0038A8] border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600 font-semibold">
            Cargando módulo de Plan de Trabajo y Curva...
          </span>
        </div>
      </div>
    );
  }

  return (
    <PlanConvalidacionEditor
      initialState={planState}
      prefillMetadata={prefill}
      onSave={handleSave}
      onVolver={() => router.push('/plan-convalidacion')}
    />
  );
}

