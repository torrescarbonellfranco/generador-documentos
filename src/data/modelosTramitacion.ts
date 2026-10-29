export interface ModeloItem {
  id: string;
  titulo: string;
  firmantes: string;
  reglaTemporal?: string;
  recomendacion?: string;
  observaciones?: string;
  calloutDestacado?: string;
  modalidad?: 'aprobacion' | 'convalidacion';
  texto: string;
}

export const MODELOS_TRAMITACION: Record<string, ModeloItem[]> = {
  nota_inicio: [
    {
      id: 'nota-inicio',
      titulo: 'Nota de Elevación y Solicitud de Asignación de Alcance',
      firmantes: 'Director General de Inspecciones y Subsecretario de Planificación y Elaboración de Proyectos.',
      observaciones: 'Nota formal que encabeza el expediente y eleva la solicitud a la Dirección General de Mesa de Entradas y Salidas, detallando el objeto y sintetizando los antecedentes, con la suscripción de la Subsecretaría de Planificación y Elaboración de Proyectos.',
      recomendacion: '💡 RECOMENDACIÓN ESTRATÉGICA DEL ÁREA: Se aconseja solicitar la tramitación de una "Alteración Contractual" en términos generales y amplios, sin encasillarla taxativamente a un solo tipo (como solo plazo o solo volumen). Esto evita restricciones procedimentales si durante la sustanciación surge la necesidad técnica de incorporar modificaciones complementarias.',
      texto: `Dirección Mesa General de Entradas y Salidas:

Por medio de la presente, se solicita Asignación de Alcance al Expediente OE- [NÚMERO DE EXPEDIENTE], para dar curso a la solicitud efectuada por Nota del Inspector a cargo de la Obra al Agente [NOMBRE DEL INSPECTOR], en la que se solicita UNA ALTERACIÓN CONTRACTUAL correspondiente a la Obra "[NOMBRE DE LA OBRA]".

Cabe aclarar que se procedió a la contratación de la Empresa "[DENOMINACIÓN SOCIAL DE LA EMPRESA]" quien resultó adjudicada mediante la [NORMA LEGAL DE ADJUDICACIÓN: RESOLUCIÓN / DECRETO N° ...].

Dentro de la Ley N° 687/72 de Obra Pública en el CAPÍTULO II art 8 se establece que será de aplicación lo dispuesto en la Ordenanza Municipal 937/1974.

"Artículo 8°: Previo al llamado a licitación, a la contratación directa o a la iniciación por vía administrativa de toda obra, trabajo o adquisición, deberá disponerse o estar autorizado el respectivo crédito legal y el específico destinado a su financiación, con más un adicional del 20% para ampliaciones, modificaciones, ítem nuevos e imprevistos, acorde con el monto de la obra que se prevea ejecutar anualmente. El importe resultante del 20% establecido, se reajustará en definitiva al monto resultante de la obra."

Sin otro particular, lo saludo atentamente.-`
    }
  ],
  nota_inspector: [
    {
      id: 'nota-inspector-alteracion',
      titulo: 'Nota del Inspector al Director General (Alteración Contractual)',
      firmantes: 'Inspector de Obra (firma exclusiva).',
      observaciones: '• Genérica y abierta: No limita el trámite a una sola causal. Permite tramitar conjuntamente modificaciones de volumen (aumentos/disminuciones), ítems nuevos y ampliación de plazos en un mismo expediente.\n• Firma exclusiva: Es suscripta únicamente por el Inspector de Obra.',
      recomendacion: '📎 REQUISITO DE ADJUNCIÓN: La nota debe ser acompañada obligatoriamente por el croquis de ubicación geográfica y progresivas de la obra en escala.',
      texto: `AL DIRECTOR GENERAL DE INSPECCIONES:

"Por medio de la presente, se informa que en la obra '[NOMBRE DE LA OBRA]', correspondiente al Expte. N.º [NÚMERO DE EXPEDIENTE], a cargo de la empresa '[DENOMINACIÓN SOCIAL DE LA EMPRESA]', se requiere la tramitación de una alteración contractual. Por tal motivo, se solicita la apertura y giro del expediente correspondiente para tal fin."`
    },
    {
      id: 'nota-inspector-paralizacion',
      titulo: 'Nota del Inspector al Director General (Paralización de Obra)',
      firmantes: 'Inspector de Obra (firma exclusiva).',
      observaciones: '• Genérica y abierta: Solicitud formal de paralización de obra dirigida a la Dirección General para apertura y giro del expediente.\n• Firma exclusiva: Es suscripta únicamente por el Inspector de Obra.',
      recomendacion: '📎 REQUISITO DE ADJUNCIÓN: La nota debe ser acompañada obligatoriamente por el croquis de ubicación geográfica y progresivas de la obra en escala.',
      texto: `AL DIRECTOR GENERAL DE INSPECCIONES:

"Por medio de la presente, se informa que en la obra '[NOMBRE DE LA OBRA]', correspondiente al Expte. N.º [NÚMERO DE EXPEDIENTE], a cargo de la empresa '[DENOMINACIÓN SOCIAL DE LA EMPRESA]', se requiere la tramitación de una paralización de obra. Por tal motivo, se solicita la apertura y giro del expediente correspondiente para tal fin."`
    }
  ],
  ordenes_y_notas: [
    {
      id: 'caso-1-plazo',
      titulo: 'Caso 1: Solo Ampliación de Plazo',
      firmantes: 'Representante Técnico de la Empresa, Inspector de Obra, y sello de copia fiel del Director General de Inspecciones.',
      observaciones: 'Indicar con total exactitud los días corridos en ambas notas. Fechas anteriores a la solicitud de apertura.',
      reglaTemporal: '⚠️ CORRELACIÓN TEMPORAL: Deben estar fechadas obligatoriamente con anterioridad a la Nota de Solicitud de Alteración del Inspector.',
      texto: `NOTA DE PEDIDO N° [...] (Empresa Contratista):
"Por medio de la presente, informamos a la Inspección de Obra que, debido a [justificación técnica, demoras climáticas o interferencias insalvables], se han originado demoras involuntarias y no imputables a esta parte en el normal avance del plan de trabajos contratado. Por tal motivo, se solicita formalmente una ampliación del plazo de ejecución contractual de [...] (...) días corridos a efectos de alcanzar la culminación integral de los trabajos."

ORDEN DE SERVICIO N° [...] (Inspección de Obra):
"Por medio de la presente, y en relación a la Nota de Pedido N° [...] formulada por la empresa contratista, esta Inspección de Obra toma debido conocimiento de los motivos expuestos y presta formal conformidad a la solicitud de ampliación de plazo requerida por un total de [...] (...) días corridos. En consecuencia, se procederá a gestionar la alteración contractual correspondiente por ante las dependencias municipales competentes."`
    },
    {
      id: 'caso-2-volumen-items-nuevos',
      titulo: 'Caso 2: Modificación de Volumen (Cantidades Mal Estimadas + Ítems Nuevos) y Plazo',
      firmantes: 'Representante Técnico de la Empresa, Inspector de Obra, y sello de copia fiel del Director General de Inspecciones.',
      observaciones: 'Especificar si el aumento/disminución es por error de estimación o tareas que se suprimen. En ítems nuevos, detallar la calle exacta para dar intervención a Promoción y Recupero de Obras.',
      reglaTemporal: '⚠️ CORRELACIÓN TEMPORAL: Deben estar fechadas obligatoriamente con anterioridad a la Nota de Solicitud de Alteración del Inspector.',
      texto: `NOTA DE PEDIDO N° [...] (Empresa Contratista):
"Por medio de la presente, se informa a la Inspección que, según el relevamiento en obra, se constataron diferencias técnicas respecto al proyecto original:

1. Disminución de ítems: Se justifica la disminución de los Ítems N°: [1, 4 y 5] debido a que las cantidades proyectadas resultaron excesivas según el terreno real, dejándose de ejecutar dichos volúmenes por no ser necesarios.
2. Incremento de ítems: Se justifica el aumento de los Ítems N°: [15 y 16] dado que las cantidades estimadas en el proyecto resultaron insuficientes para cubrir los requerimientos reales de la obra.
3. Ítems Nuevos: Resulta indispensable la ejecución del nuevo ítem: 'Construcción de Desagüe de PVC 500 mm' (o nueva pavimentación), a ejecutarse en calle [NOMBRE], entre [CALLE 1] y [CALLE 2], adjuntándose el análisis de precios correspondiente.
4. Plazo: Por los mayores trabajos a ejecutar, se solicita una ampliación de plazo de [...] (...) días corridos.

Por lo expuesto, solicitamos se preste conformidad y se gestione la correspondiente alteración contractual."

ORDEN DE SERVICIO N° [...] (Inspección de Obra):
"En relación a la Nota de Pedido N° [...], esta Inspección constató técnicamente la insuficiencia y/o exceso en las cantidades estimadas del proyecto original, y la necesidad de ejecutar los nuevos trabajos en calle [CALLE] entre [CALLE 1] y [CALLE 2]. Por lo expuesto, presto conformidad a las modificaciones de cantidades solicitadas, dejo constancia de la recepción del análisis de precios del ítem nuevo y presto conformidad a la ampliación de plazo de [...] (...) días corridos, procediéndose a la tramitación de la alteración contractual."`
    },
    {
      id: 'caso-3-volumen-sin-items-nuevos',
      titulo: 'Caso 3: Variación de Cantidades sin Ítems Nuevos y Plazo',
      firmantes: 'Representante Técnico de la Empresa, Inspector de Obra, y sello de copia fiel del Director General de Inspecciones.',
      observaciones: 'Citar números de ítems aumentados y disminuidos sin necesidad de nombres extensos. Indicar días de prórroga si aplica.',
      reglaTemporal: '⚠️ CORRELACIÓN TEMPORAL: Deben estar fechadas obligatoriamente con anterioridad a la Nota de Solicitud de Alteración del Inspector.',
      texto: `NOTA DE PEDIDO N° [...] (Empresa Contratista):
"Por la presente, informamos que tras las verificaciones en obra se constataron errores de estimación en el proyecto: se justifica la disminución de los Ítems N°: [1, 4 y 5] por haberse proyectado cantidades en exceso no requeridas en obra, y el incremento de los Ítems N°: [15 y 16] dado que las cantidades del pliego resultaron insuficientes para la obra. Al resultar un mayor volumen efectivo de trabajo, se solicita gestionar la alteración contractual y una ampliación de plazo de [...] (...) días corridos."

ORDEN DE SERVICIO N° [...] (Inspección de Obra):
"En respuesta a la Nota de Pedido N° [...], esta Inspección presta conformidad a las modificaciones de cantidades informadas y a la ampliación de plazo de [...] (...) días corridos solicitada, atento a que responden a la realidad de la obra por insuficiencia del cómputo original. Se procederá a gestionar la correspondiente alteración contractual."`
    },
    {
      id: 'caso-paralizacion',
      titulo: 'Paralización Transitoria de Obra',
      firmantes: 'Representante Técnico de la Empresa, Inspector de Obra, y sello de copia fiel del Director General de Inspecciones.',
      observaciones: 'Indicar la fecha exacta de suspensión y justificación de fuerza mayor. Días netos de balance.',
      reglaTemporal: '⚠️ CORRELACIÓN TEMPORAL: Deben estar fechadas obligatoriamente con anterioridad a la Nota de Solicitud de Alteración del Inspector.',
      texto: `NOTA DE PEDIDO N° [...] (Empresa Contratista):
"Por medio de la presente, informamos a la Inspección de Obra que, debido a [justificación técnica, climática o causa de fuerza mayor], resulta técnica y materialmente inviable la prosecución de los trabajos en el frente de obra. En consecuencia, se solicita disponer la paralización transitoria de la obra a partir del día [FECHA DE SUSPENSIÓN] hasta tanto se configuren las condiciones propicias para su reanudación efectiva."

ORDEN DE SERVICIO N° [...] (Inspección de Obra):
"En atención a lo manifestado por la empresa contratista mediante Nota de Pedido N° [...], esta Inspección de Obra constata la veracidad de las causales invocadas y presta formal conformidad a la paralización transitoria de los trabajos a partir del día [FECHA], procediéndose a impulsar el trámite de la correspondiente Disposición ante las autoridades municipales."`
    },
    {
      id: 'caso-4-iniciativa-inspeccion',
      titulo: 'Caso 4: Trámite Solicitado por la Inspección (Iniciativa Comitente)',
      firmantes: 'Representante Técnico de la Empresa, Inspector de Obra, y sello de copia fiel del Director General de Inspecciones.',
      observaciones: 'Iniciativa directa de la Municipalidad/Inspección. La Inspección emite la OS intimando conformidad y la Contratista acepta mediante NP.',
      reglaTemporal: '⚠️ CORRELACIÓN TEMPORAL: Deben estar fechadas obligatoriamente con anterioridad a la Nota de Solicitud de Alteración del Inspector.',
      texto: `ORDEN DE SERVICIO N° [...] (Inspección de Obra):
"Se comunica a la empresa que resulta necesario ejecutar trabajos adicionales de pavimentación en calle [CALLE] entre [CALLE 1] y [CALLE 2] (Ítem Nuevo N° [X]), con una ampliación de plazo de [X] días corridos, por lo que se tramitará la alteración contractual. Se intima a manifestar su conformidad y presentar análisis de precios."

NOTA DE PEDIDO N° [...] (Contratista):
"En respuesta a la O.S. N° [N°], la empresa manifiesta su total conformidad a la tramitación de la alteración contractual, aceptando la ejecución del ítem nuevo en el sector indicado y el plazo de [X] días corridos, adjuntándose el análisis de precio respectivo."`
    }
  ],
  memoria: [
    {
      id: 'memoria-aprobacion',
      titulo: 'Memoria Explicativa: Tramitación por Previa Aprobación (Trabajos No Iniciados)',
      firmantes: 'Inspector de Obra y Director General de Inspecciones.',
      modalidad: 'aprobacion',
      calloutDestacado: 'REGLA TERMINOLÓGICA OBLIGATORIA: Prohibido usar verbos en pasado ("se ejecutó"). Usar exclusivamente tono proyectual: "se requiere", "se proyecta", "resulta necesario autorizar".',
      observaciones: 'Verificar que los nombres de los ítems y sus cubicaciones sean exactamente idénticos a los volcados en el Cuadro Comparativo.',
      texto: `OBRA: [NOMBRE DE LA OBRA]
EXPEDIENTE: [NÚMERO DE EXPEDIENTE]
VÍA ADMINISTRATIVA: Aprobación Previa (Trabajos No Iniciados)

1. JUSTIFICACIÓN TÉCNICA GENERAL DE LA PROPUESTA (REDACCIÓN PROYECTUAL):
"Durante las tareas preliminares de replanteo in situ, se verificaron discrepancias entre los supuestos del proyecto licitatorio y las condiciones geotécnicas e hidráulicas efectivas del terreno. A fin de garantizar la funcionalidad de la estructura vial y resolver interferencias no previstas, resulta indispensable adecuar las previsiones cuantitativas del contrato e incorporar tareas complementarias. A tal efecto, se somete a previa aprobación de la Superioridad la siguiente modificación contractual, redactada en términos de necesidad proyectada dado que los trabajos aún no han sido autorizados ni ejecutados:

2. DETALLE DE ÍTEMS A MODIFICAR (ENFOQUE DE NECESIDAD):

A. Disminución de Cantidades Proyectada (Economías):
• Ítem N° 4 (Saneamiento y Reemplazo de Suelo): Se propone disminuir en 874,86 m³ la previsión original, debido a que el plano de suelo resistente se constató a menor profundidad de la supuesta, requiriéndose una ejecución ajustada de 300,00 m³.
• Ítem N° 14 (Reubicación de Líneas Eléctricas): Se proyecta dejar el ítem en saldo cero (reducción de 200,00 ml), ya que el replanteo vial demostró que los postes existentes no invaden la zona de calzada.

B. Incremento de Cantidades Requerido (Demasías):
• Ítem N° 15 (Elevación de Tapas de Inspección): Se requiere incrementar en 10 unidades el cómputo (ascendiendo a 20 unidades en total) debido al hallazgo de cámaras cloacales sepultadas bajo sedimentos antiguos.
• Ítem N° 16 (Construcción de Sumideros): Requiere ser incrementado en 3 unidades (totalizando 6 sumideros) para asegurar la captación pluvial en esquinas con depresión topográfica.

C. Ítems Nuevos a Incorporar:
• Ítem N° 19 (Nuevo) - Construcción de Desagüe PVC 500 mm (153,00 ml): Se propone incorporar este nuevo trabajo para conectar los sumideros proyectados con el canal colector troncal.
• Ítem N° 20 (Nuevo) - Pavimentación Asfáltica (1.200 m²): Se proyecta pavimentar la calle San Martín, entre Belgrano y Roca. Constancia a Recupero: Se individualiza este tramo para dar intervención a la Dirección de Promoción y Recupero de Obras para el empadronamiento de frentistas.

D. Plazo Contractual Solicitado:
Se estima imprescindible otorgar una prórroga de [X] días corridos, fijándose como nueva fecha de finalización el día [FECHA]."`
    },
    {
      id: 'memoria-convalidacion',
      titulo: 'Memoria Explicativa: Tramitación por Convalidación (Hechos Ya Ejecutados)',
      firmantes: 'Firma original de Inspector de Obra, Director General de Obras e intervención del Representante Técnico.',
      modalidad: 'convalidacion',
      calloutDestacado: 'ENFOQUE DE HECHO CONSUMADO: Justificar la urgencia operativa (evitar colapsos de zanjas o anegamientos) y redactar en convalidación real ("se convalidó", "ejecutado").',
      observaciones: 'Indispensable justificar la urgencia operativa y la imposibilidad fáctica de detener la obra para esperar el acto administrativo previo.',
      texto: `OBRA: [NOMBRE DE LA OBRA]
EXPEDIENTE: [NÚMERO DE EXPEDIENTE]
VÍA ADMINISTRATIVA: Convalidación (Hechos Ya Ejecutados)

1. JUSTIFICACIÓN TÉCNICA DE LA URGENCIA Y CONVALIDACIÓN (HECHO CONSUMADO):
"Durante el curso de los trabajos se verificaron imprevistos de carácter geomecánico y pluvial de urgente resolución operativa. La detención de las actividades a la espera del acto administrativo previo de aprobación hubiera provocado colapsos de zanjas abiertas, anegamiento de fincas linderas y sobrecostos por paralización de cuadrillas. En consecuencia, y mediando orden expresa en libro de obra, se dispuso la ejecución material e inmediata de los trabajos necesarios, elevándose la presente documentación técnica al solo efecto de someter a formal convalidación administrativa los ítems y volúmenes efectivamente ejecutados:

2. DETALLE DE ÍTEMS A CONVALIDAR (ENFOQUE DE OBRA EJECUTADA):

A. Disminución de Cantidades Materializada (Economías):
• Ítem N° 4 (Saneamiento y Reemplazo de Suelo): Se convalidó una disminución de 874,86 m³, habiéndose ejecutado una excavación real de 300,00 m³ tras constatarse un estrato resistente a menor cota.
• Ítem N° 14 (Reubicación de Líneas Eléctricas): Se convalidó la supresión total del ítem (saldo cero) por 200,00 ml, al haberse evitado la afectación de las columnas existentes.

B. Incremento de Cantidades Ejecutado (Demasías):
• Ítem N° 15 (Elevación de Tapas de Inspección): Se convalidó el incremento de 10 unidades (alcanzando 20 unidades ejecutadas en total), regularizándose cámaras que quedaron bajo la rasante estructural.
• Ítem N° 16 (Construcción de Sumideros): Se convalidó la ejecución de 3 sumideros adicionales (alcanzando 6 unidades construidas) para captar aportes pluviales concentrados.

C. Ítems Nuevos Ejecutados a Convalidar:
• Ítem N° 19 (Nuevo) - Construcción de Desagüe PVC 500 mm (153,00 ml): Se somete a convalidación la construcción ya materializada de 153 ml de cañería, indispensable para desaguar los sumideros hacia el canal colector troncal.
• Ítem N° 20 (Nuevo) - Pavimentación Asfáltica (1.200 m²): Se convalidó la pavimentación ejecutada en calle San Martín, entre Belgrano y Roca. Constancia a Recupero: Se formaliza la ejecución del tramo para que la Dirección de Promoción y Recupero de Obras incorpore a los frentistas al cobro de mejoras.

D. Convalidación de Plazo Contractual:
Se somete a convalidación una extensión real de [X] días corridos de plazo de obra, estableciéndose como fecha definitiva de terminación el día [FECHA]."`
    }
  ]
};
