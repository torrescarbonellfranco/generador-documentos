export type MesEstado = 'definitivo' | 'provisorio';

export interface ItemContrato {
  id: string;
  numero: string;            // ej: "1", "1.1", "RUBRO II", "3.6 (Nuevo)"
  descripcion: string;
  unidad?: string;           // ej: "m2", "ml", "gl", "u", "kg"
  precioUnitario: number;    // 2 decimales
  cantidadOriginal: number;  // H_i (Cantidades Parciales -> Autoriz.)
  cantidadNueva: number;     // CV_i (Cantidades Parciales -> A Autoriz.)
  
  // Datos opcionales provenientes del Cuadro Modificatorio oficial (.xlsx)
  importeOriginal?: number;      // Col G: Importes Parciales -> Autoriz.
  importeNuevo?: number;         // Col H: Importes Parciales -> A Autoriz.
  cantidadDisminucion?: number;  // Col I: Disminuciones -> Cantidad
  importeDisminucion?: number;   // Col J: Disminuciones -> Importe
  cantidadAumento?: number;      // Col K: Aumentos -> Cantidad
  importeAumento?: number;       // Col L: Aumentos -> Importe

  // Avances físicos mensuales: key es el identificador de la columna (ej: "mes_1", "mes_2", "mes_final_orig", "mes_final_adic")
  avancesPorColumna: Record<string, number>;
}

export interface ReconciliacionCuadro {
  leidoExcel: {
    importesAutorizados?: number;
    importesAAutorizar?: number;
    importesDisminuciones?: number;
    importesAumentos?: number;
    saldoNeto?: number;
  };
  calculadoSuma: {
    importesAutorizados: number;
    importesAAutorizar: number;
    importesDisminuciones: number;
    importesAumentos: number;
    saldoNeto: number;
  };
  reconciliado: boolean;
  diferencias: string[];
  advertencias: string[];
}

export interface ResultadoImportacion {
  items: ItemContrato[];
  reconciliacion: ReconciliacionCuadro;
  metadatosDetectados?: {
    obra?: string;
    expediente?: string;
    contratista?: string;
  };
}

export interface MesConfig {
  mesNumero: number;               // 1, 2, 3...
  estado: MesEstado;               // 'definitivo' | 'provisorio'
  montoCertificadoDefinitivo?: number; // Valor $ exacto si es definitivo
  observaciones?: string;
}

export type EscenarioCierre = 'A_SOLO_DISMINUCION' | 'B_SOLO_ADICIONALES' | 'C_MIXTO';

export interface ColumnaCierreInfo {
  id: string;
  label: string;
  tipo: 'mes_previo' | 'cierre_original' | 'cierre_adicional';
  mesNumero: number;
  esAdicional?: boolean;
}

export interface ItemCalculado {
  item: ItemContrato;
  esTitulo: boolean;
  costoItemBasico: number;      // precioUnitario * cantidadOriginal
  incidenciaOriginal: number;   // costoItemBasico / MontoObraOriginal
  costoItemModificado: number;  // precioUnitario * cantidadNueva
  incidenciaNueva: number;      // costoItemModificado / MontoObraOriginal
  diferenciaCantidad: number;   // cantidadNueva - cantidadOriginal
  diferenciaMonto: number;      // costoItemModificado - costoItemBasico
  tipoAlteracion: 'sin_cambio' | 'disminuido' | 'suprimido' | 'adicional_item' | 'item_nuevo' | 'titulo';
  
  // Control de saldos y ejecución física
  cantidadEjecutadaOriginal: number;  // Ejecutado Contrato Orig.
  cantidadEjecutadaAdicional: number; // Ejecutado Adicionales
  cantidadEjecutadaTotal: number;     // Total Ejecutado (Orig + Adic)
  cantidadPendienteOriginal: number;  // Pendiente Contrato Orig. (mín(H, CV) - Ejec. Orig.)
  cantidadPendienteAdicional: number; // Pendiente Adicionales (máx(0, CV - H) - Ejec. Adic.)
  porcentajeAcumuladoOriginal: number; // % Acumulado s/ Cantidad Original (Total Ejecutado / H_i * 100)
  
  // Validaciones de topes y alertas físicas por ítem
  excedeTopeOriginal: boolean;
  excesoOriginalMonto: number;
  excedeTopeTotal: boolean;
  excesoTotalMonto: number;
  ejecucionEnItemSuprimido: boolean;
  tieneErrorFisico: boolean;
  mensajeAlertaFisica?: string;
}

export interface FilaCurvaInversion {
  columnaId: string;
  label: string;
  tipo: 'mes_previo' | 'cierre_original' | 'cierre_adicional';
  mesNumero: number;
  estado: MesEstado;
  
  // Valores calculados
  montoMensual: number;        // Con 2 decimales
  porcentajeMensual: number;   // 6 decimales internos
  montoAcumulado: number;      // Con 2 decimales
  porcentajeAcumulado: number; // 6 decimales internos
  
  // Info auxiliar para auditoría
  montoTeoricoFisico?: number;
  absorbeRedondeo?: boolean;
}

export interface ResultadoConvalidacion {
  montoObraOriginal: number;
  montoObraNuevo: number;
  diferenciaNetaMonto: number;
  diferenciaNetaPorcentaje: number;
  
  hayAdicionales: boolean;
  hayDisminuciones: boolean;
  escenario: EscenarioCierre;
  descripcionEscenario: string;
  
  columnas: ColumnaCierreInfo[];
  itemsCalculados: ItemCalculado[];
  curva: FilaCurvaInversion[];
  
  // Validaciones físicas
  totalPendienteOriginal: number;
  totalPendienteAdicional: number;
  saldosFisicosCerrados: boolean;

  // Resumen de auditoría de topes físicos
  itemsConExceso: ItemCalculado[];
  tieneAlertasFisicas: boolean;
  cantidadItemsConAlerta: number;

  // Reconciliación del Cuadro Modificatorio si fue importado
  reconciliacion?: ReconciliacionCuadro;
}

export interface ObraGeneral {
  nombre: string;
  expediente: string;
  expedienteOriginal?: string;
  expedienteAmpliacion?: string;
  contratista: string;
  fechaLicitacion?: string;
  fechaInicio?: string;
  plazoObra?: string;
  fechaTerminacionContrato?: string;
  fechaTerminacionAmpliacion?: string;
  plazoOriginalMeses: number;
  cantidadMeses: number;
  mesFinal: number; // Mes donde concluye la obra original / convalidación
  corteDefinitivoMes?: number; // Último mes con certificado definitivo (0 a mesFinal - 1)
}

export type RegimenPlan = 'convalidacion' | 'aprobacion';

export interface PlanConvalidacionMetadata {
  expedienteId?: string;
  expedienteOriginal?: string;
  expedienteAmpliacion?: string;
  obra?: string;
  empresa?: string;
  montoOriginal?: number;
  montoNuevo?: number;
  fechaInicio?: string;
  plazoObra?: string;
  regimen?: RegimenPlan;
}

export interface PlanConvalidacionState {
  id: string;
  expedienteId?: string;
  titulo?: string;
  regimen?: RegimenPlan; // 'convalidacion' | 'aprobacion'
  fechaCreacion: string;
  ultimaModificacion: string;
  version?: number;
  obra: ObraGeneral;
  items: ItemContrato[];
  mesesConfig: MesConfig[];
  reconciliacion?: ReconciliacionCuadro;
  pasoActivo?: 1 | 2 | 3;
  // Métricas calculadas para visualización rápida en el repositorio
  montoOriginal?: number;
  montoNuevo?: number;
  porcentajeFinal?: number;
}

