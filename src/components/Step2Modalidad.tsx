"use strict";
import React from "react";
import { ModalidadTramite } from "@/lib/adendaGenerator";
import { ShieldCheck, History, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";

interface Step2Props {
  modalidadSeleccionada: ModalidadTramite;
  onSelect: (modalidad: ModalidadTramite) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function Step2Modalidad({
  modalidadSeleccionada,
  onSelect,
  onPrev,
  onNext,
}: Step2Props) {
  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold tracking-wider uppercase text-[#0038A8] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
          Paso 2 de 3
        </span>
        <h2 className="text-2xl font-bold text-[#0B1938] mt-2">
          Seleccione la Modalidad del Trámite
        </h2>
        <p className="text-slate-600 text-sm mt-1">
          La modalidad define la redacción jurídica de los considerandos y el régimen de cómputo temporal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aprobación */}
        <button
          type="button"
          onClick={() => onSelect("Aprobación")}
          className={`text-left p-6 rounded-2xl border-2 transition-all relative flex flex-col justify-between group ${
            modalidadSeleccionada === "Aprobación"
              ? "border-[#0038A8] bg-blue-50/40 shadow-md shadow-blue-900/10 ring-2 ring-blue-500/20"
              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100 text-[#0038A8]">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-[#0038A8] border border-blue-200">
                Trámite Previo (Ex-Ante)
              </span>
            </div>

            <h3 className="font-bold text-[#0B1938] text-lg mb-2 group-hover:text-[#0038A8] transition-colors">
              Aprobación
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Aplica a modificaciones tramitadas con antelación a su ejecución o vencimiento original, fijando una nueva fecha prevista.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Plantilla: <code>Aprobación/</code>
            </span>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                modalidadSeleccionada === "Aprobación"
                  ? "bg-[#0038A8] text-white"
                  : "border border-slate-300 text-transparent group-hover:border-slate-400"
              }`}
            >
              <CheckCircle2 className="w-5 h-5 fill-current" />
            </div>
          </div>
        </button>

        {/* Convalidación */}
        <button
          type="button"
          onClick={() => onSelect("Convalidación")}
          className={`text-left p-6 rounded-2xl border-2 transition-all relative flex flex-col justify-between group ${
            modalidadSeleccionada === "Convalidación"
              ? "border-[#0096C7] bg-cyan-50/30 shadow-md shadow-cyan-900/10 ring-2 ring-cyan-500/20"
              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-cyan-100 text-[#0096C7]">
                <History className="w-7 h-7" />
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-100 text-[#0096C7] border border-cyan-200">
                Trámite Posterior (Ex-Post)
              </span>
            </div>

            <h3 className="font-bold text-[#0B1938] text-lg mb-2 group-hover:text-[#0096C7] transition-colors">
              Convalidación
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Aplica a modificaciones o extensiones de plazo donde los trabajos ya fueron realizados o el plazo ya transcurrió de hecho.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Plantilla: <code>Convalidación/</code>
            </span>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                modalidadSeleccionada === "Convalidación"
                  ? "bg-[#0096C7] text-white"
                  : "border border-slate-300 text-transparent group-hover:border-slate-400"
              }`}
            >
              <CheckCircle2 className="w-5 h-5 fill-current" />
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Tipo de Alteración
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0038A8] hover:bg-[#002b80] text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:translate-x-0.5"
        >
          Continuar al Formulario
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
