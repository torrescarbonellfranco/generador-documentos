"use strict";
import React from "react";
import { TipoAlteracion } from "@/lib/adendaGenerator";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Layers,
  SlidersHorizontal,
  CheckCircle2,
  Calendar,
  DollarSign,
  ArrowRight,
} from "lucide-react";

interface Step1Props {
  tipoSeleccionado: TipoAlteracion;
  onSelect: (tipo: TipoAlteracion) => void;
  onNext: () => void;
}

interface TipoCardConfig {
  tipo: TipoAlteracion;
  titulo: string;
  subtitulo: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  incluyePlazo: boolean;
  incluyeMonto: boolean;
  tipoMonto: "aumento" | "disminucion" | "ninguno";
}

const TIPOS_CONFIG: TipoCardConfig[] = [
  {
    tipo: "Ampliación de Plazo",
    titulo: "Ampliación de Plazo",
    subtitulo:
      "Extiende el plazo de ejecución en días corridos sin modificar el monto contractual original.",
    badge: "Solo Plazo",
    badgeColor: "bg-blue-50 text-[#0038A8] border-blue-200",
    icon: Clock,
    iconBg: "bg-blue-100",
    iconColor: "text-[#0038A8]",
    incluyePlazo: true,
    incluyeMonto: false,
    tipoMonto: "ninguno",
  },
  {
    tipo: "Ampliación de Volumen",
    titulo: "Ampliación de Volumen",
    subtitulo:
      "Incrementa las cantidades de obra o suma ítems adicionales, aumentando el monto contractual.",
    badge: "Aumento de Monto",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: TrendingUp,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    incluyePlazo: false,
    incluyeMonto: true,
    tipoMonto: "aumento",
  },
  {
    tipo: "Disminución de Volumen",
    titulo: "Disminución de Volumen",
    subtitulo:
      "Suprime o reduce volúmenes de obra, reduciendo el monto contractual total adjudicado.",
    badge: "Reducción de Monto",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    icon: TrendingDown,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    incluyePlazo: false,
    incluyeMonto: true,
    tipoMonto: "disminucion",
  },
  {
    tipo: "Ampliación de Plazo y Volumen",
    titulo: "Ampliación de Plazo y Volumen",
    subtitulo:
      "Otorga más días corridos para la finalización y simultaneous aumenta el valor del contrato.",
    badge: "Plazo + Aumento",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Layers,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    incluyePlazo: true,
    incluyeMonto: true,
    tipoMonto: "aumento",
  },
  {
    tipo: "Ampliación de Plazo y Disminución de Volumen",
    titulo: "Ampliación de Plazo y Dism. Volumen",
    subtitulo:
      "Extiende el plazo de ejecución compensando o ajustando con una reducción de volumen y monto.",
    badge: "Plazo + Reducción",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    icon: SlidersHorizontal,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    incluyePlazo: true,
    incluyeMonto: true,
    tipoMonto: "disminucion",
  },
];

export default function Step1TipoAlteracion({
  tipoSeleccionado,
  onSelect,
  onNext,
}: Step1Props) {
  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold tracking-wider uppercase text-[#0038A8] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
          Paso 1 de 3
        </span>
        <h2 className="text-2xl font-bold text-[#0B1938] mt-2">
          Seleccione el Tipo de Alteración de Obra
        </h2>
        <p className="text-slate-600 text-sm mt-1">
          La elección determinará la plantilla Word oficial y los campos adaptativos requeridos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TIPOS_CONFIG.map((item) => {
          const isSelected = tipoSeleccionado === item.tipo;
          const Icon = item.icon;

          return (
            <button
              key={item.tipo}
              type="button"
              onClick={() => onSelect(item.tipo)}
              className={`text-left p-5 rounded-2xl border-2 transition-all relative flex flex-col justify-between group ${
                isSelected
                  ? "border-[#0038A8] bg-blue-50/50 shadow-md shadow-blue-900/10 ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${item.iconBg}`}>
                    <Icon className={`w-6 h-6 ${item.iconColor}`} />
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>

                <h3 className="font-semibold text-[#0B1938] text-base mb-1.5 group-hover:text-[#0038A8] transition-colors">
                  {item.titulo}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {item.subtitulo}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-500">
                  {item.incluyePlazo && (
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-[#0038A8]" /> Plazo
                    </span>
                  )}
                  {item.incluyeMonto && (
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Monto
                    </span>
                  )}
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-[#0038A8] text-white"
                      : "border border-slate-300 text-transparent group-hover:border-slate-400"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 fill-current" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0038A8] hover:bg-[#002b80] text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:translate-x-0.5"
        >
          Continuar a Modalidad
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
