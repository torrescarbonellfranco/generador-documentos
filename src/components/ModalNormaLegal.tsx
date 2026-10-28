"use client";

import React from "react";
import { Scale, X, Clock, FileCheck, ArrowLeft, Wrench } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalNormaLegal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado modal */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 border border-blue-200 flex items-center justify-center text-[#0038A8] shrink-0 shadow-xs">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0096C7] bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
              En Desarrollo
            </span>
            <h3 className="text-xl font-bold text-[#0B1938] mt-1">
              Generador de Norma Legal
            </h3>
          </div>
        </div>

        {/* Contenido / Aviso Institucional */}
        <div className="space-y-4 text-sm text-slate-600 my-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-3">
            <Wrench className="w-5 h-5 text-[#FF7A00] shrink-0 mt-0.5" />
            <p className="font-medium text-xs leading-relaxed">
              Módulo en desarrollo. Próximamente disponible mientras trabajamos en su integración técnica.
            </p>
          </div>

          <p className="leading-relaxed">
            Este módulo permitirá la redacción automática de <strong>Decretos Municipales</strong> y <strong>Resoluciones de Subsecretaría</strong> para la aprobación y convalidación formal de alteraciones de obra, enlazando directamente los antecedentes del expediente.
          </p>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Próximas funcionalidades en desarrollo:
            </h4>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Plantillas automáticas para Decretos de Aprobación y Convalidación.</li>
              <li>Inserción estructurada del cuadro comparativo de variación.</li>
              <li>Generación de vistos y considerandos con base legal municipal.</li>
            </ul>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0038A8] hover:bg-[#002b80] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-900/10 transition-all hover:scale-[1.01]"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la selección de módulos
          </button>
        </div>
      </div>
    </div>
  );
}
