import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface DatosRenombrar {
  nombreActual: string;
  tipo: 'archivo' | 'carpeta';
}

/** Diálogo para renombrar. Devuelve el nombre nuevo o `null` si se cancela. */
@Component({
  selector: 'app-dialogo-renombrar',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './dialogo-renombrar.html',
  styleUrl: './dialogo-renombrar.scss',
})
export class DialogoRenombrarComponent {
  readonly datos = inject<DatosRenombrar>(MAT_DIALOG_DATA);
  private readonly ref =
    inject<MatDialogRef<DialogoRenombrarComponent, string | null>>(MatDialogRef);

  nombre = this.datos.nombreActual;

  get valido(): boolean {
    const limpio = this.nombre.trim();
    return limpio.length > 0 && limpio !== this.datos.nombreActual;
  }

  confirmar(): void {
    if (!this.valido) return;
    this.ref.close(this.nombre.trim());
  }

  cancelar(): void {
    this.ref.close(null);
  }
}
