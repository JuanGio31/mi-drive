import { AccionActividad, TipoRecurso } from './enums';

/** Registro de auditoría de una acción sobre un recurso. */
export interface Actividad {
  _id: string;
  usuario: string;
  usuarioNombre: string;
  usuarioCorreo: string;
  accion: AccionActividad;
  recursoTipo: TipoRecurso;
  recursoId: string | null;
  recursoNombre: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/** Filtros/query de GET /actividad, /actividad/mi-historial y reportes de actividad. */
export interface FiltrosActividad {
  usuarioId?: string;
  accion?: AccionActividad;
  recursoTipo?: TipoRecurso;
  recursoId?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  limit?: number;
}

/** Tipos de recurso aceptados por GET /actividad/recurso/:tipo/:id. */
export type TipoRecursoActividad = 'archivo' | 'carpeta' | 'usuario';

/** Resultado de conteo por acción: { accion, total }. */
export interface ConteoPorAccion {
  accion: AccionActividad;
  total: number;
}

/** Resultado de conteo por período: { periodo, total }. */
export interface ConteoPorPeriodo {
  periodo: string;
  total: number;
}
