export type TipoAlteracionTramite =
  | "ampliacion_plazo"
  | "modificacion_volumen"
  | "volumen_y_plazo"
  | "paralizacion";

export type ModalidadTramite = "aprobacion" | "convalidacion";

export type NaturalezaContratacion = "obra" | "provision";

export interface DiagnosticoTramiteParams {
  tipoAlteracion: TipoAlteracionTramite;
  naturalezaContratacion?: NaturalezaContratacion;
  incorporaItemsNuevos?: boolean;
  modalidad?: ModalidadTramite;
}

export interface DocumentoRequerido {
  id: string;
  nombre: string;
  categoria:
    | "inicio"
    | "antecedentes"
    | "tecnica"
    | "comunicaciones"
    | "convalidacion"
    | "cierre";
  categoriaLabel: string;
  obligatorio: boolean;
  redactadoPor: string;
  firmadoPor: string;
  descripcion: string;
  reglaDestacada?: string;
  erroresComunes: string[];
  tieneModelo: boolean;
  modeloTexto?: string;
  consejoAlty?: string;
  fundamentoLegal?: string;
}

export interface ResultadoDiagnostico {
  tipoAlteracion: TipoAlteracionTramite;
  tipoAlteracionLabel: string;
  naturalezaContratacion: NaturalezaContratacion;
  naturalezaContratacionLabel: string;
  modalidad?: ModalidadTramite;
  modalidadLabel?: string;
  incorporaItemsNuevos: boolean;
  tituloCircuito: string;
  resumenCircuito: string;
  documentos: DocumentoRequerido[];
  totalObligatorios: number;
  plazoEstimadoTramitacion: string;
  competenciaNormativaSugerida: string;
}

// Modelos legales oficiales para el Drawer
export const MODELO_NOTA_INICIO = `Dirección Mesa General de Entradas y Salidas:

Por medio de la presente, se solicita Asignación de Alcance al Expediente OE- [NÚMERO DE EXPEDIENTE], para dar curso a la solicitud efectuada por Nota del Inspector a cargo de la Obra al Agente [NOMBRE DEL INSPECTOR], en la que se solicita UNA ALTERACIÓN CONTRACTUAL correspondiente a la Obra "[NOMBRE DE LA OBRA]".

Cabe aclarar que se procedió a la contratación de la Empresa "[DENOMINACIÓN SOCIAL DE LA EMPRESA]" quien resultó adjudicada mediante la [NORMA LEGAL DE ADJUDICACIÓN: RESOLUCIÓN / DECRETO N° ...].

Dentro de la Ley N° 687/72 de Obra Pública en el CAPÍTULO II art 8 se establece que será de aplicación lo dispuesto en la Ordenanza Municipal 937/1974.

"Artículo 8°: Previo al llamado a licitación, a la contratación directa o a la iniciación por vía administrativa de toda obra, trabajo o adquisición, deberá disponerse o estar autorizado el respectivo crédito legal y el específico destinado a su financiación, con más un adicional del 20% para ampliaciones, modificaciones, ítem nuevos e imprevistos, acorde con el monto de la obra que se prevea ejecutar anualmente. El importe resultante del 20% establecido, se reajustará en definitiva al monto resultante de la obra."

Sin otro particular, lo saludo atentamente.-`;

export const MODELO_NOTA_INSPECTOR_ALTERACION = `AL DIRECTOR GENERAL DE INSPECCIONES:

"Por medio de la presente, se informa que en la obra '[NOMBRE DE LA OBRA]', correspondiente al Expte. N.º [NÚMERO DE EXPEDIENTE], a cargo de la empresa '[DENOMINACIÓN SOCIAL DE LA EMPRESA]', se requiere la tramitación de una alteración contractual. Por tal motivo, se solicita la apertura y giro del expediente correspondiente para tal fin."`;

export const MODELO_NOTA_INSPECTOR_PARALIZACION = `AL DIRECTOR GENERAL DE INSPECCIONES:

"Por medio de la presente, se informa que en la obra '[NOMBRE DE LA OBRA]', correspondiente al Expte. N.º [NÚMERO DE EXPEDIENTE], a cargo de la empresa '[DENOMINACIÓN SOCIAL DE LA EMPRESA]', se requiere la tramitación de una paralización de obra. Por tal motivo, se solicita la apertura y giro del expediente correspondiente para tal fin."`;

export const MODELO_NOTA_PEDIDO = `NOTA DE PEDIDO N° [NÚMERO]
OBRA: "[NOMBRE COMPLETO DE LA OBRA]"
CONTRATISTA: [EMPRESA CONTRATISTA] - C.U.I.T. [CUIT]
EXPEDIENTE OE N° [NÚMERO]-M-[AÑO]

Neuquén Capital, [FECHA]

AL SEÑOR INSPECTOR DE OBRA:
[NOMBRE Y APELLIDO DEL INSPECTOR]

Por la presente, en mi carácter de Representante Técnico de la empresa contratista [EMPRESA CONTRATISTA], me dirijo a Ud. con el objeto de poner en su conocimiento y someter a su consideración la imperiosa necesidad de [SOLICITUD: tramitar una modificación de volumen / otorgar una ampliación de plazo contractual de X días corridos] para la ejecución de los trabajos de la obra de referencia.

FUNDAMENTACIÓN TÉCNICA Y CIRCUNSTANCIAS FÁCTICAS:
[Describir en forma clara y circunstanciada los hechos sobrevinientes, interferencias no previstas en subsuelo, modificaciones de proyecto impartidas por el Municipio, demoras justificadas por causales meteorológicas o provisión de materiales esenciales].

Por los motivos antes expuestos, se solicita formalmente:
1. La aprobación de la variación peticionada en el marco de la normativa vigente.
2. La adecuación correlativa del cronograma de obra y plazos de vigencia de las pólizas de garantía correspondientes.

A la espera de su respuesta mediante la respectiva Orden de Servicio, saluda a Ud. muy atentamente.

_______________________________________
Representante Técnico de la Contratista
Matrícula Profesional N° [MATRÍCULA]`;

export const MODELO_ORDEN_SERVICIO = `ORDEN DE SERVICIO N° [NÚMERO]
OBRA: "[NOMBRE COMPLETO DE LA OBRA]"
CONTRATISTA: [EMPRESA CONTRATISTA]
EXPEDIENTE OE N° [NÚMERO]-M-[AÑO]

Neuquén Capital, [FECHA]

A LA EMPRESA CONTRATISTA:
[NOMBRE DE LA EMPRESA CONTRATISTA]
PRESENTE

En respuesta a lo manifestado y solicitado por la empresa contratista mediante Nota de Pedido N° [NÚMERO DE NP] de fecha [FECHA DE NP], la Inspección de Obra informa y notifica a Ud. lo siguiente:

1. Que habiéndose analizado pormenorizadamente los fundamentos técnicos y antecedentes fácticos expuestos en la citada Nota de Pedido, esta Inspección constata la veracidad de los hechos y considera PROCEDENTE la tramitación de la [Ampliación de Plazo / Modificación de Volumen presupuestario] solicitada.

2. Que las modificaciones requeridas obedecen a razones de estricto interés público e indispensables para la culminación eficiente de la obra pública contratada.

3. Se le intima a presentar en el plazo perentorio de cuarenta y ocho (48) horas hábiles el Cuadro Comparativo definitivo con los cómputos métricos ajustados y el nuevo Plan de Trabajo readecuado para su ulterior elevación a la Superioridad.

Queda Ud. legal y debidamente notificado.

_______________________________________
Firma y Sello del Inspector de Obra
Dirección General de Inspecciones de Obras Públicas
Municipalidad de Neuquén

NOTIFICADO POR LA CONTRATISTA:
Fecha y Hora: _____/_____/_________  a las ______:______ hs.
Firma Representante Legal / Técnico: _______________________________________`;

export const MODELO_MEMORIA_DESCRIPTIVA = `MEMORIA DESCRIPTIVA DEL CUADRO COMPARATIVO N° [NÚMERO]
ALTERACIÓN CONTRACTUAL: [AMPLIACIÓN / DISMINUCIÓN / ÍTEMS NUEVOS]
OBRA: "[NOMBRE COMPLETO DE LA OBRA]"
CONTRATISTA: [EMPRESA CONTRATISTA]
EXPEDIENTE OE N° [NÚMERO]-M-[AÑO]

1. ANTECEDENTES CONTRACTUALES:
La obra de marras fue adjudicada mediante [Decreto / Resolución] N° [NRO/AÑO], firmándose el respectivo Contrato de Locación de Obra Pública con fecha [FECHA CONTRATO] por un monto total de $ [MONTO ORIGINAL] y un plazo contractual de ejecución de [DÍAS] días corridos.

2. JUSTIFICACIÓN DE LA MODIFICACIÓN DE VOLUMEN:
Durante el transcurso de la ejecución de los trabajos, surgieron contingencias técnicas en el terreno que obligaron a readecuar las cantidades originalmente presupuestadas:

A) ÍTEMS CONTRACTUALES EN MÁS (AUMENTOS):
- Ítem [N°]: [Designación del Ítem]. Cantidad contractual: [X]. Cantidad ejecutada/a ejecutar: [Y]. Diferencia en más: [Z]. Justificación técnica: [Explicar motivo de mayor volumen].

B) ÍTEMS CONTRACTUALES EN MENOS (DISMINUCIONES):
- Ítem [N°]: [Designación del Ítem]. Cantidad contractual: [X]. Nueva previsión: [Y]. Economía generada: [Z]. Justificación técnica: [Explicar causa de menor volumen o supresión de tareas].

C) ÍTEMS NUEVOS FUERA DE CONTRATO (De existir):
- Ítem Nuevo N° [N°]: [Descripción precisa]. Precio unitario acordado con Coeficiente K: $ [VALOR]. Justificación: [Razones por las cuales es indispensable su incorporación].

3. BALANCE FINANCIERO Y PORCENTAJE DE INCIDENCIA:
- Monto Aumentos Brutos: + $ [MONTO]
- Monto Disminuciones Brutas: - $ [MONTO]
- Variación Neta de Volumen: [+/-] $ [VARIACIÓN NETA]
- Porcentaje de Incidencia sobre Contrato Previo: [PORCENTAJE] %

4. CONCLUSIÓN TÉCNICA:
Se concluye que la presente modificación presupuestaria respeta los límites legales del Artículo [64 / 65] de la Ley N° 687 y resulta imprescindible para habilitar la funcionalidad de la infraestructura urbana en beneficio de los vecinos de la ciudad.

Neuquén Capital, [FECHA]

_______________________________________
Firma y Aprobación Técnica
Dirección de Obras Públicas / Inspección`;

export const MODELO_DISPOSICION_PARALIZACION = `DISPOSICIÓN N° [NÚMERO] / [AÑO]
SUBSECRETARÍA DE GESTIÓN DE CONTRATACIONES DE OBRAS PÚBLICAS
MUNICIPALIDAD DE NEUQUÉN

Neuquén Capital, [FECHA]

VISTO:
El expediente administrativo OE N° [NÚMERO]-M-[AÑO], caratulado: "[NOMBRE DE LA OBRA]", y;

CONSIDERANDO:
Que mediante Orden de Servicio N° [NRO] la Inspección de Obra ha constatado la imposibilidad temporal de proseguir con el normal desarrollo de los trabajos contratados en virtud de [CAUSALES: veda climática invernal / interferencias en servicios subterráneos no relevados / demoras imprevisibles];
Que en consecuencia, resulta imperioso declarar formalmente la suspensión temporal del cómputo de plazos contractuales a fin de resguardar el equilibrio económico y los derechos de las partes;
Que la Dirección de Asuntos Jurídicos ha tomado la intervención de su competencia;

POR ELLO:
LA SUBSECRETARIA DE GESTIÓN DE CONTRATACIONES DE OBRAS PÚBLICAS
DISPONE:

ARTÍCULO 1°: DECLÁRASE la [PARALIZACIÓN / DESPARALIZACIÓN Y REANUDACIÓN] de la obra "[NOMBRE DE LA OBRA]", adjudicada a la firma [EMPRESA CONTRATISTA], a partir del día [FECHA DE CESE/REINICIO].

ARTÍCULO 2°: FÍJASE la suspensión del plazo de obra por un lapso neto de [DÍAS] ([DÍAS EN LETRAS]) días corridos, suspendiéndose correlativamente los plazos contractuales de ejecución.

ARTÍCULO 3°: REGÍSTRESE, notifíquese a la empresa contratista, pase a la Dirección General de Inspecciones y Certificaciones, y archívese.`;

export function obtenerDiagnosticoTramitacion(
  params: DiagnosticoTramiteParams
): ResultadoDiagnostico {
  const {
    tipoAlteracion,
    naturalezaContratacion = "obra",
    incorporaItemsNuevos = false,
    modalidad,
  } = params;

  let tipoLabel = "";
  let circuitoTitulo = "";
  let circuitoResumen = "";
  let plazoEstimado = "15 a 25 días hábiles";
  let competencia = "Decreto del Órgano Ejecutivo Municipal";

  switch (tipoAlteracion) {
    case "ampliacion_plazo":
      tipoLabel = "Ampliación de Plazo";
      break;
    case "modificacion_volumen":
      tipoLabel = "Modificación de Volumen";
      break;
    case "volumen_y_plazo":
      tipoLabel = "Modificación de Volumen y Ampliación de Plazo";
      break;
    case "paralizacion":
      tipoLabel = "Paralización / Desparalización de Obra";
      break;
  }

  const modalidadLabel =
    modalidad === "convalidacion"
      ? "Por Convalidación Posterior (Hecho Consumado)"
      : "Por Aprobación Previa (Obra en Ejecución)";

  const naturalezaLabel =
    naturalezaContratacion === "provision"
      ? "Provisión / Suministro"
      : "Ejecución de Obra";

  // Documentos base comunes para inicio y antecedentes
  const docs: DocumentoRequerido[] = [];

  // 1. NOTA DE INICIO DE ACTUACIONES
  docs.push({
    id: "nota-inicio",
    nombre: "Nota de Inicio de Actuaciones Administrativas",
    categoria: "inicio",
    categoriaLabel: "1. Elevación e Inicio",
    obligatorio: true,
    redactadoPor:
      "Dirección General de Inspecciones y Subsecretaría de Planificación y Elaboración de Proyectos",
    firmadoPor:
      "Director General de Inspecciones y Subsecretario de Planificación y Elaboración de Proyectos.",
    descripcion:
      "Nota formal que encabeza el expediente y eleva la solicitud a la Dirección General de Mesa de Entradas y Salidas, detallando el objeto y sintetizando los antecedentes, con la suscripción de la Subsecretaría de Planificación y Elaboración de Proyectos.",
    erroresComunes: [
      "Omitir la firma del Director de Inspecciones acompañando al Inspector.",
      "No especificar con precisión el número de expediente OE de la obra base.",
      "No adjuntar el croquis ilustrativo o justificación de las zonas afectadas.",
    ],
    tieneModelo: true,
    modeloTexto: MODELO_NOTA_INICIO,
    consejoAlty:
      "Esta nota debe ser la primera foja del nuevo cuerpo o alcance del expediente. Asegurate de que tenga el sello de cargo de entrada.",
    fundamentoLegal: "Ley Provincial N° 687 - Artículos 58, 64 y concs.",
  });

  // 2. NOTA DEL INSPECTOR (Y CROQUIS DE UBICACIÓN CONDICIONAL SEGÚN NATURALEZA)
  if (naturalezaContratacion === "provision") {
    docs.push({
      id: "nota-inspector-croquis",
      nombre: "Nota del inspector de obra",
      categoria: "inicio",
      categoriaLabel: "1. Elevación e Inicio",
      obligatorio: true,
      redactadoPor: "Inspector de Obra",
      firmadoPor: "Inspector de Obra (firma exclusiva).",
      descripcion:
        "Nota del Inspector de Obra dirigida a la Dirección General de Inspecciones solicitando la apertura y giro del expediente para la tramitación de la alteración.",
      erroresComunes: [
        "Omitir la fundamentación de necesidad o el impacto en el servicio público que motiva la modificación de cantidades.",
        "No detallar las especificaciones técnicas de los bienes o suministros a incorporar o modificar.",
      ],
      tieneModelo: true,
      modeloTexto:
        tipoAlteracion === "paralizacion"
          ? MODELO_NOTA_INSPECTOR_PARALIZACION
          : MODELO_NOTA_INSPECTOR_ALTERACION,
      consejoAlty:
        "Al tratarse de una provisión o suministro, no se exige croquis territorial ni de ubicación geográfica.",
      fundamentoLegal:
        "Ley Provincial N° 687 - Pliego de Bases y Condiciones de Suministros.",
    });
  } else {
    docs.push({
      id: "nota-inspector-croquis",
      nombre: "Nota del inspector y croquis de ubicación",
      categoria: "inicio",
      categoriaLabel: "1. Elevación e Inicio",
      obligatorio: true,
      redactadoPor: "Inspector de Obra Municipal",
      firmadoPor: "Inspector de Obra (firma exclusiva).",
      descripcion:
        "Nota del Inspector de Obra dirigida a la Dirección General de Inspecciones solicitando la apertura y giro del expediente para la tramitación de la alteración.",
      reglaDestacada:
        "📎 REQUISITO DE ADJUNCIÓN: La nota debe ser acompañada obligatoriamente por el croquis de ubicación geográfica y progresivas de la obra en escala.",
      erroresComunes: [
        "Croquis sin escala, sin norte geográfico o sin firma del profesional actuante.",
        "Discrepancia entre las progresivas descriptas en la nota y el croquis gráfico.",
        "Omitir la identificación clara de los sectores intervenidos.",
      ],
      tieneModelo: true,
      modeloTexto:
        tipoAlteracion === "paralizacion"
          ? MODELO_NOTA_INSPECTOR_PARALIZACION
          : MODELO_NOTA_INSPECTOR_ALTERACION,
      consejoAlty:
        "Si la obra comprende varias calles o barrios, identificá cada sector con colores diferenciados para facilitar la revisión del Asesor Legal.",
      fundamentoLegal: "Pliego General de Bases y Condiciones - Art. 14.",
    });
  }

  // 3. ANTECEDENTES AUTENTICADOS (COPIAS FIELES)
  docs.push({
    id: "antecedentes-certificados",
    nombre:
      "Documentación Antecedente Certificada (Contrato, Adjudicación, Replanteo)",
    categoria: "antecedentes",
    categoriaLabel: "2. Antecedentes del Contrato",
    obligatorio: true,
    redactadoPor: "Mesa de Entradas / Dirección de Despacho",
    firmadoPor:
      "Funcionario facultado con sello 'Es Copia Fiel del Original'",
    descripcion:
      "Juego completo de fotocopias certificadas: Contrato original, Norma legal de adjudicación, Acta de Inicio y Replanteo, y normas de alteraciones precedentes (Adendas anteriores, Decretos o Disposiciones).",
    erroresComunes: [
      "Adjuntar fotocopias simples sin el sello y firma de 'Es Copia Fiel'.",
      "Omitir las normas de variaciones anteriores si la obra ya tuvo adendas o paralizaciones previas.",
      "Acta de replanteo ilegible o sin la fecha cierta de inicio de cómputo.",
    ],
    tieneModelo: false,
    consejoAlty:
      "Sin la certificación formal de copia fiel de la adjudicación y del contrato, la Asesoría Letrada devolverá el expediente con observaciones de forma.",
    fundamentoLegal: "Ordenanza Municipal de Procedimiento Administrativo N° 12.000.",
  });

  // 4. ÓRDENES DE SERVICIO Y NOTAS DE PEDIDO (CON REGLA TEMPORAL RESALTADA)
  if (tipoAlteracion !== "paralizacion") {
    docs.push({
      id: "ordenes-notas-pedido",
      nombre: "Órdenes de Servicio y Notas de Pedido Correlativas",
      categoria: "comunicaciones",
      categoriaLabel: "3. Comunicaciones Oficiales de Obra",
      obligatorio: true,
      redactadoPor:
        "Contratista (Notas de Pedido) e Inspector de Obra (Órdenes de Servicio)",
      firmadoPor:
        "Representante Técnico de la Contratista e Inspector de Obra",
      descripcion:
        "Cadena ininterrumpida de Notas de Pedido de la empresa solicitando la alteración y Órdenes de Servicio de la Inspección otorgando conformidad técnica previa.",
      reglaDestacada:
        "CORRELACIÓN TEMPORAL OBLIGATORIA: Las Notas de Pedido (presentadas por la contratista) y las Órdenes de Servicio (emitidas por la Inspección de Obra) deben tener fecha anterior a la Nota de Solicitud de Alteración que el Inspector dirige al Director General de Inspecciones. No se admiten comunicaciones de obra con fecha posterior a la solicitud de apertura de expediente.",
      erroresComunes: [
        "⚠️ CORRELACIÓN TEMPORAL INVÁLIDA: Presentar Notas de Pedido u Órdenes de Servicio con fecha posterior a la Nota de Solicitud de Alteración que el Inspector dirige al Director General de Inspecciones.",
        "Inconsistencia en la correlatividad de fechas (una OS con fecha anterior a la NP que responde).",
        "Falta de constancia de notificación fehaciente (firma, aclaración y hora de recepción).",
        "Texto de la OS ambiguo que no deja en claro si se autoriza o no el trabajo.",
      ],
      tieneModelo: true,
      modeloTexto: `REGLA DE CORRELACIÓN TEMPORAL OBLIGATORIA:\nLas Notas de Pedido (presentadas por la contratista) y las Órdenes de Servicio (emitidas por la Inspección de Obra) DEBEN tener fecha anterior a la Nota de Solicitud de Alteración que el Inspector dirige al Director General de Inspecciones. No se admiten comunicaciones de obra con fecha posterior a la solicitud de apertura de expediente.\n\n=== NOTA DE PEDIDO MODELO ===\n${MODELO_NOTA_PEDIDO}\n\n=== ORDEN DE SERVICIO MODELO ===\n${MODELO_ORDEN_SERVICIO}`,
      consejoAlty:
        "¡Atención cronológica!: La fecha de la última Orden de Servicio que da curso a la alteración debe ser previa a la nota con la que se solicita la apertura del expediente de alteración ante el Director General.",
      fundamentoLegal: "Ley N° 687 - Artículos 42 y 43.",
    });
  }

  // REGLAS ESPECÍFICAS PARA VOLUMEN (Modificación de Volumen o Volumen y Plazo)
  if (
    tipoAlteracion === "modificacion_volumen" ||
    tipoAlteracion === "volumen_y_plazo"
  ) {
    // 5. MEMORIA DESCRIPTIVA DEL CUADRO COMPARATIVO
    docs.push({
      id: "memoria-descriptiva",
      nombre: "Memoria Descriptiva del Cuadro Comparativo de Modificaciones",
      categoria: "tecnica",
      categoriaLabel: "4. Justificación Técnica Presupuestaria",
      obligatorio: true,
      redactadoPor: "Inspección de Obra / Dirección de Proyectos",
      firmadoPor:
        "Inspector de Obra y Director de Obras Públicas",
      descripcion:
        "Documento que explica exhaustivamente las razones técnicas que motivan el aumento o disminución de cada ítem presupuestario, su necesidad y su impacto en la obra.",
      erroresComunes: [
        "Explicaciones genéricas como 'por razones de obra' sin respaldo técnico concreto.",
        "Discrepancia entre los ítems citados en la Memoria y los números de ítem del Cuadro Comparativo.",
        "Omitir el cálculo de la incidencia porcentual sobre el contrato original.",
      ],
      tieneModelo: true,
      modeloTexto: MODELO_MEMORIA_DESCRIPTIVA,
      consejoAlty:
        "Si la variación supera el 20% del contrato original, la Memoria debe reforzar especialmente por qué no era previsible en el proyecto licitatorio base.",
      fundamentoLegal: "Ley N° 687 - Art. 64.",
    });

    // 6. CUADRO COMPARATIVO DE MODIFICACIONES PRESUPUESTARIAS
    docs.push({
      id: "cuadro-comparativo",
      nombre:
        "Cuadro Comparativo de Modificaciones Presupuestarias (Planilla Oficial)",
      categoria: "tecnica",
      categoriaLabel: "4. Justificación Técnica Presupuestaria",
      obligatorio: true,
      redactadoPor: "Área Técnica / Cómputos y Presupuestos",
      firmadoPor:
        "Inspector de Obra, Director de Obras y Representante Técnico",
      descripcion:
        "Planilla de balance financiero que detalla para cada ítem: cómputo original, precio unitario contractual, modificaciones en más o en menos, importes parciales y saldo contractual resultante.",
      erroresComunes: [
        "Errores aritméticos en la suma algebraica de montos aumentados y disminuidos.",
        "Modificar los precios unitarios básicos (deben conservarse idénticos a los del contrato base).",
        "No consignar el porcentaje neto de alteración al pie de la planilla.",
      ],
      tieneModelo: false,
      consejoAlty:
        "Verificá que el monto final coincida exactamente al centavo con el que figura en el proyecto de Adenda y en la Carátula de Control de Expediente.",
      fundamentoLegal: "Ley N° 687 - Art. 65.",
    });

    // 7. INFORME DE CÓMPUTO Y PRESUPUESTO DE ÍTEMS NUEVOS (SI APLICA)
    if (incorporaItemsNuevos) {
      docs.push({
        id: "informe-items-nuevos",
        nombre:
          "Informe de Análisis de Precios de Ítems Nuevos y Coeficiente de Pase (k)",
        categoria: "tecnica",
        categoriaLabel: "4. Justificación Técnica Presupuestaria",
        obligatorio: true,
        redactadoPor: "Dirección de Obras Públicas / Certificaciones",
        firmadoPor:
          "Inspector de Obra, Especialista en Costos y Director General",
        descripcion:
          "Desglose pormenorizado del costo de los ítems no previstos originalmente: materiales, mano de obra, equipos, y aplicación obligatoria del coeficiente de paso 'k' de la oferta adjudicada.",
        erroresComunes: [
          "Precios unitarios fijados a valores actuales sin retrotraer al mes base del contrato original.",
          "Omitir el análisis de rendimientos o presupuesto testigo de referencia.",
          "Falta de conformidad explícita de la contratista respecto al precio unitario convenido.",
        ],
        tieneModelo: false,
        consejoAlty:
          "Recordá: ningún ítem nuevo puede presupuestarse a valores de plaza sin aplicarle la relación de rebaja o coeficiente 'k' del contrato de adjudicación.",
        fundamentoLegal: "Ley N° 687 - Art. 64 último párrafo.",
      });
    }
  }

  // REGLAS ESPECÍFICAS PARA PLAZO (Ampliación de Plazo o Volumen y Plazo)
  if (
    tipoAlteracion === "ampliacion_plazo" ||
    tipoAlteracion === "volumen_y_plazo"
  ) {
    // 8. PLAN DE TRABAJO Y CURVA DE INVERSIONES
    docs.push({
      id: "plan-trabajo-curva",
      nombre:
        "Plan de Trabajo y Curva de Inversiones Readecuada (Sin firma de contratista)",
      categoria: "tecnica",
      categoriaLabel: "5. Cronograma de Inversiones",
      obligatorio: true,
      redactadoPor: "Inspección de Obra y Dirección de Obras",
      firmadoPor:
        "Exclusivamente Inspector de Obra y Director General de Inspecciones",
      descripcion:
        "Cronograma gráfico de barras (Gantt) y curva financiera de certificaciones mensuales proyectadas hasta el nuevo vencimiento contractual calculado.",
      erroresComunes: [
        "¡CRÍTICO!: Incluir la firma de la empresa contratista en el Plan de Trabajo de la alteración (la normativa prohíbe que el contratista suscriba la propuesta técnica de readecuación previa al acto formal).",
        "Discrepancia entre los días corridos de ampliación del gráfico y los indicados en la nota de elevación.",
        "No recalcular la fecha exacta de finalización contractual prevista.",
      ],
      tieneModelo: false,
      consejoAlty:
        "¡Atención rigurosa!: El Plan de Trabajo de la alteración NO debe llevar firma de la contratista. Solo firman el Inspector y el Director de Obras Municipales.",
      fundamentoLegal:
        "Resolución General de Obras Públicas N° 045/18 y Ley N° 687.",
    });
  }

  // REGLAS ESPECÍFICAS PARA CONVALIDACIÓN (Obra finalizada / Hecho consumado)
  if (modalidad === "convalidacion") {
    // 9. ACTA DE RECEPCIÓN PROVISORIA CERTIFICADA
    docs.push({
      id: "acta-recepcion-provisoria",
      nombre: "Acta de Recepción Provisoria de la Obra (Copia Certificada)",
      categoria: "convalidacion",
      categoriaLabel: "6. Requisitos Obligatorios de Convalidación",
      obligatorio: true,
      redactadoPor:
        "Comisión de Recepción / Dirección General de Obras Públicas",
      firmadoPor:
        "Inspector, Directores Municipales y Representante de la Contratista",
      descripcion:
        "Acta formal que acredita que los trabajos se encuentran efectivamente concluidos y recibidos de conformidad por el Municipio con fecha cierta.",
      erroresComunes: [
        "Presentar el acta sin certificación de copia fiel.",
        "Discrepancia entre la fecha efectiva de finalización consignada en el Acta y la solicitada en el proyecto de norma legal.",
        "Acta con observaciones o reservas pendientes no subsanadas.",
      ],
      tieneModelo: false,
      consejoAlty:
        "La fecha de finalización efectiva que se convalida en la norma legal DEBE coincidir con la fecha exacta del Acta de Recepción Provisoria.",
      fundamentoLegal: "Ley N° 687 - Artículos 70 y 71.",
    });

    // 10. FOJA DE MEDICIÓN FINAL MODELO
    docs.push({
      id: "foja-medicion-final",
      nombre:
        "Foja de Medición Final Modelo y Curva Acumulada Real (100% de Obra)",
      categoria: "convalidacion",
      categoriaLabel: "6. Requisitos Obligatorios de Convalidación",
      obligatorio: true,
      redactadoPor: "Inspección de Obra y Dirección de Certificaciones",
      firmadoPor:
        "Inspector de Obra y Director de Certificaciones Municipales",
      descripcion:
        "Planilla técnica que certifica el 100.00% del avance físico real acumulado de la obra, demostrando la ejecución de los ítems a convalidar.",
      erroresComunes: [
        "Planilla con saldo pendiente o avance menor al 100%.",
        "Falta de visado por parte del Director de Certificaciones de Obras.",
        "Diferencia entre los cómputos métricos de la medición final y el Cuadro Comparativo definitivo.",
      ],
      tieneModelo: false,
      consejoAlty:
        "La foja de medición final demuestra que la convalidación es un acto de regularización de hecho consumado y no un proyecto futuro.",
      fundamentoLegal: "Pliego General - Cláusula de Certificación Final.",
    });
  }

  // REGLAS ESPECÍFICAS PARA PARALIZACIÓN / DESPARALIZACIÓN
  if (tipoAlteracion === "paralizacion") {
    circuitoTitulo =
      "Circuito Administrativo de Paralización / Desparalización Oficial";
    circuitoResumen =
      "Procedimiento formal de cese transitorio y posterior reanudación de obra con suspensión del cómputo de plazos por causas no imputables a la contratista.";
    plazoEstimado = "10 a 20 días hábiles";
    competencia =
      "Disposición de la Subsecretaría de Gestión de Contrataciones";

    // Reemplazamos/ajustamos ítems para paralización
    docs.push({
      id: "comunicaciones-paralizacion",
      nombre:
        "Órdenes y Notas de Paralización + Disposición de Cese",
      categoria: "tecnica",
      categoriaLabel: "3. Actos Formales de Cese Transitorio",
      obligatorio: true,
      redactadoPor: "Inspección de Obra y Subsecretaría",
      firmadoPor:
        "Inspector de Obra, Representante Técnico y Subsecretaria",
      descripcion:
        "Nota de Pedido denunciando la causal de detención, Orden de Servicio de cese y Disposición emitida por la Subsecretaría declarando la paralización oficial y fijando la fecha de suspensión de plazos.",
      erroresComunes: [
        "Dejar transcurrir meses de paralización de hecho sin emitir la Disposición formal de cese.",
        "No realizar el inventario minucioso de materiales y estado de conservación en el sitio.",
      ],
      tieneModelo: true,
      modeloTexto: MODELO_DISPOSICION_PARALIZACION,
      consejoAlty:
        "La Disposición de Paralización es el único acto administrativo válido para suspender el reloj de los plazos de vencimiento contractual.",
      fundamentoLegal: "Ley N° 687 - Art. 59.",
    });

    docs.push({
      id: "comunicaciones-desparalizacion",
      nombre:
        "Órdenes y Notas de Desparalización + Disposición de Reinicio",
      categoria: "tecnica",
      categoriaLabel: "4. Actos Formales de Reinicio",
      obligatorio: true,
      redactadoPor: "Inspección de Obra y Subsecretaría",
      firmadoPor:
        "Inspector de Obra, Representante Técnico y Subsecretaria",
      descripcion:
        "Orden de Servicio ordenando la reanudación de los trabajos, Nota de Pedido de acuse de reinicio y Disposición que liquida el total neto de días corridos suspendidos.",
      erroresComunes: [
        "Superposición de días computables entre el cese y la reanudación.",
        "No verificar la cobertura del seguro contra accidentes de trabajo al momento de reabrir el obrador.",
      ],
      tieneModelo: true,
      modeloTexto: MODELO_DISPOSICION_PARALIZACION,
      consejoAlty:
        "El balance neto de días entre la fecha de cese y la de reinicio determina la traslación automática de la fecha de vencimiento contractual.",
      fundamentoLegal: "Ley N° 687 - Art. 59 y 60.",
    });

    docs.push({
      id: "plan-trabajo-reinicio",
      nombre:
        "Plan de Trabajo y Curva de Inversiones Readecuada a la Fecha de Reinicio",
      categoria: "tecnica",
      categoriaLabel: "5. Cronograma Readecuado",
      obligatorio: true,
      redactadoPor: "Inspección de Obra y Dirección de Obras",
      firmadoPor:
        "Exclusivamente Inspector de Obra y Director de Inspecciones",
      descripcion:
        "Cronograma financiero reprogramado a partir de la fecha de reinicio efectiva, sin firmas de la empresa contratista.",
      erroresComunes: [
        "Incluir firmas de la contratista en el Plan de Trabajo interno.",
        "Calcular mal el nuevo vencimiento contractual sin sumar con exactitud los días netos de suspensión.",
      ],
      tieneModelo: false,
      consejoAlty:
        "El nuevo cronograma debe calibrarse exclusivamente con los volúmenes de obra que quedaron pendientes al momento de paralizar.",
      fundamentoLegal: "Resolución N° 045/18.",
    });

    docs.push({
      id: "pase-asesoramiento-legal",
      nombre:
        "Pase a Asesoramiento Legal con Visado de Certificaciones",
      categoria: "cierre",
      categoriaLabel: "6. Dictamen Jurídico y Elevación",
      obligatorio: true,
      redactadoPor: "Dirección de Despacho y Asesoría Letrada",
      firmadoPor:
        "Director de Certificaciones y Asesor Legal Municipal",
      descripcion:
        "Dictamen legal que verifica que la paralización no generó indemnizaciones por gastos improductivos no reconocidos y ratifica la extensión de garantías.",
      erroresComunes: [
        "Omitir el visado previo del área contable de certificaciones.",
        "No acompañar el endoso de prórroga de la póliza de caución.",
      ],
      tieneModelo: false,
      consejoAlty:
        "El dictamen legal es el paso previo ineludible antes de la firma de la Disposición de cierre por parte de la Subsecretaria.",
      fundamentoLegal: "Ley N° 687 - Art. 78 y Ordenanza N° 12.000.",
    });
  } else {
    // PASE FINAL PARA CASOS ORDINARIOS (PLAZO / VOLUMEN)
    docs.push({
      id: "pase-subsecretaria",
      nombre: "Providencia de Pase a Subsecretaría de Obras Públicas",
      categoria: "cierre",
      categoriaLabel: "7. Cierre y Elevación Final",
      obligatorio: true,
      redactadoPor: "Dirección General de Obras Públicas",
      firmadoPor: "Director General de Obras Públicas",
      descripcion:
        "Pase final de elevación que constata que todas las fojas precedentes cumplen con la foliatura ininterrumpida y solicita la emisión del Proyecto de Adenda y Decreto/Resolución.",
      erroresComunes: [
        "Fojas sueltas sin foliar o foliatura doble/tachada.",
        "Falta de remisión del expediente con todas las adendas anteriores correlacionadas.",
      ],
      tieneModelo: false,
      consejoAlty:
        "Antes de enviar el expediente a la Subsecretaría, utilizá la Carátula de Control de Expediente generada en PDF para abrochar en la contratapa del primer cuerpo.",
      fundamentoLegal: "Ordenanza N° 12.000 de Procedimiento Administrativo.",
    });

    circuitoTitulo = `Circuito de Tramitación: ${tipoLabel} (${modalidadLabel})`;
    circuitoResumen =
      modalidad === "convalidacion"
        ? "Trámite de regularización administrativa de variaciones ejecutadas con obra finalizada. Exige acreditar la conclusión de los trabajos mediante Acta de Recepción Provisoria y Foja de Medición Final."
        : "Trámite previo o concomitante a la ejecución de las variaciones. Asegura el respaldo legal y financiero antes de la finalización de los plazos contractuales vigentes.";

    // Competencia normativa
    competencia =
      modalidad === "convalidacion"
        ? "Decreto del Órgano Ejecutivo Municipal (Convalidación indelegable)"
        : tipoAlteracion === "ampliacion_plazo"
        ? "Resolución de Secretaría / Subsecretaría (o Decreto si supera pautas de delegación)"
        : "Decreto del Órgano Ejecutivo Municipal";
  }

  const totalObligatorios = docs.filter((d) => d.obligatorio).length;

  return {
    tipoAlteracion,
    tipoAlteracionLabel: tipoLabel,
    naturalezaContratacion,
    naturalezaContratacionLabel: naturalezaLabel,
    modalidad,
    modalidadLabel: tipoAlteracion !== "paralizacion" ? modalidadLabel : undefined,
    incorporaItemsNuevos,
    tituloCircuito: circuitoTitulo,
    resumenCircuito: circuitoResumen,
    documentos: docs,
    totalObligatorios,
    plazoEstimadoTramitacion: plazoEstimado,
    competenciaNormativaSugerida: competencia,
  };
}
