import { NextResponse } from "next/server";
import { ExpedienteItem, ExpedientesApiResponse } from "@/types/expediente";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTI_8XKv2q_W3fNTa0PJd6S5iLmwFlUYholYvwdPUyOOFIBsFkPKASx7i9TUOfTJg/pub?gid=1054009781&single=true&output=csv";

// Parser robusto de CSV estándar RFC 4180
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // Omitir la siguiente comilla escapada
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\r") {
        if (nextChar === "\n") {
          i++; // Omitir el salto CRLF
        }
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else if (char === "\n") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

export async function GET() {
  try {
    const response = await fetch(CSV_URL, {
      next: { revalidate: 60 },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SIGAC-Neuquen/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP al obtener el CSV de Google Sheets: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return NextResponse.json<ExpedientesApiResponse>({
        inspectores: [],
        expedientes: [],
        total: 0,
        actualizadoEl: new Date().toISOString(),
      });
    }

    // Cabeceras (Fila 0)
    const headers = rows[0].map((h) => h.trim().toUpperCase());

    // Mapeo dinámico de índices con fallback seguro
    const findIndex = (predicate: (h: string) => boolean, fallback: number): number => {
      const idx = headers.findIndex(predicate);
      return idx !== -1 ? idx : fallback;
    };

    // Normalización de etiquetas para estadoCalculado
    const normalizeEstadoCalculado = (val: string): string => {
      const upper = (val || "").trim().toUpperCase();
      if (!upper || upper.includes("COLOCAR DATOS")) {
        return "Sin Información";
      }
      if (
        upper.includes("NORMA LEGAL APROBADA") ||
        upper.includes("APROBADA") ||
        upper.includes("APROBADO")
      ) {
        return "Aprobado";
      }
      // "Riesgo de Pasar a Convalidación" debe chequearse antes de "Convalidación"
      if (upper.includes("RIESGO")) {
        return "Por Vencer";
      }
      if (upper.includes("CONVALIDACI")) {
        return "Por Convalidación";
      }
      if (upper.includes("APROBACI")) {
        return "Por Aprobación";
      }
      if (upper.includes("PARALIZAD")) {
        return "Paralizada";
      }
      return val.trim() || "Sin Información";
    };

    const idxExpte = findIndex((h) => h.includes("EXPTE") || h.includes("EXPEDIENTE"), 1);
    const idxAlcance = findIndex((h) => h.includes("ALCANCE"), 2);
    const idxObra = findIndex((h) => h.includes("OBRA"), 3);
    const idxArea = findIndex((h) => h.includes("ÁREA") || h.includes("AREA"), 4);
    const idxEmpresa = findIndex((h) => h.includes("EMPRESA"), 5);
    const idxInspector = findIndex((h) => h.includes("INSPECTOR"), 6);
    const idxTipoAlter = findIndex(
      (h) => h.includes("TIPO DE ALTER") || h.includes("ALTERACI"),
      8
    );
    const idxFechaVencimiento = findIndex(
      (h) => h.includes("FINALIZACI") && h.includes("AMPLIADA"),
      13
    );
    const idxEstadoActual = findIndex(
      (h) => h.includes("ESTADO ACTUAL"),
      14
    );
    const idxAprobado = findIndex(
      (h) => h.includes("APROB") && !h.includes("RESERVADA"),
      20
    );
    const idxDiasSector = findIndex((h) => h.includes("DÍAS EN EL") || h.includes("DIAS EN EL"), 21);
    const idxFechaSolicitud = findIndex((h) => h.includes("FECHA SOLICITUD"), 0);
    const idxMontoOrig = findIndex((h) => h.includes("MONTO DE OBRA ORIGINAL"), 7);
    const idxVarMonto = findIndex((h) => h.includes("VARIACIÓN DEL MONTO"), 9);
    const idxVarPct = findIndex((h) => h.includes("VARIACIÓN %"), 10);
    const idxDiasAmpl = findIndex((h) => h.includes("AUMENTO DE PLAZO"), 11);
    const idxObservaciones = findIndex((h) => h.includes("OBSERVACIONES"), 17);

    const expedientes: ExpedienteItem[] = [];
    const inspectoresSet = new Set<string>();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const expte = (row[idxExpte] || "").trim();
      const obra = (row[idxObra] || "").trim();

      // Si no tiene expediente ni obra, es una fila vacía del final
      if (!expte && !obra) continue;

      const alcance = (row[idxAlcance] || "").trim();
      const area = (row[idxArea] || "").trim();
      const empresa = (row[idxEmpresa] || "").trim();
      const inspectoresRaw = (row[idxInspector] || "").trim();
      const tipoAlteracion = (row[idxTipoAlter] || "").trim();
      const diasSectorRaw = (row[idxDiasSector] || "").trim();
      const aprobadoRaw = (row[idxAprobado] || "").trim().toUpperCase();
      const fechaVencimientoRaw = (row[idxFechaVencimiento] || "").trim();
      const estadoActualRaw = (row[idxEstadoActual] || "").trim();

      const estaAprobado = aprobadoRaw === "TRUE" || aprobadoRaw === "VERDADERO";
      const estadoCalculado = normalizeEstadoCalculado(estadoActualRaw);
      const fechaVencimiento = fechaVencimientoRaw && fechaVencimientoRaw !== "-" ? fechaVencimientoRaw : "-";

      // Extracción de inspectores únicos
      if (inspectoresRaw && inspectoresRaw !== "-") {
        const parts = inspectoresRaw.split(",");
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed && trimmed !== "-" && trimmed !== "SIN ASIGNAR") {
            inspectoresSet.add(trimmed);
          }
        }
      }

      expedientes.push({
        id: `exp-${i}-${expte.replace(/\s+/g, "") || i}`,
        expediente: expte,
        alcance: alcance || "-",
        obra: obra || "Obra sin denominación especificada",
        empresa: empresa || "-",
        inspectoresRaw: inspectoresRaw || "Sin asignar",
        tipoAlteracion: tipoAlteracion || "No especificada",
        area: area || "Mesa de Entradas / Despacho",
        diasSector: diasSectorRaw || "-",
        estaAprobado,
        fechaVencimiento,
        estadoCalculado,
        fechaSolicitud: (row[idxFechaSolicitud] || "").trim(),
        montoOriginal: (row[idxMontoOrig] || "").trim(),
        variacionMonto: (row[idxVarMonto] || "").trim(),
        variacionPorcentaje: (row[idxVarPct] || "").trim(),
        diasAmpliacion: (row[idxDiasAmpl] || "").trim(),
        observaciones: (row[idxObservaciones] || "").trim(),
      });
    }

    const inspectores = Array.from(inspectoresSet).sort((a, b) => a.localeCompare(b, "es"));

    return NextResponse.json<ExpedientesApiResponse>({
      inspectores,
      expedientes,
      total: expedientes.length,
      actualizadoEl: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Error al procesar consulta de expedientes:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al procesar el CSV";
    return NextResponse.json<ExpedientesApiResponse>(
      {
        inspectores: [],
        expedientes: [],
        total: 0,
        actualizadoEl: new Date().toISOString(),
        error: message,
      },
      { status: 500 }
    );
  }
}
