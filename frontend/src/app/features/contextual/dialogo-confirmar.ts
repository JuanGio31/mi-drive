import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DatosConfirmar {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  /** Pinta el botón de confirmación en rojo. */
  peligroso?: boolean;
}

/** Diálogo genérico de confirmación. Devuelve `true` si se confirma. */
@Component({
  selector: 'app-dialogo-confirmar',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './dialogo-confirmar.html',
  styleUrl: './dialogo-confirmar.scss',
})
export class DialogoConfirmarComponent {
  readonly datos = inject<DatosConfirmar>(MAT_DIALOG_DATA);
  private readonly ref =
    inject<MatDialogRef<DialogoConfirmarComponent, boolean>>(MatDialogRef);

  cerrar(valor: boolean): void {
    this.ref.close(valor);
  }
}
