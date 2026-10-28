"use strict";

import React, { useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { AdendaData, calcularValoresAdenda } from "@/lib/adendaGenerator";
import {
  formatearMoneda,
  montoALetras,
  diasALetras,
  formatearPorcentaje,
  formatearFechaCorta,
  formatearFechaTexto,
} from "@/lib/formatters";
import { FileDown, Loader2, X, FileSpreadsheet } from "lucide-react";

interface CaratulaProps {
  isOpen: boolean;
  onClose: () => void;
  data: AdendaData;
}

export default function CaratulaControlModal({
  isOpen,
  onClose,
  data,
}: CaratulaProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const calc = calcularValoresAdenda(data);

  if (!isOpen) return null;

  const handleDescargarCaratulaPDF = async () => {
    const elemento = document.getElementById("caratula-print");
    if (!elemento || isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);

      // 1. Capturar la carátula en alta definición asegurando captura de toda la altura
      const imgData = await toPng(elemento, {
        quality: 0.98,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        height: elemento.scrollHeight,
        style: {
          overflow: "visible",
          maxHeight: "none",
        },
      });

      // 2. Crear documento PDF A4 vertical (210 x 297 mm)
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

      // Márgenes perimetrales de seguridad
      const margin = 10; // 10 mm
      const maxWidth = pageWidth - margin * 2; // 190 mm
      const maxHeight = pageHeight - margin * 2; // 277 mm

      // 3. Obtener dimensiones exactas de la imagen capturada
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = reject;
      });

      // 4. Calcular factor de escala para que NUNCA supere ni el ancho ni el alto
      const scaleFactor = Math.min(maxWidth / img.width, maxHeight / img.height);
      const finalWidth = img.width * scaleFactor;
      const finalHeight = img.height * scaleFactor;

      // 5. Centrar horizontalmente en la página A4
      const posX = margin + (maxWidth - finalWidth) / 2;
      const posY = margin; // Iniciar arriba con margen

      // 6. Insertar imagen ajustada al 100% de la hoja
      pdf.addImage(imgData, "PNG", posX, posY, finalWidth, finalHeight);

      // 7. Descargar archivo con nombre sanitizado
      const expResuelto =
        calc.expedienteCompleto ||
        data.expediente ||
        (data.expedienteNumero
          ? `OE ${data.expedienteNumero}-M-${data.expedienteAnio || ""}`
          : "OE");
      const expLimpio = String(expResuelto).replace(/[\/\\:*?"<>|]/g, "-").trim();
      const alcLimpio = String(data.alcance || "0").replace(/[\/\\:*?"<>|]/g, "-").trim();

      pdf.save(`Caratula - Expediente ${expLimpio} - Alcance ${alcLimpio}.pdf`);
    } catch (error) {
      console.error("Error generando PDF de la carátula:", error);
      alert("Hubo un error al generar el PDF de la carátula.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const tieneVariacionesPrevias =
    data.variacionesAnteriores && data.variacionesAnteriores.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Contenedor Modal */}
      <div className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full my-6 shadow-2xl relative flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:m-0 print:rounded-none">
        {/* Barra superior de control (NO SE IMPRIME) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-3xl print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-[#0038A8]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B1938]">
                Carátula de Control de Expediente
              </h3>
              <p className="text-xs text-slate-500">
                Planilla oficial de seguimiento &bull; Lista para abrochar al expediente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDescargarCaratulaPDF}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0038A8] hover:bg-[#002b80] disabled:bg-blue-300 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Descargar Carátula (PDF)
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              title="Cerrar vista"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenedor con scroll para visualización en pantalla */}
        <div className="overflow-x-auto overflow-y-auto flex-1 p-4 sm:p-6 print:p-0 print:overflow-visible bg-slate-100/60">
          {/* CUERPO IMPRIMIBLE DE LA CARÁTULA (A4) - Ancho fijo para renderizado consistente y nítido */}
          <div
            id="caratula-print"
            className="w-[820px] min-w-[820px] max-w-[820px] mx-auto p-6 bg-white space-y-4 text-slate-900 text-xs shadow-sm print:shadow-none print:w-full print:min-w-0 print:max-w-none print:p-0"
          >
          {/* Encabezado Oficial con Escudo y Membrete */}
          <div className="border-b-2 border-slate-800 pb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/neuquen_capital_logo.png"
                alt="Neuquén Capital"
                className="w-14 h-14 object-contain shrink-0"
              />
              <div>
                <h1 className="font-extrabold text-sm tracking-wide text-slate-900 uppercase">
                  Municipalidad de Neuquén
                </h1>
                <h2 className="font-bold text-[11px] text-slate-700 uppercase">
                  Secretaría de Infraestructura y Planeamiento Urbano
                </h2>
                <h3 className="font-semibold text-[10px] text-slate-600 uppercase">
                  Subsecretaría de Gestión de Contrataciones de Obras Públicas
                </h3>
              </div>
            </div>

            {/* Recuadro Destacado: NO EXTRAER DEL EXPEDIENTE */}
            <div className="border-2 border-red-700 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-center font-black tracking-wider text-xs shadow-xs shrink-0 uppercase print:border-black print:text-black print:bg-white">
              NO EXTRAER DEL EXPEDIENTE
            </div>
          </div>

          {/* Expediente de Referencia */}
          <div className="flex items-center justify-between bg-slate-100 border border-slate-300 px-4 py-2 my-2 rounded-sm text-xs font-bold text-slate-800 print:bg-slate-50">
            <div className="whitespace-nowrap">
              <span className="text-slate-500 font-semibold mr-1">EXPEDIENTE N°:</span>
              <span className="text-[#0038A8] print:text-black">
                {calc.expedienteCompleto || data.expediente || "OE - -"}
              </span>
            </div>
            <div className="whitespace-nowrap text-right">
              <span className="text-slate-500 font-semibold mr-1">ALCANCE:</span>
              <span className="text-[#0038A8] print:text-black">
                {data.alcance || "0"}
              </span>
            </div>
          </div>

          {/* 1. DATOS PRELIMINARES DEL CONTRATO ORIGINAL */}
          <div className="border border-slate-300 rounded-sm overflow-hidden">
            <div className="bg-slate-800 text-white px-3 py-1 text-xs font-bold flex justify-between items-center rounded-t-sm print:bg-slate-200 print:text-black">
              <span className="tracking-wide uppercase">1. Datos Preliminares del Contrato Original</span>
              <span className="text-[10px] uppercase text-slate-300 font-semibold whitespace-nowrap shrink-0 ml-2 print:text-slate-700">
                Contratación Base
              </span>
            </div>

            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
              <div className="col-span-2 sm:col-span-3">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  Obra:
                </span>
                <span className="font-bold text-slate-900 uppercase leading-snug">
                  {data.obra || "-"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  Empresa Contratista:
                </span>
                <span className="font-bold text-slate-800">
                  {data.empresa || "-"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  C.U.I.T.:
                </span>
                <span className="font-bold text-slate-800">
                  {data.cuit || "-"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  Modalidad / Licitación:
                </span>
                <span className="font-bold text-slate-800">
                  {calc.modalidadCompleta || data.modalidadContrato || "-"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  Fecha Firma Contrato:
                </span>
                <span className="font-bold text-slate-800">
                  {formatearFechaCorta(data.fechaContrato)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  Norma de Adjudicación:
                </span>
                <span className="font-bold text-slate-800">
                  {calc.normaAdjCompleta || data.normaAdj || "-"}{" "}
                  {data.fechaNormaAdj ? `(${formatearFechaCorta(data.fechaNormaAdj)})` : ""}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  Cómputo a partir de:
                </span>
                <span className="font-bold text-slate-800">
                  {data.aPartirDe || "Contrato"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  Inspector de Obra:
                </span>
                <span className="font-bold text-slate-800">
                  {data.inspectorObra || "A designar"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  Representante Técnico:
                </span>
                <span className="font-bold text-slate-800">
                  {data.representanteTecnico || "-"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  Fecha Acta Replanteo:
                </span>
                <span className="font-bold text-slate-800">
                  {formatearFechaCorta(data.fechaReplanteo)}
                </span>
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  Monto Original:
                </span>
                <span className="font-black text-slate-900 text-xs">
                  {formatearMoneda(calc.montoOrig)}
                </span>
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  Plazo Original:
                </span>
                <span className="font-black text-slate-900 text-xs">
                  {calc.plazoOrig} días corridos
                </span>
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  Vencimiento Original:
                </span>
                <span className="font-black text-slate-900 text-xs">
                  {formatearFechaCorta(calc.fechaVtoOriginal)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. HISTORIAL DE VARIACIONES ANTERIORES (SI EXISTEN) */}
          {tieneVariacionesPrevias && (
            <div className="border border-slate-300 rounded-sm overflow-hidden">
              <div className="bg-slate-700 text-white px-3 py-1 text-xs font-bold flex justify-between items-center rounded-t-sm print:bg-slate-200 print:text-black">
                <span className="tracking-wide uppercase">2. Historial de Alteraciones Contractuales Anteriores</span>
                <span className="text-[10px] uppercase text-slate-300 font-semibold whitespace-nowrap shrink-0 ml-2 print:text-slate-700">
                  Registro Previo
                </span>
              </div>

              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-bold text-[9px]">
                    <th className="p-2">Alteración</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Expediente - Alcance</th>
                    <th className="p-2">Norma Legal</th>
                    <th className="p-2 text-right">Plazo (+)</th>
                    <th className="p-2 text-right">Modif (+) / (-)</th>
                    <th className="p-2 text-right">Paraliz.</th>
                    <th className="p-2 text-right">Vto. Resultante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[10px]">
                  {data.variacionesAnteriores?.map((v, i) => {
                    const row = calc.estadoPrevio.rows[i];
                    const assembledExp =
                      v.expediente ||
                      (v.expedienteNumero ? `OE ${v.expedienteNumero}-M-${v.expedienteAnio || ""}` : null) ||
                      calc.expedienteCompleto ||
                      data.expediente ||
                      "-";
                    const expteDisplay = `${assembledExp}${
                      v.alcance ? ` - Alc. ${v.alcance}` : ""
                    }`;
                    const normaDisplay =
                      v.normaLegal ||
                      (v.normaLegalNumero
                        ? `${v.normaLegalTipo || "Decreto"} N° ${v.normaLegalNumero}`
                        : null) ||
                      v.normaParalizacion ||
                      (v.normaParalizacionNumero
                        ? `${v.normaParalizacionTipo || "Disposición"} N° ${v.normaParalizacionNumero}`
                        : null) ||
                      v.normaExpediente ||
                      "-";

                    return (
                      <tr key={v.id || i} className="hover:bg-slate-50">
                        <td className="p-2 font-bold whitespace-nowrap">
                          {v.nroVariacion || `Var ${i + 1}`}
                        </td>
                        <td className="p-2 text-slate-600 font-medium">
                          {v.tipoAlteracion || "Ampliación de Plazo"}
                        </td>
                        <td className="p-2 font-mono text-[9px] text-slate-700">
                          {expteDisplay}
                        </td>
                        <td className="p-2 font-medium">{normaDisplay}</td>
                        <td className="p-2 text-right font-medium text-blue-900">
                          {row?.diasAmpliacionEfectivos
                            ? `+${row.diasAmpliacionEfectivos} d`
                            : "-"}
                        </td>
                        <td className="p-2 text-right font-medium">
                          {row?.montoAumentoEfectivo ? (
                            <span className="text-emerald-700">
                              +{formatearMoneda(row.montoAumentoEfectivo)}
                            </span>
                          ) : row?.montoDisminucionEfectivo ? (
                            <span className="text-amber-700">
                              -{formatearMoneda(row.montoDisminucionEfectivo)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-2 text-right font-medium text-amber-900">
                          {row?.diasParalizacionEfectivos
                            ? `${row.diasParalizacionEfectivos} d`
                            : "-"}
                        </td>
                        <td className="p-2 text-right font-bold text-[#0038A8] whitespace-nowrap">
                          {row?.fechaVtoResultante
                            ? formatearFechaCorta(row.fechaVtoResultante)
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. ESTADO ACTUALIZADO PREVIO A LA PRESENTE VARIACIÓN */}
          <div className="border border-slate-300 rounded-sm overflow-hidden">
            <div className="bg-slate-800 text-white px-3 py-1 text-xs font-bold flex justify-between items-center rounded-t-sm print:bg-slate-200 print:text-black">
              <span className="tracking-wide uppercase">
                {tieneVariacionesPrevias
                  ? "3. Estado Actualizado Previo a la Presente Alteración"
                  : "2. Estado Previo (Equivale al Contrato Original)"}
              </span>
              <span className="text-[10px] uppercase text-slate-300 font-semibold whitespace-nowrap shrink-0 ml-2 print:text-slate-700">
                Línea Base
              </span>
            </div>

            <div className="p-3 grid grid-cols-3 gap-3 bg-slate-50 text-[11px]">
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  Monto Actualizado Previo:
                </span>
                <span className="font-extrabold text-slate-900 text-xs">
                  {formatearMoneda(calc.estadoPrevio.montoPrevio)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  Plazo Actualizado Previo:
                </span>
                <span className="font-extrabold text-slate-900 text-xs">
                  {calc.estadoPrevio.plazoPrevioDias} días corridos
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                  Fecha Vto. Previa:
                </span>
                <span className="font-extrabold text-slate-900 text-xs">
                  {formatearFechaCorta(calc.estadoPrevio.fechaVtoPrevia)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. VARIACIÓN ACTUAL A TRAMITAR (PRESENTE ADENDA) */}
          <div className="border-2 border-[#0038A8] rounded-sm overflow-hidden print:border-black">
            <div className="bg-[#0038A8] text-white px-3 py-1 text-xs font-bold flex justify-between items-center rounded-t-sm print:bg-slate-300 print:text-black">
              <span className="tracking-wide uppercase">
                {tieneVariacionesPrevias
                  ? "4. Variación Actual a Tramitar (Presente Proyecto)"
                  : "3. Variación Actual a Tramitar (Presente Proyecto)"}
              </span>
              <span className="text-[10px] uppercase text-blue-200 font-semibold whitespace-nowrap shrink-0 ml-2 print:text-slate-800">
                {data.modalidad.toUpperCase()}
              </span>
            </div>

            <div className="p-3.5 space-y-3 bg-blue-50/20 print:bg-white text-[11px]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                    Tipo de Alteración:
                  </span>
                  <span className="font-bold text-[#0038A8] print:text-black">
                    {data.tipoAlteracion}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                    Modalidad:
                  </span>
                  <span className="font-bold text-slate-800">
                    {data.modalidad}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                    N° Cuadro Comparativo:
                  </span>
                  <span className="font-bold text-slate-800">
                    {data.nroCuadro || (calc.esConvalidacion ? "FINAL" : "-")}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">
                    Incidencia s/ Monto Previo:
                  </span>
                  <span className="font-bold text-[#0038A8] print:text-black">
                    {formatearPorcentaje(calc.porcentajeVar)}
                  </span>
                </div>
              </div>

              {/* Cifras Resultantes Destacadas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                <div className="bg-white p-2.5 rounded-xl border border-blue-200 print:border-black">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">
                    Variación de Volumen ($):
                  </span>
                  <span
                    className={`font-black text-xs ${
                      calc.varVolPesos < 0 ? "text-amber-700" : "text-emerald-700"
                    } print:text-black`}
                  >
                    {calc.varVolPesos < 0 ? "- " : "+ "}
                    {formatearMoneda(Math.abs(calc.varVolPesos))}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-blue-200 print:border-black">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">
                    Ampliación Otorgada:
                  </span>
                  <span className="font-black text-xs text-[#0038A8] print:text-black">
                    {calc.diasAmp > 0 ? `+ ${calc.diasAmp} días` : "Sin ampliación"}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-blue-200 print:border-black">
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">
                    Póliza de Garantía (5%):
                  </span>
                  <span className="font-black text-xs text-emerald-800 print:text-black">
                    {calc.garantia > 0
                      ? formatearMoneda(calc.garantia)
                      : "No aplica (Convalidación / Sin aumento)"}
                  </span>
                </div>
              </div>

              {/* Totales Post Variación */}
              <div className="bg-white p-3 rounded-xl border-2 border-slate-300 print:border-black grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <span className="text-slate-600 font-extrabold block text-[10px] uppercase">
                    NUEVO MONTO CONTRACTUAL:
                  </span>
                  <span className="font-black text-sm text-[#0038A8] print:text-black">
                    {formatearMoneda(calc.montoPostVariacion)}
                  </span>
                  <span className="text-[9px] text-slate-500 block italic leading-tight">
                    {montoALetras(calc.montoPostVariacion, true)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-600 font-extrabold block text-[10px] uppercase">
                    NUEVO PLAZO TOTAL:
                  </span>
                  <span className="font-black text-sm text-slate-900">
                    {calc.plazoPostVariacion} días corridos
                  </span>
                  <span className="text-[9px] text-slate-500 block italic leading-tight">
                    ({diasALetras(calc.plazoPostVariacion)} DÍAS)
                  </span>
                </div>

                <div>
                  <span className="text-slate-600 font-extrabold block text-[10px] uppercase">
                    {calc.esConvalidacion
                      ? "FECHA FINALIZACIÓN EFECTIVA:"
                      : "NUEVA FECHA PREVISTA VTO:"}
                  </span>
                  <span className="font-black text-sm text-[#0038A8] print:text-black">
                    {formatearFechaCorta(data.fechaVtoNueva || calc.fechaVtoNuevaSugerida)}
                  </span>
                  <span className="text-[9px] text-slate-500 block italic leading-tight">
                    {formatearFechaTexto(data.fechaVtoNueva || calc.fechaVtoNuevaSugerida)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque de Firma Centrado al Pie */}
          <div className="mt-6 flex justify-center">
            <div className="w-72 border-t border-slate-700 pt-2 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Área de Alteraciones Contractuales
              </p>
              <p className="text-[10px] text-slate-500">
                Subsecretaría de Gestión de Contrataciones de Obras Públicas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
