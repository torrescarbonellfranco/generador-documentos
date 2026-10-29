'use client';

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HeaderInstitucional from "@/components/HeaderInstitucional";
import { ExpedienteItem, ExpedientesApiResponse } from "@/types/expediente";
import {
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Building2,
  UserCheck,
  Calendar,
  AlertCircle,
  X,
  FileSpreadsheet,
  RotateCcw,
  Clock,
  Layers,
  MapPin,
} from "lucide-react";

export default function RastreadorExpedientesPage() {
  const router = useRouter();

  // Estados de datos
  const [expedientes, setExpedientes] = useState<ExpedienteItem[]>([]);
  const [inspectores, setInspectores] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actualizadoEl, setActualizadoEl] = useState<string | null>(null);

  // Estados de filtros
  const [inspectorSeleccionado, setInspectorSeleccionado] = useState<string>("");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>("todos");
  const [busquedaTexto, setBusquedaTexto] = useState<string>("");

  // Estado del modal de detalle
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState<ExpedienteItem | null>(null);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpedienteSeleccionado(null);
      }
    };
    if (expedienteSeleccionado) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [expedienteSeleccionado]);

  // Carga inicial y refresco de datos
  const cargarExpedientes = async (esRefresco = false) => {
    if (esRefresco) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch("/api/expedientes", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudo sincronizar con la planilla de expedientes.`);
      }

      const data: ExpedientesApiResponse = await res.json();
      setExpedientes(data.expedientes || []);
      setInspectores(data.inspectores || []);
      setActualizadoEl(data.actualizadoEl || new Date().toISOString());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al conectar con la base de datos de Google Sheets";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarExpedientes();
  }, []);

  // Función para restablecer todos los filtros a sus valores predeterminados
  const limpiarFiltros = () => {
    setInspectorSeleccionado("");
    setEstadoSeleccionado("todos");
    setBusquedaTexto("");
  };

  // Lógica de filtrado dinámico
  const expedientesFiltrados = useMemo(() => {
    return expedientes.filter((item) => {
      // 1. Filtro por Inspector: coincidencia inclusiva (contempla obras con inspectores compartidos)
      if (inspectorSeleccionado) {
        const insMatch = item.inspectoresRaw
          .toLowerCase()
          .includes(inspectorSeleccionado.toLowerCase());
        if (!insMatch) return false;
      }

      // 2. Filtro por Estado Calculado
      if (estadoSeleccionado && estadoSeleccionado !== "todos") {
        if (item.estadoCalculado !== estadoSeleccionado) {
          return false;
        }
      }

      // 3. Filtro por Búsqueda de Texto libre (Expediente, Obra, Empresa, Área, etc.)
      if (busquedaTexto.trim()) {
        const query = busquedaTexto.toLowerCase().trim();
        const coincideExpte = item.expediente.toLowerCase().includes(query);
        const coincideAlcance = item.alcance.toLowerCase().includes(query);
        const coincideObra = item.obra.toLowerCase().includes(query);
        const coincideEmpresa = item.empresa.toLowerCase().includes(query);
        const coincideArea = item.area.toLowerCase().includes(query);
        const coincideTipo = item.tipoAlteracion.toLowerCase().includes(query);
        const coincideEstado = item.estadoCalculado.toLowerCase().includes(query);

        if (
          !coincideExpte &&
          !coincideAlcance &&
          !coincideObra &&
          !coincideEmpresa &&
          !coincideArea &&
          !coincideTipo &&
          !coincideEstado
        ) {
          return false;
        }
      }

      return true;
    });
  }, [expedientes, inspectorSeleccionado, estadoSeleccionado, busquedaTexto]);

  // Cálculos de métricas resumidas
  const metricas = useMemo(() => {
    const total = expedientesFiltrados.length;
    const porAprobacion = expedientesFiltrados.filter((e) => e.estadoCalculado === "Por Aprobación").length;
    const porConvalidacion = expedientesFiltrados.filter((e) => e.estadoCalculado === "Por Convalidación").length;
    const porVencer = expedientesFiltrados.filter((e) => e.estadoCalculado === "Por Vencer").length;
    const aprobados = expedientesFiltrados.filter((e) => e.estadoCalculado === "Aprobado").length;
    const paralizadas = expedientesFiltrados.filter((e) => e.estadoCalculado === "Paralizada").length;

    return { total, porAprobacion, porConvalidacion, porVencer, aprobados, paralizadas };
  }, [expedientesFiltrados]);

  // Helper para badges de Área de Ubicación
  const renderBadgeArea = (area: string) => {
    const areaUpper = area.toUpperCase();
    let bgClasses = "bg-slate-100 text-slate-700 border-slate-200";

    if (areaUpper.includes("INSPECC")) {
      bgClasses = "bg-sky-50 text-sky-800 border-sky-200";
    } else if (areaUpper.includes("ALTERACION")) {
      bgClasses = "bg-blue-50 text-[#0038A8] border-blue-200 font-bold";
    } else if (areaUpper.includes("SUBSECRET")) {
      bgClasses = "bg-emerald-50 text-emerald-800 border-emerald-200";
    } else if (areaUpper.includes("AUDITOR")) {
      bgClasses = "bg-amber-50 text-amber-800 border-amber-200";
    } else if (areaUpper.includes("LEGAL")) {
      bgClasses = "bg-purple-50 text-purple-800 border-purple-200";
    } else if (areaUpper.includes("CONTADUR")) {
      bgClasses = "bg-stone-100 text-stone-800 border-stone-200";
    } else if (areaUpper.includes("DESPACHO") || areaUpper.includes("MESA")) {
      bgClasses = "bg-indigo-50 text-indigo-800 border-indigo-200";
    }

    return (
      <span
        className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-md border truncate max-w-full ${bgClasses}`}
        title={area}
      >
        {area}
      </span>
    );
  };

  // Helper para badges de Tipo de Alteración
  const renderBadgeTipo = (tipo: string) => {
    const tipoUpper = tipo.toUpperCase();
    let style = "bg-slate-50 text-slate-700 border-slate-200";

    if (tipoUpper.includes("PARALIZ")) {
      style = "bg-rose-50 text-rose-700 border-rose-200 font-medium";
    } else if (tipoUpper.includes("AMPLIACIÓN") && tipoUpper.includes("VOLUMEN")) {
      style = "bg-purple-50 text-purple-800 border-purple-200 font-semibold";
    } else if (tipoUpper.includes("PLAZO")) {
      style = "bg-blue-50 text-blue-800 border-blue-200 font-medium";
    } else if (tipoUpper.includes("AUMENTO") || tipoUpper.includes("VOLUMEN")) {
      style = "bg-indigo-50 text-indigo-800 border-indigo-200 font-medium";
    } else if (tipoUpper.includes("DISMIN")) {
      style = "bg-amber-50 text-amber-800 border-amber-200 font-medium";
    }

    return (
      <span
        className={`inline-block text-[11px] px-2 py-0.5 rounded-md border truncate max-w-full ${style}`}
        title={tipo}
      >
        {tipo}
      </span>
    );
  };

  // Helper para contador de días en sector
  const renderBadgeDias = (diasRaw: string | number) => {
    if (diasRaw === undefined || diasRaw === null || diasRaw === "" || diasRaw === "-") {
      return <span className="text-slate-400 font-medium">-</span>;
    }
    const dias = typeof diasRaw === "number" ? diasRaw : parseInt(String(diasRaw), 10);
    if (isNaN(dias)) {
      return (
        <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
          {diasRaw}
        </span>
      );
    }
    return (
      <span
        className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium"
        title={`${dias} días de permanencia en el área`}
      >
        {dias}d
      </span>
    );
  };

  // Helper para badges de Estado Calculado
  const renderBadgeEstado = (estado: string) => {
    switch (estado) {
      case "Aprobado":
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 truncate max-w-full"
            title="Aprobado por Norma Legal"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">Aprobado</span>
          </span>
        );
      case "Por Aprobación":
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-300 truncate max-w-full"
            title="En trámite por Aprobación previa"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span className="truncate">Por Aprobación</span>
          </span>
        );
      case "Por Convalidación":
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-300 truncate max-w-full"
            title="En trámite por Convalidación posterior"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
            <span className="truncate">Por Convalidación</span>
          </span>
        );
      case "Por Vencer":
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 truncate max-w-full"
            title="Riesgo de Pasar a Convalidación"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="truncate">Por Vencer</span>
          </span>
        );
      case "Paralizada":
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-300 truncate max-w-full"
            title="Obra Paralizada"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span className="truncate">Paralizada</span>
          </span>
        );
      case "Sin Información":
      default:
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-full"
            title="Sin Información / Colocar Datos"
          >
            <span className="truncate">Sin Información</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Cabecera Institucional Oficial */}
      <HeaderInstitucional
        onGoHome={() => router.push("/")}
        showHomeButton={true}
      />

      <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-6 flex-1 space-y-5">
        {/* Barra superior de navegación y estado en vivo */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0038A8] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Panel Principal (SIGAC)
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sincronización en Tiempo Real &bull; Google Sheets
            </span>

            <button
              type="button"
              onClick={() => cargarExpedientes(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
              title="Actualizar datos desde Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0038A8] ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>

        {/* Encabezado y Presentación del Módulo */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#0038A8] to-[#0096C7] text-white shadow-md shadow-blue-900/15">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1938] tracking-tight">
                Consulta y Rastreo de Expedientes de Obra
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Seguimiento del circuito administrativo oficial por inspector y área de tramitación en tiempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Tarjeta de Filtros */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#0038A8]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#0B1938]">
                Filtros de Búsqueda
              </span>
            </div>
            {actualizadoEl && (
              <span className="text-[11px] text-slate-400 font-medium">
                Última sincronización: {new Date(actualizadoEl).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* 1. Selector de Inspector */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Inspector de Obra
              </label>
              <select
                value={inspectorSeleccionado}
                onChange={(e) => setInspectorSeleccionado(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-semibold focus:border-[#0038A8] focus:ring-2 focus:ring-blue-500/20 transition-all outline-hidden cursor-pointer"
              >
                <option value="">Todos los Inspectores ({inspectores.length})</option>
                {inspectores.map((ins) => (
                  <option key={ins} value={ins}>
                    {ins}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Selector de Estado */}
            <div className="md:col-span-3 space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Estado del Expediente
              </label>
              <select
                value={estadoSeleccionado}
                onChange={(e) => setEstadoSeleccionado(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-semibold focus:border-[#0038A8] focus:ring-2 focus:ring-blue-500/20 transition-all outline-hidden cursor-pointer"
              >
                <option value="todos">Todos los Estados</option>
                <option value="Por Aprobación">Por Aprobación</option>
                <option value="Por Convalidación">Por Convalidación</option>
                <option value="Por Vencer">Por Vencer</option>
                <option value="Paralizada">Paralizada</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Sin Información">Sin Información</option>
              </select>
            </div>

            {/* 3. Búsqueda de Texto Libre */}
            <div className="md:col-span-3 space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Búsqueda Rápida
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={busquedaTexto}
                  onChange={(e) => setBusquedaTexto(e.target.value)}
                  placeholder="Expte, obra, empresa..."
                  className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-medium focus:border-[#0038A8] focus:ring-2 focus:ring-blue-500/20 transition-all outline-hidden"
                />
                {busquedaTexto && (
                  <button
                    type="button"
                    onClick={() => setBusquedaTexto("")}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Borrar texto de búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 4. Botón Limpiar Filtros */}
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={limpiarFiltros}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg px-3 py-2 transition-colors cursor-pointer border border-slate-200"
                title="Restablecer todos los filtros"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Limpiar filtros</span>
              </button>
            </div>
          </div>

          {/* Pastillas de Métricas Resumidas */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                Total
              </span>
              <span className="text-base font-black text-[#0B1938]">
                {metricas.total}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block truncate" title="Por Aprobación">
                Por Aprobación
              </span>
              <span className="text-base font-black text-blue-800">
                {metricas.porAprobacion}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block truncate" title="Por Convalidación">
                Por Convalidación
              </span>
              <span className="text-base font-black text-purple-800">
                {metricas.porConvalidacion}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block truncate" title="Por Vencer">
                Por Vencer
              </span>
              <span className="text-base font-black text-amber-900">
                {metricas.porVencer}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block truncate" title="Paralizada">
                Paralizada
              </span>
              <span className="text-base font-black text-rose-800">
                {metricas.paralizadas}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block truncate" title="Aprobados">
                Aprobados
              </span>
              <span className="text-base font-black text-emerald-800">
                {metricas.aprobados}
              </span>
            </div>
          </div>
        </div>

        {/* Mensaje de Error si falló la API */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold text-xs uppercase tracking-wide block">
                No se pudo sincronizar la información
              </span>
              <p className="text-xs leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={() => cargarExpedientes()}
                className="mt-2 px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Estado de Carga */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <div className="w-9 h-9 border-3 border-[#0038A8] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">
                Consultando planilla oficial de expedientes...
              </p>
              <p className="text-xs text-slate-500">
                Cargando datos publicados en tiempo real desde Google Sheets.
              </p>
            </div>
          </div>
        )}

        {/* Tabla de Resultados 100% Ajustada en Una Sola Pantalla */}
        {!loading && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {expedientesFiltrados.length === 0 ? (
              /* Estado Vacío con Alty */
              <div className="p-10 sm:p-12 text-center max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-orange-100 border-2 border-[#FF7A00] p-1 mx-auto overflow-hidden flex items-center justify-center shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/alty.png"
                    alt="Alty"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-black text-[#0B1938]">
                    No se encontraron expedientes con los criterios seleccionados
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {inspectorSeleccionado
                      ? `No hay expedientes con estado "${estadoSeleccionado}" para el inspector "${inspectorSeleccionado}".`
                      : "Probá cambiando el estado a 'Todos los Estados' o haciendo clic en 'Limpiar filtros'."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar Filtros</span>
                </button>
              </div>
            ) : (
              /* Tabla con datos compacta y sin scroll horizontal */
              <table className="w-full table-fixed text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-black">
                    <th className="py-2.5 px-2 text-left w-[11%]">EXPTE / ALCANCE</th>
                    <th className="py-2.5 px-2 text-left w-[24%]">OBRA</th>
                    <th className="py-2.5 px-2 text-left w-[13%]">EMPRESA</th>
                    <th className="py-2.5 px-2 text-left w-[13%]">TIPO ALTERACIÓN</th>
                    <th className="py-2.5 px-2 text-left w-[11%]">UBICACIÓN</th>
                    <th className="py-2.5 px-2 text-center w-[7%]">DÍAS</th>
                    <th className="py-2.5 px-2 text-left w-[10%]">VENCE EL</th>
                    <th className="py-2.5 px-2 text-left w-[11%]">ESTADO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expedientesFiltrados.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setExpedienteSeleccionado(item)}
                      className="cursor-pointer hover:bg-blue-50/60 transition-colors group"
                      title="Clic para ver detalle completo"
                    >
                      {/* 1. Expte / Alcance (11%) */}
                      <td className="py-2.5 px-2 align-middle">
                        <div
                          className="font-mono font-bold text-slate-900 text-xs truncate"
                          title={item.expediente}
                        >
                          {item.expediente}
                        </div>
                        <div
                          className="text-[10px] text-slate-500 truncate mt-0.5 font-mono"
                          title={item.alcance}
                        >
                          {item.alcance === "NO SOLICITADA" ? "Sin alcance" : item.alcance}
                        </div>
                      </td>

                      {/* 2. Obra (24%) */}
                      <td className="py-2.5 px-2 align-middle">
                        <div
                          className="font-bold text-slate-900 text-xs line-clamp-2 leading-tight group-hover:text-[#0038A8] transition-colors"
                          title={item.obra}
                        >
                          {item.obra}
                        </div>
                        <div
                          className="text-[10px] text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1"
                          title={`Inspector: ${item.inspectoresRaw}`}
                        >
                          <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.inspectoresRaw}</span>
                        </div>
                      </td>

                      {/* 3. Empresa (13%) */}
                      <td className="py-2.5 px-2 align-middle text-slate-700">
                        <div
                          className="font-medium truncate flex items-center gap-1 text-[11px]"
                          title={item.empresa}
                        >
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.empresa}</span>
                        </div>
                      </td>

                      {/* 4. Tipo Alteración (13%) */}
                      <td className="py-2.5 px-2 align-middle">
                        {renderBadgeTipo(item.tipoAlteracion)}
                      </td>

                      {/* 5. Ubicación (11%) */}
                      <td className="py-2.5 px-2 align-middle">
                        {renderBadgeArea(item.area)}
                      </td>

                      {/* 6. Días en el Sector (7%) */}
                      <td className="py-2.5 px-2 align-middle text-center">
                        {renderBadgeDias(item.diasSector)}
                      </td>

                      {/* 7. Vence el (10%) */}
                      <td className="py-2.5 px-2 align-middle text-slate-700 font-mono text-[11px]">
                        {item.fechaVencimiento && item.fechaVencimiento !== "-" ? (
                          <div
                            className="flex items-center gap-1 truncate"
                            title={`Vencimiento ampliado: ${item.fechaVencimiento}`}
                          >
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate font-semibold text-slate-800">
                              {item.fechaVencimiento}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-sans">-</span>
                        )}
                      </td>

                      {/* 8. Estado (11%) */}
                      <td className="py-2.5 px-2 align-middle">
                        {renderBadgeEstado(item.estadoCalculado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* Modal Flotante Limpio y Sobrio al Clickear una Fila */}
      {expedienteSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Fondo oscuro para cerrar al hacer clic afuera */}
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setExpedienteSeleccionado(null)}
            aria-hidden="true"
          />

          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Barra superior de acento */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#0038A8] via-[#00B4D8] to-[#0038A8]" />

            <div className="p-5 sm:p-7 space-y-5">
              {/* Encabezado: Expediente, Alcance y Estado */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xl sm:text-2xl font-black text-[#0B1938]">
                      {expedienteSeleccionado.expediente}
                    </span>
                    {expedienteSeleccionado.alcance && (
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {expedienteSeleccionado.alcance === "NO SOLICITADA"
                          ? "Sin Alcance"
                          : expedienteSeleccionado.alcance}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Ficha de seguimiento de expediente y tramitación administrativa
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {renderBadgeEstado(expedienteSeleccionado.estadoCalculado)}
                  <button
                    type="button"
                    onClick={() => setExpedienteSeleccionado(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Cerrar (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Obra Destacada (texto íntegro sin truncar) */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Obra
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {expedienteSeleccionado.obra}
                </p>
              </div>

              {/* Cuerpo en grilla ordenada (2 columnas) con datos completos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Empresa Contratista */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Empresa Contratista
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 break-words">
                    {expedienteSeleccionado.empresa || "-"}
                  </p>
                </div>

                {/* 2. Inspector(es) asignado(s) */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    Inspector(es) Asignado(s)
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 break-words">
                    {expedienteSeleccionado.inspectoresRaw || "-"}
                  </p>
                </div>

                {/* 3. Tipo de Alteración */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    Tipo de Alteración
                  </span>
                  <div className="pt-0.5">
                    {renderBadgeTipo(expedienteSeleccionado.tipoAlteracion)}
                  </div>
                </div>

                {/* 4. Área de Ubicación Actual */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Área de Ubicación Actual
                  </span>
                  <div className="pt-0.5">
                    {renderBadgeArea(expedienteSeleccionado.area)}
                  </div>
                </div>

                {/* 5. Días en el Área */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Permanencia en el Área
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800">
                    {expedienteSeleccionado.diasSector && expedienteSeleccionado.diasSector !== "-"
                      ? `${expedienteSeleccionado.diasSector} días transcurridos`
                      : "Sin registro"}
                  </p>
                </div>

                {/* 6. Fecha de Finalización Ampliada / Vencimiento */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Fecha Finalización Ampliada
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 font-mono">
                    {expedienteSeleccionado.fechaVencimiento && expedienteSeleccionado.fechaVencimiento !== "-"
                      ? expedienteSeleccionado.fechaVencimiento
                      : "No especificada"}
                  </p>
                </div>
              </div>

              {/* Botón de cierre inferior */}
              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExpedienteSeleccionado(null)}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
