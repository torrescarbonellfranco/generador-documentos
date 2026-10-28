import createReport from "docx-templates";
import JSZip from "jszip";
import {
  AdendaData,
  ComunicacionObra,
  calcularValoresAdenda,
  prepararDatosReporte,
  generarParrafoWordXml,
  ensamblarExpediente,
  ensamblarNormaLegal,
  escapeXml,
  homogeneizarDocumentoWordXml,
  aplicarNegritasDatosClave,
  removerParrafoComputo,
  PARRAFO_COMPUTO_OFICIAL,
  generarConsiderandoAlteracionMontos,
} from "./adendaGenerator";
import {
  TipoNorma,
  determinarTipoNorma,
  obtenerRutaPlantillaNorma,
} from "./normaRules";

export { generarConsiderandoAlteracionMontos };

/**
 * Articula gramaticalmente una norma legal ("el Decreto...", "la Disposición...", "la Resolución...")
 */
export function articularNorma(norma: string): string {
  const trimmed = (norma || "").trim();
  if (!trimmed) return "";
  // Si ya tiene artículo definido ("el ", "la ", "los ", "las ")
  if (/^(el|la|los|las)\s+/i.test(trimmed)) {
    return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  }
  // Normas femeninas habituales
  if (/^(disposici[oó]n|resoluci[oó]n|ordenanza|ley)/i.test(trimmed)) {
    return `la ${trimmed}`;
  }
  // Masculino por defecto (Decreto, Acta, etc.)
  return `el ${trimmed}`;
}

/**
 * Construye el texto formal y cronológico del VISTO concatenando todas las normas involucradas:
 * - Sin variaciones anteriores:
 *   "El Expediente [Expediente] - Alcance [Alcance], y el [Norma_Adj]; y"
 * - Con variaciones anteriores:
 *   "El Expediente [Expediente] - Alcance [Alcance], el [Norma_Adj], [Norma_Var_1], ..., y [Norma_Var_N]; y"
 */
export function construirTextoVisto(data: AdendaData): string {
  const exp =
    data.expediente?.trim() ||
    (data.expedienteNumero
      ? ensamblarExpediente(data.expedienteNumero, data.expedienteAnio || "")
      : "") ||
    "S/N";
  const alc = data.alcance?.trim() || "0";

  const normaAdj =
    data.normaAdj?.trim() ||
    ensamblarNormaLegal(data.normaAdjTipo, data.normaAdjNumero) ||
    "Decreto de Adjudicación";

  const normas: string[] = [normaAdj];

  if (data.variacionesAnteriores && data.variacionesAnteriores.length > 0) {
    for (const v of data.variacionesAnteriores) {
      const tipo = v.tipoAlteracion || "Ampliación de Plazo";
      if (tipo === "Paralización / Desparalización") {
        const nPar =
          v.normaParalizacion?.trim() ||
          ensamblarNormaLegal(v.normaParalizacionTipo, v.normaParalizacionNumero);
        const nRean =
          v.normaReanudacion?.trim() ||
          ensamblarNormaLegal(v.normaReanudacionTipo, v.normaReanudacionNumero);
        if (nPar) normas.push(nPar);
        if (nRean) normas.push(nRean);
      } else {
        const nLeg =
          v.normaLegal?.trim() ||
          ensamblarNormaLegal(v.normaLegalTipo, v.normaLegalNumero) ||
          v.normaExpediente?.trim();
        if (nLeg) normas.push(nLeg);
      }
    }
  }

  // Articular cada norma garantizando técnica legislativa
  const normasArticuladas = normas.map(articularNorma).filter(Boolean);

  if (normasArticuladas.length <= 1) {
    return `El Expediente ${exp} - Alcance ${alc}, y ${normasArticuladas[0]}; y`;
  }

  const previas = normasArticuladas.slice(0, -1).join(", ");
  const ultima = normasArticuladas[normasArticuladas.length - 1];
  return `El Expediente ${exp} - Alcance ${alc}, ${previas}, y ${ultima}; y`;
}

/**
 * Genera el párrafo de Word XML para el VISTO (interlineado 1.5, justificado, sangría de primera línea)
 */
export function generarParrafoVistoWordXml(textoVisto: string): string {
  return `<w:p><w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/><w:ind w:firstLine="993"/><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Aptos" w:eastAsia="Aptos" w:hAnsi="Aptos" w:cs="Times New Roman"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Aptos" w:eastAsia="Aptos" w:hAnsi="Aptos" w:cs="Times New Roman"/><w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXml(textoVisto)}</w:t></w:r></w:p>`;
}

/**
 * Genera el nombre del archivo final para el proyecto de Norma Legal:
 * Proy. [Decreto/Resolución] - Expediente [Expediente] - Alcance [Alcance].docx
 */
export function generarNombreArchivoNorma(
  tipoNorma: TipoNorma,
  expedienteOrData:
    | string
    | {
        expediente?: string;
        expedienteNumero?: string;
        expedienteAnio?: string;
        alcance?: string;
      },
  alcance?: string
): string {
  let exp = "S-N";
  let alc = "0";

  if (typeof expedienteOrData === "object" && expedienteOrData !== null) {
    const obj = expedienteOrData;
    exp =
      obj.expediente ||
      (obj.expedienteNumero
        ? ensamblarExpediente(obj.expedienteNumero, obj.expedienteAnio || "")
        : "") ||
      "S-N";
    alc = obj.alcance || "0";
  } else if (typeof expedienteOrData === "string") {
    exp = expedienteOrData || "S-N";
    alc = alcance || "0";
  }

  const sanitize = (s: unknown) =>
    String(s ?? "")
      .replace(/[\/\\:*?"<>|]/g, "-")
      .trim()
      .replace(/\s+/g, " ");

  const expLimpio = sanitize(exp);
  const alcLimpio = sanitize(alc);

  return `Proy. ${tipoNorma} - Expediente ${expLimpio} - Alcance ${alcLimpio}.docx`;
}

/**
 * Obtiene el ArrayBuffer de la plantilla de Norma Legal
 */
export async function obtenerPlantillaNormaBuffer(
  tipoNorma: TipoNorma,
  modalidad: "Aprobación" | "Convalidación",
  tipoAlteracion: any
): Promise<ArrayBuffer> {
  const rutaPrincipal = obtenerRutaPlantillaNorma(
    tipoNorma,
    modalidad,
    tipoAlteracion
  );

  const urlEncoded = encodeURI(rutaPrincipal);

  try {
    const response = await fetch(urlEncoded);
    if (response.ok) {
      return await response.arrayBuffer();
    }
  } catch (e: any) {
    // Si falla el fetch en pruebas o entorno local
  }

  // Si estamos en entorno Node.js (tests), intentamos leer del sistema de archivos
  if (typeof window === "undefined") {
    const fs = await import("fs");
    const path = await import("path");
    const publicPath = path.join(process.cwd(), "public", rutaPrincipal);
    if (fs.existsSync(publicPath)) {
      const buf = fs.readFileSync(publicPath);
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
  }

  throw new Error(
    `No se pudo cargar la plantilla de ${tipoNorma} para ${modalidad} - ${tipoAlteracion} en ${urlEncoded}`
  );
}

/**
 * Inserta las comunicaciones de obra (Notas de Pedido y Órdenes de Servicio)
 * inmediatamente después del considerando de la Dirección General de Inspecciones
 * y antes de Cómputo y Presupuesto / Cuadro Comparativo, reemplazando las notas de plantilla.
 */
export function reemplazarComunicacionesObraXml(
  xml: string,
  comunicaciones?: ComunicacionObra[]
): string {
  const dgiRegex = /<w:p(?:\s[^>]*)?>(?:(?!<\/w:p>)[\s\S])*?Direcci[oó]n General de Inspecciones[\s\S]*?<\/w:p>/;
  const dgiM = dgiRegex.exec(xml);
  if (!dgiM) return xml;

  let dgiEnd = dgiM.index + dgiM[0].length;
  // Si el siguiente párrafo es un espaciador vacío, avanzamos tras él
  const postDgi = xml.slice(dgiEnd);
  const postDgiSpacer = postDgi.match(/^(\s*<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>)/);
  if (postDgiSpacer && !postDgiSpacer[1].replace(/<[^>]+>/g, "").trim()) {
    dgiEnd += postDgiSpacer[0].length;
  }

  const remaining = xml.slice(dgiEnd);
  // El siguiente considerando oficial es Cómputo y Presupuesto, Pase, Memoria o Cuadro Comparativo
  const nextTargetRegex = /<w:p(?:\s[^>]*)?>(?:(?!<\/w:p>)[\s\S])*?(?:C[oó]mputo y Presupuesto|Pase N[°º]|Memoria del Cuadro|Cuadro Comparativo)[\s\S]*?<\/w:p>/;
  const nextM = nextTargetRegex.exec(remaining);
  if (!nextM) return xml;

  const nextTargetStart = dgiEnd + nextM.index;

  let xmlComunicaciones = "";
  if (comunicaciones && comunicaciones.length > 0) {
    xmlComunicaciones = comunicaciones
      .filter((c) => c.textoConsiderando?.trim())
      .map((c) => generarParrafoWordXml(c.textoConsiderando))
      .join("");
  }

  return xml.slice(0, dgiEnd) + xmlComunicaciones + xml.slice(nextTargetStart);
}

export interface ResultadoGeneracionNorma {
  blob: Blob;
  fileName: string;
  tipoNorma: TipoNorma;
  motivoCompetencia: string;
}

/**
 * Genera el documento Word (.docx) del Proyecto de Norma Legal (Decreto o Resolución),
 * inyecta los considerandos previos, remueve metadatos de combinación de correspondencia,
 * y dispara la descarga automática en el navegador.
 */
export async function generarYDescargarNormaLegal(
  data: AdendaData,
  tipoNormaOverride?: TipoNorma
): Promise<ResultadoGeneracionNorma> {
  // 1. Determinar tipo de norma y competencia
  const modalidadTipo =
    data.modalidadContratoTipo || data.modalidadContrato || "Licitación Pública";
  const competencia = determinarTipoNorma(data.tipoAlteracion, modalidadTipo);
  const tipoNormaFinal = tipoNormaOverride || competencia.tipoNorma;

  // 2. Obtener la plantilla correspondiente
  const templateBuffer = await obtenerPlantillaNormaBuffer(
    tipoNormaFinal,
    data.modalidad,
    data.tipoAlteracion
  );

  // 3. Preparar los datos unificados
  const textoVisto = construirTextoVisto(data);
  const datosReporte = {
    ...prepararDatosReporte(data, true),
    Visto_Completo: textoVisto,
  };
  const calc = calcularValoresAdenda(data);

  // 4. Procesar la plantilla con docx-templates y delimitador « »
  const output = await createReport({
    template: new Uint8Array(templateBuffer),
    data: datosReporte,
    cmdDelimiter: ["«", "»"],
    literalXmlDelimiter: "||",
    failFast: false,
    processLineBreaks: true,
    noSandbox: true,
  });

  // 5. Abrir con JSZip para sanitizar y remover mailMerge
  const zip = await JSZip.loadAsync(output);

  if (zip.files["word/settings.xml"]) {
    const settingsXml = await zip.files["word/settings.xml"].async("string");
    const cleanedSettings = settingsXml.replace(
      /<w:mailMerge[\s\S]*?<\/w:mailMerge>/g,
      ""
    );
    zip.file("word/settings.xml", cleanedSettings);
  }

  if (zip.files["word/recipientData.xml"]) {
    zip.remove("word/recipientData.xml");
  }
  if (zip.files["word/_rels/settings.xml.rels"]) {
    zip.remove("word/_rels/settings.xml.rels");
  }

  // 6. Inyección estructurada de VISTO y CONSIDERANDO en word/document.xml
  if (zip.files["word/document.xml"]) {
    let docXml = await zip.files["word/document.xml"].async("string");

    // A) ESTRUCTURACIÓN DEL ENCABEZADO "VISTO"
    // Reemplaza el párrafo que enumera el expediente y las normas anteriores
    const vistoIdx = docXml.indexOf("VISTO:");
    const considerandoIdx = docXml.indexOf("CONSIDERANDO:");
    if (vistoIdx !== -1 && considerandoIdx !== -1 && considerandoIdx > vistoIdx) {
      const vistoSection = docXml.slice(vistoIdx, considerandoIdx);
      const pRegex = /<w:p(?:[\s>][\s\S]*?<\/w:p>|\/>)/g;
      let pMatch: RegExpExecArray | null;
      let targetMatch: { text: string; start: number; end: number } | null = null;

      while ((pMatch = pRegex.exec(vistoSection)) !== null) {
        const raw = pMatch[0].replace(/<[^>]+>/g, "");
        if (/Expediente/i.test(raw) && /Alcance/i.test(raw)) {
          targetMatch = {
            text: pMatch[0],
            start: vistoIdx + pMatch.index,
            end: vistoIdx + pMatch.index + pMatch[0].length,
          };
          break;
        }
      }

      if (targetMatch) {
        const xmlVisto = generarParrafoVistoWordXml(textoVisto);
        docXml =
          docXml.slice(0, targetMatch.start) +
          xmlVisto +
          docXml.slice(targetMatch.end);
      }
    }

    // B) ORDEN CRONOLÓGICO ESTRICTO EN LOS "CONSIDERANDO"
    // Párrafo 1 (Contrato Original) -> Párrafos Intermedios (Alteraciones Anteriores) -> Párrafo DGI
    const textosConsiderandos = calc.estadoPrevio.textosConsiderandos || [];
    const xmlBloqueConsiderandos = textosConsiderandos
      .map((t) => generarParrafoWordXml(t))
      .join("");

    if (
      docXml.includes("Considerandos_Previos") ||
      docXml.includes("«Considerandos_Previos»")
    ) {
      const pRegex = /<w:p(?:[\s>][\s\S]*?<\/w:p>|\/>)/g;
      docXml = docXml.replace(pRegex, (match) => {
        if (match.includes("Considerandos_Previos")) {
          return xmlBloqueConsiderandos;
        }
        return match;
      });
    } else {
        // Localizar Párrafo 1 después del encabezado CONSIDERANDO:
        const newConsIdx = docXml.indexOf("CONSIDERANDO:");
        if (newConsIdx !== -1) {
          const afterCons = docXml.slice(newConsIdx);
          const pRegex = /<w:p(?:[\s>][\s\S]*?<\/w:p>|\/>)/g;
          let p1Match: RegExpExecArray | null;
          let p1Raw = "";

          while ((p1Match = pRegex.exec(afterCons)) !== null) {
            if (/adjudic[oó]/i.test(p1Match[0])) {
              p1Raw = p1Match[0];
              break;
            }
          }

          if (p1Raw) {
            // Asegurar que Párrafo 1 incluya el CUIT de la empresa según técnica legislativa
            if (data.cuit && !/CUIT/i.test(p1Raw)) {
              const cuitEscaped = escapeXml(data.cuit);
              const p1Updated = p1Raw.replace(
                /(<w:t[^>]*>)\s*,\s*por la suma/i,
                `$1 bajo el CUIT N° ${cuitEscaped}, por la suma`
              );
              if (p1Updated !== p1Raw) {
                docXml = docXml.replace(p1Raw, p1Updated);
                p1Raw = p1Updated;
              }
            }

            // Inyectar considerandos dinámicos entre Párrafo 1 y el párrafo de la Dirección General de Inspecciones
            if (textosConsiderandos.length > 0) {
              const p1Index = docXml.indexOf(p1Raw);
              if (p1Index !== -1) {
                let targetEnd = p1Index + p1Raw.length;

                // Si el siguiente párrafo es un espaciador vacío, avanzamos después de él para conservar el espaciado
                const remaining = docXml.slice(targetEnd);
                const nextMatch = remaining.match(/^(\s*<w:p[\s\S]*?<\/w:p>)/);
                if (nextMatch) {
                  const nextText = nextMatch[1].replace(/<[^>]+>/g, "").trim();
                  if (!nextText) {
                    targetEnd += nextMatch[0].length;
                  }
                }

                docXml =
                  docXml.slice(0, targetEnd) +
                  xmlBloqueConsiderandos +
                  docXml.slice(targetEnd);
              }
          }
        }
      }
    }

    // C) COMUNICACIONES DE OBRA (NOTAS DE PEDIDO Y ÓRDENES DE SERVICIO)
    // Se insertan inmediatamente después del considerando de Inspección (DGI) y antes de Cómputo/Cuadro
    if (data.comunicacionesObra !== undefined) {
      docXml = reemplazarComunicacionesObraXml(docXml, data.comunicacionesObra);
    }

    // D) PÁRRAFO CONDICIONAL DE CÓMPUTO Y PRESUPUESTO
    // Si incluyeItemsNuevos es true (y no es solo ampliación de plazo): incluye el párrafo oficial
    // Si es false o ampliación de plazo: excluye por completo este considerando
    if (!data.incluyeItemsNuevos || data.tipoAlteracion === "Ampliación de Plazo") {
      docXml = removerParrafoComputo(docXml);
    } else {
      if (!docXml.includes("Cómputo y Presupuesto") && !docXml.includes("Computo")) {
        const nextTargetRegex =
          /<w:p(?:\s[^>]*)?>(?:(?!<\/w:p>)[\s\S])*?(?:Pase N[°º]|Memoria del Cuadro|Cuadro Comparativo)[\s\S]*?<\/w:p>/;
        const tm = nextTargetRegex.exec(docXml);
        if (tm) {
          docXml =
            docXml.slice(0, tm.index) +
            generarParrafoWordXml(PARRAFO_COMPUTO_OFICIAL) +
            docXml.slice(tm.index);
        }
      }
    }

    docXml = homogeneizarDocumentoWordXml(docXml, true);
    docXml = aplicarNegritasDatosClave(docXml, data, calc);
    zip.file("word/document.xml", docXml);
  }

  // 7. Generar blob limpio
  const cleanBlob = await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  // 8. Descarga en navegador
  const fileName = generarNombreArchivoNorma(tipoNormaFinal, data);

  if (typeof window !== "undefined") {
    const url = URL.createObjectURL(cleanBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return {
    blob: cleanBlob,
    fileName,
    tipoNorma: tipoNormaFinal,
    motivoCompetencia: competencia.motivo,
  };
}
