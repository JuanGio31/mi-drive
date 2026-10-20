import { AccionActividad } from '../models';

export interface AccionVisual {
  etiqueta: string;
  icono: string;
  clase: string;
}

/** Presentación común de las acciones de auditoría en las vistas de admin. */
export const ACCIONES: Record<AccionActividad, AccionVisual> = {
  [AccionActividad.Crear]: { etiqueta: 'Crear', icono: 'add', clase: 'azul' },
  [AccionActividad.Renombrar]: {
    etiqueta: 'Renombrar',
    icono: 'edit',
    clase: 'azul',
  },
  [AccionActividad.Mover]: {
    etiqueta: 'Mover',
    icono: 'drive_file_move',
    clase: 'azul',
  },
  [AccionActividad.ActualizarContenido]: {
    etiqueta: 'Editar contenido',
    icono: 'edit_note',
    clase: 'azul',
  },
  [AccionActividad.Compartir]: {
    etiqueta: 'Compartir',
    icono: 'share',
    clase: 'violeta',
  },
  [AccionActividad.QuitarCompartido]: {
    etiqueta: 'Quitar compartido',
    icono: 'person_remove',
    clase: 'gris',
  },
  [AccionActividad.EnviarPapelera]: {
    etiqueta: 'Enviar a papelera',
    icono: 'delete',
    clase: 'rojo',
  },
  [AccionActividad.Restaurar]: {
    etiqueta: 'Restaurar',
    icono: 'restore',
    clase: 'verde',
  },
  [AccionActividad.EliminarPermanente]: {
    etiqueta: 'Eliminar permanente',
    icono: 'delete_forever',
    clase: 'rojo',
  },
  [AccionActividad.Login]: {
    etiqueta: 'Iniciar sesión',
    icono: 'login',
    clase: 'gris',
  },
  [AccionActividad.Desactivar]: {
    etiqueta: 'Desactivar',
    icono: 'person_off',
    clase: 'rojo',
  },
  [AccionActividad.Reactivar]: {
    etiqueta: 'Reactivar',
    icono: 'person_add',
    clase: 'verde',
  },
  [AccionActividad.Registro]: {
    etiqueta: 'Registro',
    icono: 'person_add',
    clase: 'verde',
  },
  [AccionActividad.Actualizar]: {
    etiqueta: 'Actualizar',
    icono: 'edit',
    clase: 'azul',
  },
};

/** Opciones para los selectores de acción. */
export const OPCIONES_ACCION = Object.values(AccionActividad).map((valor) => ({
  valor,
  etiqueta: ACCIONES[valor].etiqueta,
}));

/** Icono representativo de una acción de auditoría. */
export function iconoAccion(accion: AccionActividad): string {
  return ACCIONES[accion]?.icono ?? 'history';
}

/** Etiqueta legible de una acción de auditoría. */
export function etiquetaAccion(accion: AccionActividad): string {
  return ACCIONES[accion]?.etiqueta ?? accion;
}

/** Color del icono/chip según el tipo de acción. */
export function claseAccion(accion: AccionActividad): string {
  return ACCIONES[accion]?.clase ?? 'gris';
}
