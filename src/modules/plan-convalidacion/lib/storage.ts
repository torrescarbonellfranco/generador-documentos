import {
  PlanConvalidacionState,
  PlanConvalidacionMetadata,
  ObraGeneral,
  MesConfig,
} from '@/modules/plan-convalidacion/types/convalidacion';
import { demoEscenarioC } from '@/modules/plan-convalidacion/lib/demoData';
import { calcularConvalidacion } from '@/modules/plan-convalidacion/lib/convalidacionEngine';

const STORAGE_KEY = 'sigac_planes_convalidacion';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Normaliza cadenas de expediente para comparaciones flexibles (elimina espacios y mayúsculas).
 */
export function normalizarExpediente(exp: string | undefined): string {
  if (!exp) return '';
  return exp.replace(/\s+/g, '').toUpperCase().trim();
}

/**
 * Obtiene todos los planes guardados en SIGAC.
 */
export function obtenerTodosLosPlanes(): PlanConvalidacionState[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((p) => ({
        ...p,
        regimen: p.regimen || 'convalidacion',
      }))
      .sort(
        (a, b) =>
          new Date(b.ultimaModificacion || b.fechaCreacion).getTime() -
          new Date(a.ultimaModificacion || a.fechaCreacion).getTime()
      );
  } catch (err) {
    console.error('Error al leer planes guardados de localStorage:', err);
    return [];
  }
}

/**
 * Busca un plan por su ID único.
 */
export function obtenerPlanPorId(id: string): PlanConvalidacionState | null {
  const planes = obtenerTodosLosPlanes();
  return planes.find((p) => p.id === id) || null;
}

/**
 * Busca un plan asociado a un expediente (por ID de expediente o número de carátula).
 */
export function obtenerPlanPorExpediente(
  expedienteOId: string
): PlanConvalidacionState | null {
  if (!expedienteOId) return null;
  const planes = obtenerTodosLosPlanes();
  const searchNorm = normalizarExpediente(expedienteOId);

  // 1. Coincidencia exacta por expedienteId
  const porId = planes.find((p) => p.expedienteId === expedienteOId || p.id === expedienteOId);
  if (porId) return porId;

  // 2. Coincidencia normalizada por número de expediente en obra
  const porExpte = planes.find(
    (p) =>
      normalizarExpediente(p.obra?.expediente) === searchNorm ||
      normalizarExpediente(p.obra?.expedienteOriginal) === searchNorm ||
      normalizarExpediente(p.obra?.expedienteAmpliacion) === searchNorm ||
      normalizarExpediente(p.expedienteId) === searchNorm
  );

  return porExpte || null;
}

/**
 * Guarda o actualiza un plan en SIGAC.
 */
export function guardarPlan(plan: PlanConvalidacionState): void {
  if (!isBrowser()) return;
  try {
    const planes = obtenerTodosLosPlanes();
    const index = planes.findIndex((p) => p.id === plan.id);

    let montoOrig = plan.montoOriginal;
    let montoNuev = plan.montoNuevo;
    let pctFinal = plan.porcentajeFinal;

    if (plan.items && plan.items.length > 0) {
      try {
        const res = calcularConvalidacion(
          plan.items,
          plan.mesesConfig || [],
          plan.obra?.mesFinal || 6
        );
        montoOrig = res.montoObraOriginal;
        montoNuev = res.montoObraNuevo;
        if (res.curva && res.curva.length > 0) {
          const ult = res.curva[res.curva.length - 1];
          pctFinal = Math.round(ult.porcentajeAcumulado * 10000) / 100;
        }
      } catch {
        // Fallback silencioso si el estado está incompleto
      }
    }

    const planActualizado: PlanConvalidacionState = {
      ...plan,
      regimen: plan.regimen || 'convalidacion',
      montoOriginal: montoOrig,
      montoNuevo: montoNuev,
      porcentajeFinal: pctFinal,
      ultimaModificacion: new Date().toISOString(),
      version: plan.version || 1,
    };

    if (index >= 0) {
      planes[index] = planActualizado;
    } else {
      planes.unshift(planActualizado);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(planes));

    // Notificar cambio a componentes suscritos
    window.dispatchEvent(
      new CustomEvent('sigac_plan_guardado', { detail: { planId: plan.id } })
    );
  } catch (err) {
    console.error('Error al guardar plan en localStorage:', err);
    throw err;
  }
}

/**
 * Elimina un plan guardado por su ID.
 */
export function eliminarPlan(id: string): void {
  if (!isBrowser()) return;
  try {
    const planes = obtenerTodosLosPlanes().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(planes));
    window.dispatchEvent(
      new CustomEvent('sigac_plan_eliminado', { detail: { planId: id } })
    );
  } catch (err) {
    console.error('Error al eliminar plan de localStorage:', err);
    throw err;
  }
}

/**
 * Duplica un plan existente como nueva revisión.
 */
export function duplicarPlan(
  id: string,
  nuevoTitulo?: string
): PlanConvalidacionState | null {
  const original = obtenerPlanPorId(id);
  if (!original) return null;

  const versionSiguiente = (original.version || 1) + 1;
  const nuevoId = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const tituloFinal =
    nuevoTitulo ||
    `${original.titulo || original.obra?.nombre || 'Plan de Trabajo'} (Rev. ${versionSiguiente})`;

  const copia: PlanConvalidacionState = {
    ...JSON.parse(JSON.stringify(original)),
    id: nuevoId,
    titulo: tituloFinal,
    version: versionSiguiente,
    fechaCreacion: new Date().toISOString(),
    ultimaModificacion: new Date().toISOString(),
  };

  guardarPlan(copia);
  return copia;
}

/**
 * Crea un plan nuevo prellenado a partir de los metadatos de un expediente de SIGAC.
 */
export function crearPlanInicial(
  prefill?: PlanConvalidacionMetadata
): PlanConvalidacionState {
  const id = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const ahora = new Date().toISOString();

  const mesesPorDefecto: MesConfig[] = Array.from({ length: 6 }, (_, i) => ({
    mesNumero: i + 1,
    estado: 'provisorio',
  }));

  const expNumero =
    prefill?.expedienteAmpliacion ||
    prefill?.expedienteOriginal ||
    prefill?.expedienteId ||
    '';

  const obraPorDefecto: ObraGeneral = {
    nombre: prefill?.obra || 'Nueva Obra Pública Municipal',
    expediente: expNumero,
    expedienteOriginal: prefill?.expedienteOriginal || expNumero,
    expedienteAmpliacion: prefill?.expedienteAmpliacion || '',
    contratista: prefill?.empresa || '',
    fechaInicio: prefill?.fechaInicio || '',
    plazoObra: prefill?.plazoObra || '6 meses',
    plazoOriginalMeses: 6,
    cantidadMeses: 6,
    mesFinal: 6,
  };

  return {
    id,
    expedienteId: prefill?.expedienteId || expNumero,
    titulo: prefill?.obra
      ? `Plan - ${prefill.obra}`
      : expNumero
      ? `Plan Convalidación ${expNumero}`
      : 'Nuevo Plan de Convalidación',
    regimen: prefill?.regimen || 'convalidacion',
    fechaCreacion: ahora,
    ultimaModificacion: ahora,
    version: 1,
    obra: obraPorDefecto,
    items: [],
    mesesConfig: mesesPorDefecto,
    reconciliacion: undefined,
    pasoActivo: 1,
  };
}

/**
 * Crea un plan preconfigurado con el demo oficial de Neuquén (Escenario C).
 */
export function crearPlanDesdeDemoOficial(nombreDemo?: string): PlanConvalidacionState {
  const id = `plan-${Date.now()}-demo`;
  const ahora = new Date().toISOString();

  return {
    id,
    titulo: nombreDemo || demoEscenarioC.nombre,
    regimen: 'convalidacion',
    fechaCreacion: ahora,
    ultimaModificacion: ahora,
    version: 1,
    obra: JSON.parse(JSON.stringify(demoEscenarioC.obra)),
    items: JSON.parse(JSON.stringify(demoEscenarioC.items)),
    mesesConfig: JSON.parse(JSON.stringify(demoEscenarioC.mesesConfig)),
    reconciliacion: undefined,
    pasoActivo: 1,
  };
}

/**
 * Exporta todos los planes guardados como archivo JSON descargable o string.
 */
export function exportarPlanesComoJSON(): string {
  const planes = obtenerTodosLosPlanes();
  return JSON.stringify(planes, null, 2);
}

/**
 * Importa planes desde un archivo JSON (merge o reemplazo).
 */
export function importarPlanesDesdeJSON(
  jsonStr: string
): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, error: 'El archivo no contiene una lista válida de planes' };
    }

    const existentes = obtenerTodosLosPlanes();
    const mapa = new Map<string, PlanConvalidacionState>();
    for (const p of existentes) {
      if (p.id) mapa.set(p.id, p);
    }
    let importados = 0;
    for (const item of parsed) {
      if (item && item.obra && Array.isArray(item.items)) {
        const id = item.id || `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        mapa.set(id, { ...item, id });
        importados++;
      }
    }

    const unificados = Array.from(mapa.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unificados));
    window.dispatchEvent(new CustomEvent('sigac_plan_guardado', { detail: {} }));
    return { success: true, count: importados };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al procesar JSON';
    return { success: false, count: 0, error: msg };
  }
}

