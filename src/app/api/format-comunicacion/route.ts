import { NextRequest, NextResponse } from "next/server";
import {
  reformularComunicacionLegal,
  TipoComunicacionObra,
} from "@/lib/adendaGenerator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipo, numero, textoOriginal } = body;

    const tipoVal = (tipo || "Nota de Pedido") as TipoComunicacionObra;
    const numVal = String(numero || "").trim() || "1";
    const textoVal = String(textoOriginal || "").trim();

    // 1. Si existe GEMINI_API_KEY en variables de entorno, intenta reformular mediante el modelo
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey && textoVal.length > 5) {
      try {
        const prompt = `Actúa como redactor técnico-jurídico de decretos y resoluciones de obras públicas de la Municipalidad de Neuquén.
Transforma la siguiente transcripción o resumen de comunicación de obra en un considerando legal formal, claro, sintético y en pasado.

Tipo de comunicación: ${
          tipoVal === "Nota de Pedido"
            ? "Nota de Pedido (presentada por la empresa contratista a la Inspección de Obra)"
            : "Orden de Servicio (emitida por la Inspección de Obra a la contratista)"
        }
Número: ${numVal}
Texto original: "${textoVal}"

REGLAS ESTRICTAS DE REDACCIÓN TÉCNICO-LEGISLATIVA:
- Si es Nota de Pedido: DEBE comenzar exactamente con "Que mediante Nota de Pedido N° [X], la empresa contratista [manifestó / informó / solicitó / presentó] a la Inspección de Obra [reformulación clara y sintética en pasado];"
- Si es Orden de Servicio: DEBE comenzar exactamente con "Que mediante Orden de Servicio N° [X], la Inspección de Obra [otorgó conformidad / instruyó a la contratista / aprobó / informó a la contratista] [reformulación clara y sintética en pasado];"
- Debe terminar obligatoriamente con punto y coma (;).
- No agregues introducciones, citas entre comillas ni explicaciones, responde ÚNICAMENTE con el texto final del considerando.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 250,
              },
            }),
          }
        );

        if (response.ok) {
          const resData = await response.json();
          const candidate =
            resData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (candidate) {
            let sanitized = candidate.replace(/^["'`]+|["'`]+$/g, "").trim();
            if (!sanitized.endsWith(";")) {
              sanitized = sanitized.replace(/[\.;,]+$/, "") + ";";
            }
            return NextResponse.json({
              textoConsiderando: sanitized,
              source: "ai",
            });
          }
        }
      } catch (aiErr) {
        console.warn("AI generation error, using legal fallback reformulator:", aiErr);
      }
    }

    // 2. Reformulador técnico-jurídico determinístico de respaldo (fallback)
    const textoConsiderando = reformularComunicacionLegal(
      tipoVal,
      numVal,
      textoVal
    );

    return NextResponse.json({
      textoConsiderando,
      source: "rule-engine",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error al reformular la comunicación de obra." },
      { status: 500 }
    );
  }
}
