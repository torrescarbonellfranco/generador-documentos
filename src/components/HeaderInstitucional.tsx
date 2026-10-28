"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Building, Home, Sparkles } from "lucide-react";

interface HeaderProps {
  onGoHome?: () => void;
  showHomeButton?: boolean;
  onLoadDemo?: () => void;
}

export default function HeaderInstitucional({
  onGoHome,
  showHomeButton = false,
  onLoadDemo,
}: HeaderProps) {
  const [imgError, setImgError] = useState(false);

  // Logo oficial remoto de Neuquén Capital con fallback local
  const logoSrc = imgError
    ? "/neuquen_capital_logo.png"
    : "https://upload.wikimedia.org/wikipedia/commons/a/a4/Neuquen_capital_logo.png";

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Barra de acento institucional superior con colores oficiales */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0038A8] via-[#00B4D8] to-[#0038A8]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Lado izquierdo: Escudo/Logo oficial y títulos */}
        <div className="flex items-center gap-4 min-w-0">
          <div
            onClick={onGoHome}
            className={`flex items-center gap-3 group ${onGoHome ? "cursor-pointer" : ""}`}
            title="Ir al inicio"
          >
            <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center p-1 bg-white rounded-xl border border-slate-100 shadow-xs group-hover:border-blue-200 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt="Municipalidad de Neuquén Capital"
                className="w-full h-full object-contain"
                onError={() => setImgError(true)}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-extrabold text-[#0B1938] tracking-tight group-hover:text-[#0038A8] transition-colors leading-tight">
                  Generador de Proyectos
                </span>
                <span className="hidden md:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0038A8] border border-blue-200">
                  OBRA PÚBLICA
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-xl">
                Subsecretaría de Gestión de Contrataciones de Obras Públicas &bull; Municipalidad de Neuquén
              </p>
            </div>
          </div>
        </div>

        {/* Lado derecho: Acciones y navegación */}
        <div className="flex items-center gap-2.5 shrink-0">
          {showHomeButton && onGoHome && (
            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Volver a la selección de módulos"
            >
              <Home className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Inicio</span>
            </button>
          )}

          {onLoadDemo && (
            <button
              type="button"
              onClick={onLoadDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0038A8] border border-blue-200 transition-colors"
              title="Cargar valores de prueba en el formulario"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00B4D8]" />
              <span className="hidden sm:inline">Cargar</span> Demo
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-500">
              Sistema Activo
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
