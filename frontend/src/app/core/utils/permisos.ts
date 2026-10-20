import { NivelPermiso } from '../models/enums';

/** Permiso efectivo que se puede mostrar: los tres niveles + propietario. */
export type PermisoMostrado = NivelPermiso | 'propietario';

/** Texto legible para un nivel de permiso. */
export function etiquetaPermiso(permiso: PermisoMostrado): string {
  switch (permiso) {
    case 'propietario':
      return 'Propietario';
    case NivelPermiso.Escritura:
      return 'Edición';
    case NivelPermiso.Comentar:
      return 'Comentarios';
    case NivelPermiso.Lectura:
      return 'Lectura';
    default:
      return permiso;
  }
}

/** Ícono Material para un nivel de permiso. */
export function iconoPermiso(permiso: PermisoMostrado): string {
  switch (permiso) {
    case 'propietario':
      return 'workspace_premium';
    case NivelPermiso.Escritura:
      return 'edit';
    case NivelPermiso.Comentar:
      return 'comment';
    case NivelPermiso.Lectura:
      return 'visibility';
    default:
      return 'person';
  }
}
