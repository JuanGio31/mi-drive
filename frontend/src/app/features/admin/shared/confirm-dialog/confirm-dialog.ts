import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  titulo: string;
  mensaje: string;
  confirmar: string;
  peligro?: boolean;
}

/** Diálogo reutilizable para confirmar acciones destructivas. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>

    <mat-dialog-content>
      <div class="confirmar-contenido">
        <mat-icon [class.peligro]="data.peligro">
          {{ data.peligro ? 'warning' : 'help_outline' }}
        </mat-icon>
        <p>{{ data.mensaje }}</p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Cancelar</button>
      <button
        mat-flat-button
        type="button"
        [color]="data.peligro ? 'warn' : 'primary'"
        [mat-dialog-close]="true"
      >
        {{ data.confirmar }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .confirmar-contenido {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      max-width: 420px;
    }
    .confirmar-contenido mat-icon {
      color: #2563eb;
      flex-shrink: 0;
    }
    .confirmar-contenido mat-icon.peligro {
      color: #dc2626;
    }
    .confirmar-contenido p {
      margin: 0;
      color: #475569;
      line-height: 1.5;
    }
  `,
})
export class ConfirmDialog {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
