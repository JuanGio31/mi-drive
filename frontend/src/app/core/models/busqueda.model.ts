import { Archivo } from './archivo.model';
import { Carpeta } from './carpeta.model';

/** Respuesta de GET /buscar: coincidencias agrupadas por tipo. */
export interface ResultadosBusqueda {
  archivos: Archivo[];
  carpetas: Carpeta[];
}
