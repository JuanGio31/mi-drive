import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import {
  DatosConfirmar,
  DialogoConfirmarComponent,
} from '../contextual/dialogo-confirmar';

/** Componentes que deben confirmar antes de salir con cambios pendientes. */
export interface PuedeDescartar {
  hayCambiosSinGuardar(): boolean;
}

/** Pide confirmación al salir de una vista con cambios sin guardar. */
export const descartarCambiosGuard: CanDeactivateFn<PuedeDescartar> = async (
  componente,
) => {
  if (!componente?.hayCambiosSinGuardar()) return true;

  const dialog = inject(MatDialog);
  const confirmado = await firstValueFrom(
    dialog
      .open<DialogoConfirmarComponent, DatosConfirmar, boolean>(
        DialogoConfirmarComponent,
        {
          data: {
            titulo: 'Descartar cambios',
            mensaje: 'Tienes cambios sin guardar. Si sales, se perderán.',
            textoConfirmar: 'Descartar y salir',
            peligroso: true,
          },
          autoFocus: 'dialog',
        },
      )
      .afterClosed(),
  );

  return confirmado === true;
};
