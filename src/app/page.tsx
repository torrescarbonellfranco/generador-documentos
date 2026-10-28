"use client";

import React, { useState } from "react";
import {
  AdendaData,
  TipoAlteracion,
  ModalidadTramite,
  generarYDescargarAdenda,
  generarNombreArchivo,
  ensamblarExpediente,
  OPCIONES_REPRESENTANTE_MUNICIPAL,
} from "@/lib/adendaGenerator";
import { generarYDescargarNormaLegal } from "@/lib/normaGenerator";
import HeaderInstitucional from "@/components/HeaderInstitucional";
import PantallaInicioModulos from "@/components/PantallaInicioModulos";
import ModalNormaLegal from "@/components/ModalNormaLegal";
import CaratulaControlModal from "@/components/CaratulaControlModal";
import AltyAssistant from "@/components/AltyAssistant";
import Step1TipoAlteracion from "@/components/Step1TipoAlteracion";
import Step2Modalidad from "@/components/Step2Modalidad";
import Step3Formulario from "@/components/Step3Formulario";
import ResumenCalculosLateral from "@/components/ResumenCalculosLateral";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  FileSpreadsheet,
} from "lucide-react";

type ModuloActivo = "selector" | "adenda" | "norma";

const DEMO_DATA: AdendaData = {
  tipoAlteracion: "Ampliación de Plazo y Volumen",
  modalidad: "Aprobación",
  obra: "CONSTRUCCIÓN DE RED COLECTORA CLOACAL Y ESTACIÓN DE BOMBEO B° CONFLUENCIA RURAL",
  repMunId: "alejandro",
  repMun:
    "el SECRETARIO DE INFRAESTRUCTURA Y PLANEAMIENTO URBANO, ING. ALEJANDRO ABEL NICOLA, D.N.I. N° 16.076.122, designado mediante Decreto N° 0005/23",
  empresa: "NEUQUÉN VIAL Y CONSTRUCCIONES S.A.",
  cuit: "30-71458921-9",
  cargoRepL: "Presidente",
  repL: "Carlos Alberto Fernández",
  dniRepL: "22.345.678",
  fechaContrato: "2024-03-15",
  normaAdjTipo: "Decreto",
  normaAdjNumero: "0342/2024",
  normaAdj: "Decreto N° 0342/2024",
  fechaNormaAdj: "2024-03-01",
  modalidadContratoTipo: "Licitación Pública",
  modalidadContratoNumero: "08/2023",
  modalidadContrato: "Licitación Pública N° 08/2023",
  aPartirDe: "Acta de Replanteo",
  inspectorObra: "Ing. Mario Roberto Gómez",
  representanteTecnico: "Ing. Jorge Horacio Rossi",
  fechaReplanteo: "2024-04-01",
  fechaVtoOriginal: "2024-09-27",
  expedienteNumero: "6741",
  expedienteAnio: "2024",
  expediente: "OE 6741-M-2024",
  alcance: "0",
  nroCuadro: "1",
  montoOriginal: 85000000,
  plazoOriginalDias: 180,
  diasAmpliacion: 45,
  fechaVtoNueva: "2024-12-26",
  montoAumentos: 15000000,
  montoDisminuciones: 2500000,
  montoVariacion: 12500000,
  variacionesAnteriores: [
    {
      id: "var-1",
      nroVariacion: "Variación 1",
      expedienteNumero: "6741",
      expedienteAnio: "2024",
      expediente: "OE 6741-M-2024",
      alcance: "01/2024",
      tipoAlteracion: "Ampliación de Plazo",
      normaLegalTipo: "Decreto",
      normaLegalNumero: "0412/24",
      normaLegal: "Decreto N° 0412/24",
      fechaNorma: "2024-06-10",
      diasAmpliacion: 30,
      montoAumento: 0,
      montoDisminucion: 0,
    },
    {
      id: "var-2",
      nroVariacion: "Variación 2",
      expedienteNumero: "6741",
      expedienteAnio: "2024",
      expediente: "OE 6741-M-2024",
      alcance: "02/2024",
      tipoAlteracion: "Paralización / Desparalización",
      normaParalizacionTipo: "Disposición",
      normaParalizacionNumero: "14/24",
      normaParalizacion: "Disposición N° 14/24",
      primerDiaParalizacion: "2024-07-01",
      normaReanudacionTipo: "Disposición",
      normaReanudacionNumero: "20/24",
      normaReanudacion: "Disposición N° 20/24",
      fechaReanudacion: "2024-07-16",
      diasParalizacionNetos: 15,
    },
    {
      id: "var-3",
      nroVariacion: "Variación 3",
      expedienteNumero: "6741",
      expedienteAnio: "2024",
      expediente: "OE 6741-M-2024",
      alcance: "03/2024",
      tipoAlteracion: "Modificación de Volumen",
      normaLegalTipo: "Decreto",
      normaLegalNumero: "0689/24",
      normaLegal: "Decreto N° 0689/24",
      fechaNorma: "2024-08-20",
      montoAumento: 5000000,
      montoDisminucion: 0,
    },
  ],
  incluyeItemsNuevos: true,
  comunicacionesObra: [
    {
      id: "com-1",
      tipo: "Nota de Pedido",
      numero: "3",
      textoOriginal:
        "La empresa contratista informa la necesidad de extensión de la cantidad de ítems prevista, en virtud de la ejecución de trabajos adicionales requeridos durante el desarrollo de la obra.",
      textoConsiderando:
        "Que mediante Nota de Pedido N° 3, la empresa contratista informó a la Inspección de Obra la necesidad de extensión de la cantidad de ítems prevista, en virtud de la ejecución de trabajos adicionales requeridos durante el desarrollo de la obra;",
    },
    {
      id: "com-2",
      tipo: "Orden de Servicio",
      numero: "5",
      textoOriginal:
        "Se otorga conformidad a lo manifestado en la citada Nota de Pedido N° 3, aprobando la incorporación de los ítems adicionales solicitados.",
      textoConsiderando:
        "Que mediante Orden de Servicio N° 5, la Inspección de Obra otorgó conformidad a lo manifestado en la citada Nota de Pedido N° 3, aprobando la incorporación de los ítems adicionales solicitados;",
    },
    {
      id: "com-3",
      tipo: "Nota de Pedido",
      numero: "4",
      textoOriginal:
        "La contratista solicita una ampliación del plazo de obra de cuarenta y cinco (45) días corridos a fin de ejecutar los trabajos adicionales aprobados.",
      textoConsiderando:
        "Que mediante Nota de Pedido N° 4, la empresa contratista solicitó a la Inspección de Obra una ampliación del plazo de obra de cuarenta y cinco (45) días corridos a fin de ejecutar los trabajos adicionales aprobados;",
    },
    {
      id: "com-4",
      tipo: "Orden de Servicio",
      numero: "7",
      textoOriginal:
        "La Inspección de Obra otorgó conformidad a la ampliación de plazo requerida e informó el inicio de las actuaciones para la alteración contractual.",
      textoConsiderando:
        "Que mediante Orden de Servicio N° 7, la Inspección de Obra otorgó conformidad a la ampliación de plazo requerida e informó que procederá a iniciar las actuaciones correspondientes para la tramitación del expediente de alteración contractual;",
    },
  ],
};

const INITIAL_DATA: AdendaData = {
  tipoAlteracion: "Ampliación de Plazo y Volumen",
  modalidad: "Aprobación",
  obra: "",
  repMunId: "viviana",
  repMun:
    "la SUBSECRETARIA DE GESTIÓN DE CONTRATACIONES DE OBRAS PÚBLICAS, CRA. MIRTA VIVIANA DEN HARTOG, D.N.I N° 26.476.872, designada mediante Decreto N°00031/23",
  empresa: "",
  cuit: "",
  cargoRepL: "",
  repL: "",
  dniRepL: "",
  fechaContrato: "",
  normaAdjTipo: "Decreto",
  normaAdjNumero: "",
  normaAdj: "",
  fechaNormaAdj: "",
  modalidadContratoTipo: "Licitación Pública",
  modalidadContratoNumero: "",
  modalidadContrato: "",
  aPartirDe: "Acta de Replanteo",
  inspectorObra: "",
  representanteTecnico: "",
  fechaReplanteo: "",
  fechaVtoOriginal: "",
  expedienteNumero: "",
  expedienteAnio: String(new Date().getFullYear()),
  expediente: "",
  alcance: "0",
  nroCuadro: "1",
  montoOriginal: 0,
  plazoOriginalDias: 0,
  diasAmpliacion: 0,
  fechaVtoNueva: "",
  montoAumentos: 0,
  montoDisminuciones: 0,
  montoVariacion: 0,
  variacionesAnteriores: [],
  incluyeItemsNuevos: true,
  comunicacionesObra: [],
};

export default function HomePage() {
  const [moduloActivo, setModuloActivo] = useState<ModuloActivo>("selector");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<AdendaData>(INITIAL_DATA);
  const [isModalNormaOpen, setIsModalNormaOpen] = useState<boolean>(false);
  const [isCaratulaOpen, setIsCaratulaOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [successFile, setSuccessFile] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateFormData = (patch: Partial<AdendaData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    if (patch.tipoAlteracion || patch.modalidad) {
      setSuccessFile(null);
      setErrorMessage(null);
    }
  };

  const handleLoadDemo = () => {
    setFormData((prev) => ({
      ...DEMO_DATA,
      tipoAlteracion: prev.tipoAlteracion,
      modalidad: prev.modalidad,
    }));
    setSuccessFile(null);
    setErrorMessage(null);
  };

  const handleDescargar = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessFile(null);

    try {
      if (!formData.obra) {
        throw new Error("Por favor ingrese el Nombre de la Obra en la Sección 1.");
      }
      const expResuelto =
        formData.expediente ||
        (formData.expedienteNumero
          ? ensamblarExpediente(formData.expedienteNumero, formData.expedienteAnio || "")
          : "");
      if (!expResuelto) {
        throw new Error("Por favor ingrese el N° de Expediente en la Sección 2.");
      }

      await generarYDescargarAdenda(formData);
      const nombreGenerado = generarNombreArchivo(
        expResuelto,
        formData.alcance
      );
      setSuccessFile(nombreGenerado);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido al generar la adenda.";
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDescargarNormaLegal = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessFile(null);

    try {
      if (!formData.obra) {
        throw new Error("Por favor ingrese el Nombre de la Obra en la Sección 1.");
      }
      const expResuelto =
        formData.expediente ||
        (formData.expedienteNumero
          ? ensamblarExpediente(formData.expedienteNumero, formData.expedienteAnio || "")
          : "");
      if (!expResuelto) {
        throw new Error("Por favor ingrese el N° de Expediente en la Sección 2.");
      }

      const res = await generarYDescargarNormaLegal(formData);
      setSuccessFile(res.fileName);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error desconocido al generar el proyecto de norma legal.";
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const stepsList = [
    { num: 1, title: "Tipo de Alteración", desc: formData.tipoAlteracion },
    { num: 2, title: "Modalidad", desc: formData.modalidad },
    { num: 3, title: "Datos y Cálculos", desc: "3 Secciones consecutivas" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Cabecera Institucional Oficial */}
      <HeaderInstitucional
        onGoHome={() => {
          setModuloActivo("selector");
          setCurrentStep(1);
        }}
        showHomeButton={moduloActivo !== "selector"}
        onLoadDemo={
          (moduloActivo === "adenda" || moduloActivo === "norma") && currentStep === 3
            ? handleLoadDemo
            : undefined
        }
      />

      {/* Contenido Dinámico */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* PANTALLA INICIAL: SELECTOR DE MÓDULOS */}
        {moduloActivo === "selector" && (
          <div className="space-y-6">
            <AltyAssistant currentStep={0} />
            <PantallaInicioModulos
              onSelectModuloAdenda={() => {
                setModuloActivo("adenda");
                setCurrentStep(1);
              }}
              onSelectModuloNorma={() => {
                setModuloActivo("norma");
                setCurrentStep(1);
              }}
            />
          </div>
        )}

        {/* FLUJO DE PROYECTO: 3 PASOS (ADENDA O NORMA LEGAL) */}
        {(moduloActivo === "adenda" || moduloActivo === "norma") && (
          <div className="space-y-6">
            {/* Barra superior de navegación y acceso a Carátula */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setModuloActivo("selector")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0038A8] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al selector de proyectos
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCaratulaOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-2xs transition-all hover:scale-[1.02]"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-300" />
                  Ver Carátula de Control (PDF)
                </button>
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                  Módulo:{" "}
                  <strong
                    className={
                      moduloActivo === "norma" ? "text-[#0096C7]" : "text-[#0038A8]"
                    }
                  >
                    {moduloActivo === "norma"
                      ? "Proyecto de Norma Legal (Decreto / Resolución)"
                      : "Proyecto de Adenda"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Asistente Alty Contextual según el paso actual */}
            <AltyAssistant
              currentStep={currentStep}
              customMessage={
                moduloActivo === "norma"
                  ? currentStep === 1
                    ? "¡Hola! Seleccioná el tipo de alteración para el proyecto de norma legal. Recordá que si es una ampliación de plazo pura, la competencia corresponde por Resolución de Secretaría."
                    : currentStep === 2
                    ? "Definí si la norma legal aprueba previamente la alteración o convalida actuaciones de una obra ya ejecutada o vencida."
                    : "Completá los datos de la obra. Evaluaremos automáticamente si la norma a dictar debe ser un Decreto Municipal o una Resolución de Secretaría según la Ley 687."
                  : undefined
              }
            />

            {/* Banner de Feedback si se generó con éxito */}
            {successFile && (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 text-sm">
                      ¡Adenda generada y descargada exitosamente!
                    </h4>
                    <p className="text-xs text-emerald-700 font-mono mt-0.5">
                      Archivo: {successFile}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessFile(null)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}

            {/* Banner de Error si falló algo */}
            {errorMessage && (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-100 text-red-700">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-950 text-sm">
                      Atención al generar la adenda
                    </h4>
                    <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-xs font-semibold text-red-700 hover:text-red-900 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}

            {/* Stepper Header (Wizard) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stepsList.map((step) => {
                  const isActive = currentStep === step.num;
                  const isPast = currentStep > step.num;

                  return (
                    <button
                      key={step.num}
                      type="button"
                      onClick={() => setCurrentStep(step.num)}
                      className={`flex items-center gap-3.5 p-3 rounded-xl transition-all text-left ${
                        isActive
                          ? "bg-blue-50/80 border border-blue-200 ring-2 ring-blue-500/20"
                          : isPast
                          ? "hover:bg-slate-50 cursor-pointer"
                          : "opacity-60 cursor-pointer hover:opacity-90"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                          isActive
                            ? "bg-[#0038A8] text-white shadow-sm shadow-blue-500/30"
                            : isPast
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isPast ? <CheckCircle2 className="w-5 h-5" /> : step.num}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Paso {step.num}
                        </span>
                        <span className="block text-sm font-bold text-[#0B1938] truncate">
                          {step.title}
                        </span>
                        <span className="block text-xs text-slate-500 truncate">
                          {step.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid Principal: Paso Activo + Tarjeta Lateral de Cálculos */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Columna Principal (Pasos 1, 2 ó 3) */}
              <div className="lg:col-span-8 space-y-6">
                {currentStep === 1 && (
                  <Step1TipoAlteracion
                    tipoSeleccionado={formData.tipoAlteracion}
                    onSelect={(tipo) => updateFormData({ tipoAlteracion: tipo })}
                    onNext={() => setCurrentStep(2)}
                  />
                )}

                {currentStep === 2 && (
                  <Step2Modalidad
                    modalidadSeleccionada={formData.modalidad}
                    onSelect={(mod) => updateFormData({ modalidad: mod })}
                    onPrev={() => setCurrentStep(1)}
                    onNext={() => setCurrentStep(3)}
                  />
                )}

                {currentStep === 3 && (
                  <Step3Formulario
                    data={formData}
                    onChange={updateFormData}
                    onPrev={() => setCurrentStep(2)}
                    onLoadDemo={handleLoadDemo}
                    onOpenCaratula={() => setIsCaratulaOpen(true)}
                  />
                )}
              </div>

              {/* Columna Lateral (Sidebar de Cálculos en Tiempo Real) */}
              <div className="lg:col-span-4">
                <ResumenCalculosLateral
                  data={formData}
                  isGenerating={isGenerating}
                  moduloActivo={moduloActivo}
                  onGenerar={handleDescargar}
                  onGenerarNorma={handleDescargarNormaLegal}
                  onOpenCaratula={() => setIsCaratulaOpen(true)}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal para Módulo de Norma Legal en Desarrollo */}
      <ModalNormaLegal
        isOpen={isModalNormaOpen}
        onClose={() => setIsModalNormaOpen(false)}
      />

      {/* Modal / Vista Imprimible de Carátula de Control de Expediente */}
      <CaratulaControlModal
        isOpen={isCaratulaOpen}
        onClose={() => setIsCaratulaOpen(false)}
        data={formData}
      />

      {/* Footer Institucional */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 print:hidden">
        <p className="font-semibold text-slate-700">
          Municipalidad de Neuquén &bull; Subsecretaría de Gestión de Contrataciones de Obras Públicas
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Planilla oficial &quot;Seguimiento Variación Contractual.xlsx&quot; &bull; Generador de Proyectos de Adenda &bull; Documentos Word (.docx)
        </p>
      </footer>
    </div>
  );
}
