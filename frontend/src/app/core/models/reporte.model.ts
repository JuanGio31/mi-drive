import { AccionActividad, NivelPermiso, Rol } from './enums';

/** Unidad de agrupación temporal de los reportes de actividad. */
export type UnidadPeriodo = 'dia' | 'mes' | 'año';

/** Query común de rango de fechas. */
export interface RangoFechasQuery {
  desde?: string;
  hasta?: string;
}

/** Query de los endpoints "top" (limite). */
export interface TopLimiteQuery {
  limite?: number;
}

/** Query de los reportes por período. */
export interface PeriodoQuery extends RangoFechasQuery {
  unidad?: UnidadPeriodo;
}

/** GET /reportes/admin/resumen → totales del dashboard. */
export interface ResumenAdmin {
  archivos: { total: number; tamañoTotal: number };
  carpetas: { total: number };
  usuarios: { total: number; activos: number; inactivos: number };
  compartidos: { archivos: number; carpetas: number; total: number };
}

// ============ Archivos y almacenamiento ============

/** GET /reportes/archivos/por-tipo */
export interface ArchivosPorTipoItem {
  tipo: string;
  total: number;
  tamañoTotal: number;
}

/** GET /reportes/archivos/por-rango */
export interface ArchivoPorRangoItem {
  id: string;
  nombre: string;
  tipo: string;
  tamaño: number;
  createdAt: string;
  propietario: {
    id: string;
    nombre: string;
    correo: string;
  };
}

/** GET /reportes/archivos/mas-operaciones */
export interface ArchivoMasOperacionesItem {
  recursoId: string;
  recursoNombre: string;
  totalOperaciones: number;
  ultimaOperacion: string;
  acciones: AccionActividad[];
}

// ============ Usuarios ============

/** GET /reportes/usuarios/top-archivos */
export interface TopUsuarioItem {
  usuarioId: string;
  nombre: string;
  correo: string;
  rol: Rol;
  totalArchivos: number;
  tamañoTotal: number;
}

/** GET /reportes/usuarios/mas-compartidos */
export interface UsuarioMasCompartidosItem {
  usuarioId: string;
  nombre: string;
  correo: string;
  rol: Rol;
  archivosCompartidos: number;
  carpetasCompartidas: number;
  personasAlcanzadas: number;
  totalCompartidos: number;
}

// ============ Compartición ============

/** GET /reportes/compartidos/mas-compartidos */
export interface ArchivoMasCompartidoItem {
  archivoId: string;
  nombre: string;
  tipo: string;
  numUsuarios: number;
  propietario: {
    id: string;
    nombre: string;
  };
}

/** Ítem de recurso compartido por un usuario. */
export interface RecursoCompartidoItem {
  id: string;
  nombre: string;
  tipo?: string;
  numUsuarios: number;
}

/** GET /reportes/compartidos/por-usuario/:usuarioId */
export interface RecursosCompartidosResponse {
  usuarioId: string;
  archivos: RecursoCompartidoItem[];
  carpetas: RecursoCompartidoItem[];
}

/** Ítem de recurso recibido por un usuario. */
export interface RecursoRecibidoItem {
  id: string;
  nombre: string;
  tipo?: string;
  miPermiso: NivelPermiso;
  propietario: {
    id: string;
    nombre: string;
  };
}

/** GET /reportes/compartidos/recibidos/:usuarioId */
export interface RecursosRecibidosResponse {
  usuarioId: string;
  archivos: RecursoRecibidoItem[];
  carpetas: RecursoRecibidoItem[];
}
