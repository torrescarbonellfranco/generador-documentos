export interface ExpedienteItem {
  id: string;
  expediente: string;
  alcance: string;
  obra: string;
  empresa: string;
  inspectoresRaw: string;
  tipoAlteracion: string;
  area: string;
  diasSector: number | string;
  estaAprobado: boolean;
  fechaVencimiento: string;
  estadoCalculado: string;
  fechaSolicitud?: string;
  montoOriginal?: string;
  variacionMonto?: string;
  variacionPorcentaje?: string;
  diasAmpliacion?: string;
  observaciones?: string;
}

export interface ExpedientesApiResponse {
  inspectores: string[];
  expedientes: ExpedienteItem[];
  total: number;
  actualizadoEl: string;
  error?: string;
}
