import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth-service';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Validador de grupo: la confirmación debe coincidir con la contraseña. */
function contrasenasCoinciden(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-sign-up',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUpComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  hidePassword = signal(true);
  hideConfirm = signal(true);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  /** Snapshot reactivo de los campos de clave para la UX (fuerza + requisitos). */
  valoresClave = signal({ password: '', confirmPassword: '' });

  /** Fuerza 0-4: +1 por longitud 6+, +1 por longitud 10+, +1 por mayús+minús, +1 por número/símbolo. */
  fuerza = computed(() => {
    const p = this.valoresClave().password;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p) || /[^A-Za-z0-9]/.test(p)) s++;
    return s;
  });

  etiquetaFuerza = computed(() => {
    const etiquetas = ['', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];
    return etiquetas[this.fuerza()];
  });

  colorFuerza = computed(() => {
    const colores = ['transparent', '#d93025', '#e8710a', '#188038', '#137333'];
    return colores[this.fuerza()];
  });

  /** Checklist en vivo según las reglas reales del backend (min 6 + coincidencia). */
  requisitos = computed(() => {
    const { password, confirmPassword } = this.valoresClave();
    return [
      { texto: 'Mínimo 6 caracteres', ok: password.length >= 6 },
      { texto: 'Las contraseñas coinciden', ok: password.length > 0 && password === confirmPassword },
    ];
  });

  signUpForm = new FormGroup(
    {
      nombre: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(150),
      ]),
      correo: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: contrasenasCoinciden },
  );

  togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  toggleConfirmVisibility(): void {
    this.hideConfirm.update((value) => !value);
  }

  ngOnInit(): void {
    this.signUpForm.valueChanges.subscribe((v) => {
      this.valoresClave.set({
        password: v.password ?? '',
        confirmPassword: v.confirmPassword ?? '',
      });
    });
  }

  onSubmit(): void {
    if (this.signUpForm.invalid || this.isLoading()) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    const { nombre, correo, password } = this.signUpForm.value;
    if (!nombre || !correo || !password) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.signUp(nombre, correo, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/home']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.resolverMensajeError(err));
      },
    });
  }

  /**
   * Traduce el error HTTP del backend a un mensaje legible.
   * El backend responde { error: string, detalles?: { campo, mensaje }[] }.
   */
  private resolverMensajeError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.';
    }
    if (err.status === 409) {
      return 'Ese correo ya está registrado. Inicia sesión.';
    }
    if (err.status === 400) {
      const detalles = (err.error as { detalles?: { mensaje?: string }[] })?.detalles;
      if (detalles?.length) {
        return detalles
          .map((d) => d.mensaje)
          .filter(Boolean)
          .join(' ');
      }
      return 'Revisa los datos: nombre de 2+ letras, correo válido y clave de 6+ caracteres.';
    }
    return (
      (err.error as { error?: string })?.error ??
      'Error al crear la cuenta. Inténtalo nuevamente.'
    );
  }
}
