/** Totales globales del dashboard administrativo. */
export interface ResumenAdmin {
    archivos: { total: number; tamañoTotal: number };
    carpetas: { total: number };
    usuarios: { total: number; activos: number; inactivos: number };
    compartidos: { archivos: number; carpetas: number; total: number };
}

/** Fila del reporte de archivos agrupados por extensión. */
export interface ArchivoPorTipoReporte {
    tipo: string;
    total: number;
    tamañoTotal: number;
}

/** Fila del reporte de archivos creados dentro de un rango de fechas. */
export interface ArchivoPorRangoReporte {
    id: string;
    nombre: string;
    tipo: string;
    tamaño: number;
    createdAt: Date;
    propietario: {
        id: string;
        nombre: string;
        correo: string;
    };
}

/** Estado actual de un archivo que aparece en el histórico de operaciones. */
export type EstadoArchivoReporte =
    'activo' | 'en_papelera' | 'eliminado_definitivamente';

/** Fila del reporte histórico de archivos con más operaciones. */
export interface ArchivoMasOperacionesReporte {
    recursoId: string;
    recursoNombre: string | null;
    totalOperaciones: number;
    ultimaOperacion: Date;
    acciones: string[];
    estado: EstadoArchivoReporte;
}

/** Fila del top de usuarios por cantidad de archivos activos. */
export interface TopUsuarioReporte {
    usuarioId: string;
    nombre: string;
    correo: string;
    rol: string;
    totalArchivos: number;
    tamañoTotal: number;
}

/** Fila del ranking de usuarios por recursos compartidos directamente. */
export interface UsuarioMasCompartidosReporte {
    usuarioId: string;
    nombre: string;
    correo: string;
    rol: string;
    archivosCompartidos: number;
    carpetasCompartidas: number;
    /** Personas distintas que recibieron al menos un recurso del usuario. */
    personasAlcanzadas: number;
    totalCompartidos: number;
}

/** Fila del ranking de archivos por cantidad de usuarios con acceso efectivo. */
export interface ArchivoMasCompartidoReporte {
    archivoId: string;
    nombre: string;
    tipo: string;
    numUsuarios: number;
    propietario: {
        id: string;
        nombre: string;
    };
}

/** Recurso compartido directamente por un usuario. */
export interface RecursoCompartidoReporte {
    id: string;
    nombre: string;
    tipo?: string;
    numUsuarios: number;
}

/** Recurso recibido directamente por un usuario. */
export interface RecursoRecibidoReporte {
    id: string;
    nombre: string;
    tipo?: string;
    miPermiso: string;
    propietario: {
        id: string;
        nombre: string;
    };
}

/** Conjunto de recursos compartidos y recibidos de un usuario. */
export interface RecursosCompartidosReporte {
    archivos: RecursoCompartidoReporte[];
    carpetas: RecursoCompartidoReporte[];
}

/** Conjunto de recursos recibidos directamente por un usuario. */
export interface RecursosRecibidosReporte {
    archivos: RecursoRecibidoReporte[];
    carpetas: RecursoRecibidoReporte[];
}

/** Archivo activo sin compartición directa ni heredada. */
export interface ArchivoNuncaCompartidoReporte {
    id: string;
    nombre: string;
    tipo: string;
    tamaño: number;
    createdAt: Date;
    propietario: {
        id: string;
        nombre: string;
        correo: string;
    };
    carpeta: {
        id: string;
        nombre: string;
    } | null;
}

/** Fila del reporte de carpetas con más archivos. */
export interface CarpetaMasArchivosReporte {
    carpetaId: string;
    nombre: string;
    propietario: {
        id: string;
        nombre: string;
        correo: string;
    };
    archivosDirectos: number;
    archivosTotales: number;
}

/** Envelope paginado de archivos. */
export interface PaginaArchivos<T> {
    archivos: T[];
    total: number;
    page: number;
    limit: number;
}
