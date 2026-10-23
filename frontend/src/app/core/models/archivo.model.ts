import { ExtensionArchivo, NivelPermiso } from './enums';

/** Entrada de la lista de compartidos de un archivo. */
export interface CompartidoArchivo {
  usuario: string;
  permiso: NivelPermiso;
  fechaCompartido: string;
}

/** Documento de archivo (.txt / .md) almacenado en MongoDB. */
export interface Archivo {
  _id: string;
  nombre: string;
  tipo: ExtensionArchivo;
  contenido: string;
  tamanio: number;
  propietario: string;
  /** Permiso efectivo del usuario actual (lo agrega el backend). */
  miPermiso?: NivelPermiso | null;
  carpetaPadre: string | null;
  compartidoCon: CompartidoArchivo[];
  destacadoPor: string[];
  enPapelera: boolean;
  fechaEnvioPapelera: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Body de POST /archivos. */
export interface CrearArchivoDto {
  nombre: string;
  tipo: ExtensionArchivo;
  contenido?: string;
  carpetaPadre?: string | null;
}

/** Body de PUT /archivos/:id/contenido. */
export interface ActualizarContenidoDto {
  contenido: string;
}

/** Body de PATCH /archivos/:id/renombrar. */
export interface RenombrarArchivoDto {
  nombre: string;
}

/** Body de PATCH /archivos/:id/mover (null = raíz). */
export interface MoverArchivoDto {
  carpetaPadre: string | null;
}

/** Body de POST /archivos/:id/compartir. */
export interface CompartirArchivoDto {
  usuarioId: string;
  permiso: NivelPermiso;
}

/** Body de PATCH /archivos/:id/destacar. */
export interface DestacarArchivoDto {
  destacado: boolean;
}

/** Query de GET /archivos. */
export interface ListarArchivosQuery {
  carpetaPadre?: string | null;
  tipo?: ExtensionArchivo;
  busqueda?: string;
  incluirCompartidas?: boolean;
  incluirContenido?: boolean;
  page?: number;
  limit?: number;
}
