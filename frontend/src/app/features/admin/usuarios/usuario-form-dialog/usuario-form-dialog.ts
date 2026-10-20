import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Rol, Usuario } from '../../../../core/models';
import { UsuarioService } from '../../../../core/services/usuario-service';

export interface UsuarioFormData {
  usuario?: Usuario;
  esPropio: boolean;
}

/** Diálogo para crear o editar usuarios desde el panel de administración. */
@Component({
  selector: 'app-usuario-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './usuario-form-dialog.html',
  styleUrl: './usuario-form-dialog.scss',
})
export class UsuarioFormDialog {
  private readonly data = inject<UsuarioFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<UsuarioFormDialog, boolean>);
  private readonly usuarioService = inject(UsuarioService);

  readonly esEdicion = !!this.data.usuario;
  readonly esPropio = this.data.esPropio;
  readonly roles = [Rol.Usuario, Rol.Administrador];

  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup({
    nombre: new FormControl(this.data.usuario?.nombre ?? '', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(150),
      ],
    }),
    correo: new FormControl(this.data.usuario?.correo ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true }),
    rol: new FormControl<Rol>(this.data.usuario?.rol ?? Rol.Usuario, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    if (this.esPropio) {
      this.form.controls.rol.disable();
    }
  }

  /** Crea o actualiza el usuario y cierra el diálogo indicando si hubo cambios. */
  guardar(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nombre, correo, password, rol } = this.form.getRawValue();
    const correoLimpio = correo.trim();

    if (!this.esEdicion && password.trim().length < 6) {
      this.form.controls.password.markAsTouched();
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.guardando.set(true);

    const peticion = this.esEdicion
      ? this.usuarioService.actualizar(this.data.usuario!._id, {
          nombre: nombre.trim(),
          correo: correoLimpio,
          ...(this.esPropio ? {} : { rol }),
        })
      : this.usuarioService.crear({
          nombre: nombre.trim(),
          correo: correoLimpio,
          password,
          rol,
        });

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogRef.close(true);
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(this.mensajeError(err));
      },
    });
  }

  /** Traduce los errores del backend (409 duplicado, 400 validación). */
  private mensajeError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }

    const detalle = (err.error as { error?: string })?.error;
    if (err.status === 409) {
      return detalle ?? 'Ya existe un usuario con ese correo.';
    }
    if (err.status === 400 || err.status === 403) {
      return detalle ?? 'Revisa los datos ingresados.';
    }
    return detalle ?? 'No se pudo guardar el usuario.';
  }
}
