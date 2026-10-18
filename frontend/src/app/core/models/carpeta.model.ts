import { NivelPermiso } from './enums';

/** Entrada de la lista de compartidos de una carpeta. */
export interface CompartidoCon {
  usuario: string;
  permiso: NivelPermiso;
  fechaCompartido: string;
}

/** Documento de carpeta: árbol por carpetaPadre, dueño, compartidos y papelera. */
export interface Carpeta {
  _id: string;
  nombre: string;
  propietario: string;
  carpetaPadre: string | null;
  compartidoCon: CompartidoCon[];
  enPapelera: boolean;
  fechaEnvioPapelera: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Body de POST /carpetas. */
export interface CrearCarpetaDto {
  nombre: string;
  carpetaPadre?: string | null;
}

/** Body de PATCH /carpetas/:id/renombrar. */
export interface RenombrarCarpetaDto {
  nombre: string;
}

/** Body de PATCH /carpetas/:id/mover (null = raíz). */
export interface MoverCarpetaDto {
  carpetaPadre: string | null;
}

/** Body de POST /carpetas/:id/compartir. */
export interface CompartirCarpetaDto {
  usuarioId: string;
  permiso: NivelPermiso;
}

/** Query de GET /carpetas. */
export interface ListarCarpetasQuery {
  carpetaPadre?: string | null;
  incluirCompartidas?: boolean;
}

/** Respuesta de GET /carpetas. */
export interface ListarCarpetasResponse {
  propias: Carpeta[];
  compartidas: Carpeta[];
}
