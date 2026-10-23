import { Carpeta } from '../models';

/** Indica si la carpeta pertenece a otro usuario y fue compartida conmigo. */
export function esCarpetaCompartida(
  carpeta: Carpeta,
  usuarioId: string | null | undefined,
): boolean {
  return !!usuarioId && carpeta.propietario !== usuarioId;
}

/** Indica si una carpeta propia tiene comparticiones directas con otros usuarios. */
export function carpetaCompartidaConOtros(
  carpeta: Carpeta,
  usuarioId: string | null | undefined,
): boolean {
  return !!usuarioId && carpeta.propietario === usuarioId && carpeta.compartidoCon.length > 0;
}
