'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HeaderInstitucional from '@/components/HeaderInstitucional';
import ModalAuthVerificacion from '@/components/auth/ModalAuthVerificacion';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Copy,
  Trash2,
  Calendar,
  Building2,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Lock,
  Calculator,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import {
  PlanConvalidacionState,
  RegimenPlan,
  obtenerTodosLosPlanes,
  eliminarPlan,
  duplicarPlan,
  crearPlanDesdeDemoOficial,
  guardarPlan,
} from '@/modules/plan-convalidacion';

export default function VerificacionPlanHubPage() {
  const router = useRouter();
  const { isVerificacionAuthenticated, isLoading: authLoading } = useAuth();

  const [planes, setPlanes] = useState<PlanConvalidacionState[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroRegimen, setFiltroRegimen] = useState<'todos' | RegimenPlan>('todos');
  const [mensajeNotificacion, setMensajeNotificacion] = useState<{
    tipo: 'exito' | 'error';
    texto: string;
  } | null>(null);

  const recargarPlanes = () => {
    const todos = obtenerTodosLosPlanes();
    setPlanes(todos);
    setLoading(false);
  };

  useEffect(() => {
    recargarPlanes();

    const handleActualizacion = () => {
      recargarPlanes();
    };

    window.addEventListener('sigac_plan_guardado', handleActualizacion);
    window.addEventListener('sigac_plan_eliminado', handleActualizacion);
    return () => {
      window.removeEventListener('sigac_plan_guardado', handleActualizacion);
      window.removeEventListener('sigac_plan_eliminado', handleActualizacion);
    };
  }, []);

  const mostrarMensaje = (texto: string, tipo: 'exito' | 'error' = 'exito') => {
    setMensajeNotificacion({ texto, tipo });
    setTimeout(() => {
      setMensajeNotificacion(null);
    }, 4000);
  };

  // Filtrado dinámico unificado por Obra, Nº de Expediente o Contratista, y por Régimen
  const planesFiltrados = useMemo(() => {
    return planes.filter((p) => {
      // 1. Filtro por Régimen
      if (filtroRegimen !== 'todos') {
        const reg = p.regimen || 'convalidacion';
        if (reg !== filtroRegimen) return false;
      }

      // 2. Buscador instantáneo por Obra, Nº de Expediente o Contratista
      if (filtroTexto.trim()) {
        const q = filtroTexto.toLowerCase().trim();
        const expte = (
          p.obra?.expediente ||
          p.obra?.expedienteOriginal ||
          p.obra?.expedienteAmpliacion ||
          p.expedienteId ||
          ''
        ).toLowerCase();
        const obra = (p.obra?.nombre || p.titulo || '').toLowerCase();
        const empresa = (p.obra?.contratista || '').toLowerCase();
        return expte.includes(q) || obra.includes(q) || empresa.includes(q);
      }

      return true;
    });
  }, [planes, filtroTexto, filtroRegimen]);

  // Conteos por régimen
  const conteoConvalidacion = useMemo(
    () => planes.filter((p) => (p.regimen || 'convalidacion') === 'convalidacion').length,
    [planes]
  );
  const conteoAprobacion = useMemo(
    () => planes.filter((p) => p.regimen === 'aprobacion').length,
    [planes]
  );

  const handleIngresarConvalidacion = () => {
    const nuevoId = `plan-${Date.now()}`;
    router.push(`/plan-convalidacion/${nuevoId}?regimen=convalidacion&nuevo=true`);
  };

  const handleCargarDemoOficial = (e: React.MouseEvent) => {
    e.stopPropagation();
    const demoPlan = crearPlanDesdeDemoOficial();
    demoPlan.regimen = 'convalidacion';
    guardarPlan(demoPlan);
    recargarPlanes();
    mostrarMensaje('Plan demo oficial de Neuquén (Convalidación) cargado con éxito.');
  };

  const handleDuplicar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const copia = duplicarPlan(id);
    if (copia) {
      recargarPlanes();
      mostrarMensaje(`Nueva revisión creada: "${copia.titulo}".`);
    }
  };

  const handleEliminar = (id: string, titulo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        `¿Está seguro de eliminar el plan "${titulo}"? Esta acción no se puede deshacer.`
      )
    ) {
      eliminarPlan(id);
      recargarPlanes();
      mostrarMensaje('Plan eliminado correctamente del repositorio.');
    }
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* 1. Header Global Oficial Claro de SIGAC */}
      <HeaderInstitucional
        showHomeButton={true}
        onGoHome={() => router.push('/')}
      />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Banner Institucional de Título */}
        <div className="pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#0038A8] border border-blue-200 shadow-2xs">
              <TrendingUp className="w-3.5 h-3.5 text-[#0038A8]" />
              Área de Alteraciones Contractuales &bull; Verificación Técnica
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1938] tracking-tight">
            Verificación de Plan de Trabajo y Curva
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Verificación técnica, control de topes físicos y recalibración oficial de curvas de inversión de obra pública municipal bajo los regímenes de Convalidación y Aprobación.
          </p>
        </div>

        {/* Notificación flotante de confirmación */}
        {mensajeNotificacion && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in ${
              mensajeNotificacion.tipo === 'exito'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {mensajeNotificacion.tipo === 'exito' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{mensajeNotificacion.texto}</span>
            </div>
            <button
              onClick={() => setMensajeNotificacion(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer text-base leading-none"
            >
              &times;
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN SUPERIOR: SELECCIÓN DE SUBMÓDULO (RÉGIMEN DE CÁLCULO)             */}
        {/* ========================================================================= */}
        <section aria-labelledby="submodulos-titulo" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2
                id="submodulos-titulo"
                className="text-lg sm:text-xl font-bold text-[#0B1938]"
              >
                Selección de Submódulo (Régimen de Cálculo)
              </h2>
              <p className="text-xs text-slate-500">
                Elegí el régimen correspondiente al estado de los plazos de la obra para abrir el espacio de trabajo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tarjeta 1 — Por Convalidación (Activo) */}
            <div className="group relative bg-white rounded-3xl border-2 border-blue-200/90 hover:border-[#0038A8] p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:shadow-xl hover:shadow-blue-900/10 transition-all">
              <div>
                {/* Badge superior */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-[#0038A8] text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Disponible
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0038A8]">
                    Submódulo Activo
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0B1938] group-hover:text-[#0038A8] transition-colors">
                    Por Convalidación
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Plan de trabajo y curva de inversión calculados sobre el Monto de Obra Original como denominador fijo, con importación de Cuadro Modificatorio y Fojas de Medición.
                </p>

                {/* Viñetas descriptivas */}
                <div className="space-y-2 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Importación de Cuadro Modificatorio (.xlsx)</strong> con reconciliación de importes.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Fojas de medición y topes físicos</strong> con correlatividad de certificados definitivos.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Exportación oficial a Excel (.xlsx)</strong> con fórmulas vivas del modelo municipal.
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón principal azul */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5 justify-between">
                <button
                  type="button"
                  onClick={handleIngresarConvalidacion}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0038A8] hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer hover:shadow-md"
                >
                  <span>Ingresar a Convalidación &rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={handleCargarDemoOficial}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0038A8] border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
                  title="Cargar el caso oficial de Neuquén Capital (Escenario C)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00B4D8]" />
                  <span>Cargar Ejemplo Oficial</span>
                </button>
              </div>
            </div>

            {/* Tarjeta 2 — Por Aprobación (En Desarrollo) */}
            <div className="relative bg-slate-50/75 rounded-3xl border-2 border-slate-200 p-6 sm:p-7 flex flex-col justify-between shadow-xs cursor-not-allowed opacity-80">
              <div>
                {/* Badge superior */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center shadow-inner">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    En Desarrollo
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Submódulo Normativo
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-600">
                    Por Aprobación
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Plan de trabajo y curva de inversión con recalibración al 100% sobre el monto contractual modificado aprobado.
                </p>

                {/* Viñetas descriptivas */}
                <div className="space-y-2 pt-4 border-t border-slate-200 text-xs text-slate-500">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Recalibración integral al 100%</strong> sobre el nuevo monto contractual.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Proyección de flujos futuros</strong> para trámites en tiempo y forma.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Base de datos unificada</strong> con el repositorio general de SIGAC.
                    </span>
                  </div>
                </div>
              </div>

              {/* Estado visual bloqueado / deshabilitado */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-200/80 text-slate-500 text-xs font-semibold flex items-center justify-center gap-2 select-none"
                  title="Módulo en fase de especificación normativa"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Próximamente (En Desarrollo)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECCIÓN INFERIOR: REPOSITORIO Y BUSCADOR UNIFICADO DE PLANES GUARDADOS    */}
        {/* ========================================================================= */}
        <section aria-labelledby="planes-guardados-titulo" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2
                id="planes-guardados-titulo"
                className="text-lg sm:text-xl font-bold text-[#0B1938]"
              >
                Planes de Trabajo Guardados en SIGAC
              </h2>
              <p className="text-xs text-slate-500">
                Base de datos unificada de planes registrados por obra, número de expediente y contratista.
              </p>
            </div>
          </div>

          {/* Barra de Búsqueda Unificada y Filtro Rápido */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
            {/* Buscador único */}
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                placeholder="Buscar por Obra, Nº de Expediente o Contratista..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0038A8] transition-all"
              />
            </div>

            {/* Filtro rápido por Régimen */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setFiltroRegimen('todos')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filtroRegimen === 'todos'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({planes.length})
              </button>

              <button
                type="button"
                onClick={() => setFiltroRegimen('convalidacion')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroRegimen === 'convalidacion'
                    ? 'bg-[#0038A8] text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-[#0038A8]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                <span>Convalidación ({conteoConvalidacion})</span>
              </button>

              <button
                type="button"
                onClick={() => setFiltroRegimen('aprobacion')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroRegimen === 'aprobacion'
                    ? 'bg-blue-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                <span>Aprobación ({conteoAprobacion})</span>
              </button>
            </div>
          </div>

          {/* Listado de Planes Guardados en SIGAC */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              Cargando planes guardados en SIGAC...
            </div>
          ) : planesFiltrados.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0038A8] flex items-center justify-center mx-auto shadow-2xs">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-800">
                  {filtroTexto || filtroRegimen !== 'todos'
                    ? 'No se encontraron planes con ese criterio de búsqueda'
                    : 'Aún no hay planes guardados en SIGAC'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {filtroTexto || filtroRegimen !== 'todos'
                    ? 'Probá borrando el texto de búsqueda o cambiando el selector de régimen.'
                    : 'Podés iniciar un nuevo plan bajo el régimen de Convalidación o cargar el caso oficial de prueba de Neuquén.'}
                </p>
              </div>
              {!filtroTexto && filtroRegimen === 'todos' && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleIngresarConvalidacion}
                    className="px-4 py-2 rounded-xl bg-[#0038A8] hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    + Iniciar Plan por Convalidación
                  </button>
                  <button
                    type="button"
                    onClick={handleCargarDemoOficial}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200"
                  >
                    Cargar Caso Demo Oficial
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {planesFiltrados.map((plan) => {
                const reg = plan.regimen || 'convalidacion';
                const esConvalidacion = reg === 'convalidacion';
                const expte =
                  plan.obra?.expediente ||
                  plan.obra?.expedienteOriginal ||
                  plan.expedienteId ||
                  'Sin N° Expte';
                const cantItems = plan.items?.length || 0;
                const meses = plan.obra?.cantidadMeses || plan.obra?.plazoOriginalMeses || 6;
                const contratista = plan.obra?.contratista || 'Sin contratista asignado';
                const pctFinal =
                  plan.porcentajeFinal !== undefined
                    ? `${plan.porcentajeFinal.toFixed(2)}%`
                    : null;
                const fechaMod = plan.ultimaModificacion
                  ? new Date(plan.ultimaModificacion).toLocaleDateString([], {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Sin fecha';

                return (
                  <div
                    key={plan.id}
                    onClick={() =>
                      router.push(`/plan-convalidacion/${encodeURIComponent(plan.id)}`)
                    }
                    className="group bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#0038A8] p-5 flex flex-col justify-between shadow-xs hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <div>
                      {/* Fila superior: Badge de Régimen, Versión y Expediente */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${
                              esConvalidacion
                                ? 'bg-blue-50 text-[#0038A8] border-blue-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {esConvalidacion ? 'Convalidación' : 'Aprobación'}
                          </span>

                          {plan.version && plan.version > 1 && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                              Rev. {plan.version}
                            </span>
                          )}
                        </div>

                        <span className="px-2.5 py-1 rounded-md bg-blue-50 text-[#0038A8] border border-blue-200 text-xs font-bold font-mono">
                          {expte}
                        </span>
                      </div>

                      {/* Denominación de la Obra */}
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0038A8] transition-colors line-clamp-2 mb-2 leading-snug">
                        {plan.obra?.nombre || plan.titulo || 'Plan de Trabajo'}
                      </h3>

                      {/* Contratista */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 truncate">
                        <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{contratista}</span>
                      </div>

                      {/* Métricas clave */}
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-slate-600 text-[11px]">
                        <div className="p-2 rounded-lg bg-slate-50 flex flex-col items-center justify-center text-center">
                          <span className="text-[9px] text-slate-400 uppercase font-bold">
                            Ítems
                          </span>
                          <span className="font-bold text-slate-900 mt-0.5">
                            {cantItems}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 flex flex-col items-center justify-center text-center">
                          <span className="text-[9px] text-slate-400 uppercase font-bold">
                            Meses
                          </span>
                          <span className="font-bold text-slate-900 mt-0.5">
                            {meses}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 flex flex-col items-center justify-center text-center">
                          <span className="text-[9px] text-slate-400 uppercase font-bold">
                            % Final
                          </span>
                          <span className="font-bold text-slate-900 font-mono mt-0.5">
                            {pctFinal || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer con fecha y acciones de edición */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400" title="Fecha de última modificación">
                        {fechaMod}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleDuplicar(plan.id, e)}
                          className="px-2 py-1 rounded-lg text-slate-600 hover:text-[#0038A8] hover:bg-blue-50 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Duplicar como nueva revisión"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Duplicar</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) =>
                            handleEliminar(
                              plan.id,
                              plan.obra?.nombre || plan.titulo || expte,
                              e
                            )
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar plan del repositorio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0038A8] text-white text-xs font-bold shadow-2xs group-hover:bg-blue-700 transition-colors ml-1">
                          <span>Abrir</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
