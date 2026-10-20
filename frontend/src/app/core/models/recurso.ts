import { Archivo, CompartidoArchivo } from './archivo.model';
import { Carpeta, CompartidoCon } from './carpeta.model';

/**
 * Unidad de trabajo de las vistas con menú contextual: archivo o carpeta.
 * Unión discriminada para que TypeScript sepa qué modelo hay dentro.
 */
export type ItemRecurso =
  | { tipo: 'archivo'; archivo: Archivo }
  | { tipo: 'carpeta'; carpeta: Carpeta };

export const esArchivo = (
  item: ItemRecurso,
): item is { tipo: 'archivo'; archivo: Archivo } => item.tipo === 'archivo';

export const idItem = (item: ItemRecurso): string =>
  esArchivo(item) ? item.archivo._id : item.carpeta._id;

export const nombreItem = (item: ItemRecurso): string =>
  esArchivo(item) ? item.archivo.nombre : item.carpeta.nombre;

export const propietarioItem = (item: ItemRecurso): string =>
  esArchivo(item) ? item.archivo.propietario : item.carpeta.propietario;

export const carpetaPadreItem = (item: ItemRecurso): string | null =>
  esArchivo(item) ? item.archivo.carpetaPadre : item.carpeta.carpetaPadre;

export const compartidosItem = (
  item: ItemRecurso,
): (CompartidoArchivo | CompartidoCon)[] =>
  esArchivo(item) ? item.archivo.compartidoCon : item.carpeta.compartidoCon;
