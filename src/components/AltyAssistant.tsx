"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MessageSquare, X, ChevronRight, Sparkles } from "lucide-react";

interface AltyProps {
  currentStep?: number; // 0 para pantalla de bienvenida, 1, 2, 3 para los pasos
  customMessage?: string;
}

const ALTY_MESSAGES: Record<number, { title: string; text: string }> = {
  0: {
    title: "¡Bienvenido al SIGAC!",
    text: "¡Hola! Soy Alty, tu asistente en contrataciones. Seleccioná el módulo de trabajo que necesitás para comenzar la redacción automática o la asistencia del expediente.",
  },
  1: {
    title: "Consejo de Alty para el Paso 1",
    text: "¡Hola! Seleccioná qué aspectos del contrato se modifican. Si cambia el monto y el plazo al mismo tiempo, elegí una de las opciones combinadas.",
  },
  2: {
    title: "Consejo de Alty para el Paso 2",
    text: "Recordá: si la obra ya finalizó o los plazos vencieron de hecho, corresponde Convalidación. Si los plazos siguen vigentes, tramita por Aprobación.",
  },
  3: {
    title: "Consejo de Alty para el Paso 3",
    text: "Completá los datos del contrato y expediente. Acordate que el nuevo monto contractual, el porcentaje de incidencia y la garantía del 5% te los calculo yo automáticamente.",
  },
};

export default function AltyAssistant({ currentStep = 1, customMessage }: AltyProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);

  const currentInfo = ALTY_MESSAGES[currentStep] || ALTY_MESSAGES[1];
  const mensajeTexto = customMessage || currentInfo.text;

  return (
    <>
      {/* 1. Banner contextual integrado en la parte superior del contenido */}
      {!isDismissed && (
        <div className="relative bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-blue-50/50 rounded-2xl border-2 border-[#FF7A00]/30 p-4 shadow-sm transition-all animate-in fade-in slide-in-from-top-1">
          <div className="flex items-start gap-3.5">
            {/* Avatar Alty */}
            <div className="relative w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-b from-orange-100 to-amber-200 border-2 border-[#FF7A00] p-0.5 overflow-hidden shadow-sm flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/alty.png"
                alt="Alty - Asistente Virtual"
                className="w-full h-full object-contain translate-y-0.5"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            {/* Bocadillo de diálogo / Mensaje */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#FF7A00] text-white tracking-wide uppercase">
                  Alty te acompaña
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  &bull; Asistente Municipal
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                {mensajeTexto}
              </p>
            </div>

            {/* Botón para minimizar o descartar */}
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
              title="Minimizar consejo de Alty"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Botón flotante de Alty en la esquina inferior derecha para soporte permanente */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {isFloatingOpen && (
          <div className="bg-white rounded-2xl border-2 border-[#FF7A00] shadow-xl p-4 max-w-sm w-80 animate-in fade-in slide-in-from-bottom-2 text-left mb-1">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/alty.png" alt="Alty" className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-xs text-[#0B1938]">Alty Responde</span>
              </div>
              <button
                type="button"
                onClick={() => setIsFloatingOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{mensajeTexto}</p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsDismissed(false);
                  setIsFloatingOpen(false);
                }}
                className="text-[11px] font-semibold text-[#0038A8] hover:underline inline-flex items-center gap-1"
              >
                Restaurar banner arriba <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Botón flotante redondo */}
        <button
          type="button"
          onClick={() => {
            if (isDismissed) setIsDismissed(false);
            else setIsFloatingOpen(!isFloatingOpen);
          }}
          className="group relative flex items-center gap-2.5 px-3 py-2 bg-white hover:bg-orange-50 border-2 border-[#FF7A00] rounded-full shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
          title="Consultar al asistente Alty"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-b from-orange-100 to-amber-200 overflow-hidden border border-[#FF7A00]/40 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/alty.png" alt="Alty" className="w-full h-full object-contain translate-y-0.5" />
          </div>
          <span className="text-xs font-bold text-[#0B1938] pr-1 group-hover:text-[#FF7A00] transition-colors">
            Alty
          </span>
          <span className="w-2 h-2 rounded-full bg-[#FF7A00] animate-pulse" />
        </button>
      </div>
    </>
  );
}
