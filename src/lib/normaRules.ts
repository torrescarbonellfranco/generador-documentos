import { TipoAlteracion, ModalidadTramite } from "./adendaGenerator";

export type TipoNorma = "Decreto" | "Resolución";

export interface CompetenciaNorma {
  tipoNorma: TipoNorma;
  motivo: string;
  autoridad: string;
  baseLegal: string;
}

/**
 * Determina automáticamente si corresponde redactar un Proyecto de Decreto o de Resolución
 * en función del Tipo de Alteración y la Modalidad de Contratación adjudicada.
 */
export function determinarTipoNorma(
  tipoAlteracion: string,
  modalidadTipo: string
): CompetenciaNorma {
  // 1. Ampliación de plazo pura: siempre Resolución de Secretaría
  const esPlazoPuro =
    tipoAlteracion === "PLAZO" ||
    tipoAlteracion === "Ampliación de Plazo" ||
    (tipoAlteracion.toLowerCase().includes("plazo") &&
      !tipoAlteracion.toLowerCase().includes("volumen"));

  if (esPlazoPuro) {
    return {
      tipoNorma: "Resolución",
      motivo:
        "Las ampliaciones exclusivas de plazo son resueltas por la Secretaría de Infraestructura y Planeamiento Urbano (Art. 50 Ley 687 y Dto. Reglamentario N° 108/72).",
      autoridad: "Secretario de Infraestructura y Planeamiento Urbano",
      baseLegal: "Art. 50 Ley 687 / Dto. Reglamentario N° 108/72",
    };
  }

  // 2. Modificaciones de volumen (puras o combinadas con plazo):
  const esContratacionMenor =
    modalidadTipo === "Contratación Directa" ||
    modalidadTipo === "Concurso de Precios" ||
    modalidadTipo.toLowerCase().includes("directa") ||
    modalidadTipo.toLowerCase().includes("concurso");

  if (esContratacionMenor) {
    return {
      tipoNorma: "Resolución",
      motivo:
        "Al haberse adjudicado la obra por Contratación Directa o Concurso de Precios, la aprobación/convalidación corresponde por Resolución de Secretaría.",
      autoridad: "Secretario de Infraestructura y Planeamiento Urbano",
      baseLegal: "Delegación de Competencia - Contrataciones Menores",
    };
  }

  // 3. Licitación Pública o Licitación Privada con impacto presupuestario: Decreto del Ejecutivo
  return {
    tipoNorma: "Decreto",
    motivo:
      "Al tratarse de una Licitación Pública o Licitación Privada con modificación de volumen presupuestario, la competencia corresponde al Órgano Ejecutivo Municipal mediante Decreto.",
    autoridad: "Órgano Ejecutivo Municipal (Intendente)",
    baseLegal: "Carta Orgánica Municipal / Ley 687 de Obras Públicas",
  };
}

/**
 * Mapeo del archivo de plantilla .docx según el tipo de norma y alteración
 */
export const MAPA_PLANTILLAS_NORMA: Record<
  TipoNorma,
  Partial<Record<TipoAlteracion, string>>
> = {
  Decreto: {
    "Ampliación de Volumen": "AMPLIACIÓN DE VOLUMEN.docx",
    "Disminución de Volumen": "DISMINUCIÓN DE VOLUMEN.docx",
    "Ampliación de Plazo y Volumen": "AMPLIACIÓN DE PLAZO Y VOLUMEN.docx",
    "Ampliación de Plazo y Disminución de Volumen":
      "AMPLIACIÓN DE PLAZO Y VOLUMEN.docx",
  },
  Resolución: {
    "Ampliación de Plazo": "AMPLIACIÓN DE PLAZO.docx",
    "Ampliación de Volumen": "AMPLIACIÓN DE VOLUMEN.docx",
    "Disminución de Volumen": "DISMINUCIÓN DE VOLUMEN.docx",
    "Ampliación de Plazo y Volumen": "AMPLIACIÓN DE PLAZO Y VOLUMEN.docx",
    "Ampliación de Plazo y Disminución de Volumen":
      "AMPLIACIÓN DE PLAZO Y VOLUMEN.docx",
  },
};

/**
 * Obtiene la ruta relativa pública para el fetch de la plantilla de norma
 */
export function obtenerRutaPlantillaNorma(
  tipoNorma: TipoNorma,
  modalidad: ModalidadTramite,
  tipoAlteracion: TipoAlteracion
): string {
  const fileName = MAPA_PLANTILLAS_NORMA[tipoNorma][tipoAlteracion];
  if (!fileName) {
    throw new Error(
      `No existe plantilla de ${tipoNorma} para la alteración "${tipoAlteracion}". ${
        tipoNorma === "Decreto" && tipoAlteracion === "Ampliación de Plazo"
          ? "Las ampliaciones de plazo corresponden por Resolución."
          : ""
      }`
    );
  }

  return `/templates/normas/${tipoNorma}/${modalidad}/${fileName}`;
}
