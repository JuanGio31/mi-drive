import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth-service';
import { UsuarioService } from '../../core/services/usuario-service';
import { Rol, Usuario } from '../../core/models';

/** Valida que la nueva contraseña y su confirmación coincidan. */
const contrasenasCoinciden = (
  grupo: AbstractControl,
): ValidationErrors | null => {
  const nueva = grupo.get('passwordNueva')?.value;
  const confirmar = grupo.get('confirmar')?.value;
  return nueva && confirmar && nueva !== confirmar
    ? { noCoinciden: true }
    : null;
};

@Component({
  selector: 'app-perfil',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class PerfilComponent {
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);

  /** Usuario de la sesión actual. */
  readonly user = this.authService.usuario;

  /** Datos completos del usuario (incluye rol, estado y fecha de alta). */
  readonly perfil = signal<Usuario | null>(null);
  readonly cargandoPerfil = signal(false);
  readonly errorPerfil = signal<string | null>(null);

  readonly guardandoDatos = signal(false);
  readonly errorDatos = signal<string | null>(null);
  readonly exitoDatos = signal<string | null>(null);

  readonly cambiandoPassword = signal(false);
  readonly errorPassword = signal<string | null>(null);
  readonly exitoPassword = signal<string | null>(null);

  readonly verActual = signal(false);
  readonly verNueva = signal(false);
  readonly verConfirmar = signal(false);

  /** Formulario de los campos que el propio usuario puede editar. */
  readonly datosForm = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(150),
      ],
    }),
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  /** Formulario de cambio de contraseña (sección independiente). */
  readonly passwordForm = new FormGroup(
    {
      passwordActual: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      passwordNueva: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)],
      }),
      confirmar: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: contrasenasCoinciden },
  );

  /** Iniciales para el avatar (ej. "Carlos Gómez" → "CG"). */
  readonly iniciales = computed(() => {
    const nombre = this.user()?.nombre ?? '';
    const letras = nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
    return letras || 'U';
  });

  readonly rolEtiqueta = computed(() =>
    (this.perfil()?.rol ?? this.user()?.rol) === Rol.Administrador
      ? 'Administrador'
      : 'Usuario',
  );

  readonly miembroDesde = computed(() => {
    const fecha = this.perfil()?.createdAt;
    return fecha ? this.formatearFecha(fecha) : '—';
  });

  constructor() {
    const actual = this.user();
    if (actual) {
      this.datosForm.patchValue({
        nombre: actual.nombre,
        correo: actual.correo,
      });
      this.cargarPerfil(actual.id);
    }
  }

  /** Carga el perfil completo desde la API (rol, estado y fecha de alta). */
  private cargarPerfil(id: string): void {
    this.cargandoPerfil.set(true);
    this.errorPerfil.set(null);

    this.usuarioService.buscarPorId(id).subscribe({
      next: (usuario) => {
        this.perfil.set(usuario);
        this.datosForm.patchValue({
          nombre: usuario.nombre,
          correo: usuario.correo,
        });
        this.cargandoPerfil.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoPerfil.set(false);
        this.errorPerfil.set(this.mensajeError(err));
      },
    });
  }

  /** Guarda nombre y correo; además refresca la sesión local y el avatar. */
  guardarDatos(): void {
    this.exitoDatos.set(null);
    this.errorDatos.set(null);

    if (this.datosForm.invalid) {
      this.datosForm.markAllAsTouched();
      return;
    }

    const id = this.user()?.id;
    if (!id || this.guardandoDatos()) return;

    const { nombre, correo } = this.datosForm.getRawValue();
    this.guardandoDatos.set(true);

    this.usuarioService
      .actualizar(id, { nombre: nombre.trim(), correo: correo.trim() })
      .subscribe({
        next: (usuario) => {
          this.perfil.set(usuario);
          this.authService.actualizarSesion({
            nombre: usuario.nombre,
            correo: usuario.correo,
          });
          this.datosForm.patchValue({
            nombre: usuario.nombre,
            correo: usuario.correo,
          });
          this.guardandoDatos.set(false);
          this.exitoDatos.set('Datos actualizados correctamente.');
        },
        error: (err: HttpErrorResponse) => {
          this.guardandoDatos.set(false);
          this.errorDatos.set(this.mensajeError(err));
        },
      });
  }

  /** Cambia la contraseña validando primero la actual en el backend. */
  cambiarPassword(): void {
    this.exitoPassword.set(null);
    this.errorPassword.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const id = this.user()?.id;
    if (!id || this.cambiandoPassword()) return;

    const { passwordActual, passwordNueva } = this.passwordForm.getRawValue();
    this.cambiandoPassword.set(true);

    this.usuarioService
      .cambiarPassword(id, { passwordActual, passwordNueva })
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.cambiandoPassword.set(false);
          this.exitoPassword.set(
            'Contraseña actualizada. Úsala en tu próximo inicio de sesión.',
          );
        },
        error: (err: HttpErrorResponse) => {
          this.cambiandoPassword.set(false);
          this.errorPassword.set(this.mensajeError(err));
        },
      });
  }

  /** Traduce la respuesta de error del backend a un mensaje legible. */
  private mensajeError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.';
    }

    const detalle = (err.error as { error?: string })?.error;
    if (err.status === 400) {
      return detalle ?? 'Revisa los datos ingresados e inténtalo de nuevo.';
    }
    if (err.status === 409) {
      return detalle ?? 'El correo ya está en uso por otro usuario.';
    }
    return detalle ?? 'Ocurrió un error. Inténtalo nuevamente.';
  }

  /** Formatea una fecha ISO en español (día, mes y año). */
  private formatearFecha(iso: string): string {
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  }
}
