import { ItemMenuContextual } from './menu-contextual';

/**
 * Acciones disponibles en la vista "Mi Unidad". Renombrar requiere permiso de
 * edición; compartir y enviar a papelera, ser propietario.
 */
export function itemsMenuUnidad(
  esPropietario: boolean,
  puedeEditar: boolean,
): ItemMenuContextual[] {
  const items: ItemMenuContextual[] = [
    { id: 'detalles', etiqueta: 'Ver detalles', icono: 'info' },
  ];

  if (puedeEditar) {
    items.push({ id: 'renombrar', etiqueta: 'Renombrar', icono: 'edit' });
  }

  if (esPropietario) {
    items.push({ id: 'compartir', etiqueta: 'Compartir', icono: 'share' });
    items.push({
      id: 'papelera',
      etiqueta: 'Enviar a la papelera',
      icono: 'delete',
      peligroso: true,
    });
  }

  return items;
}

/** Acciones disponibles en la vista "Papelera". */
export const ITEMS_MENU_PAPELERA: ItemMenuContextual[] = [
  { id: 'restaurar', etiqueta: 'Restaurar', icono: 'restore_from_trash' },
];
