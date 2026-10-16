import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth-service';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  hidePassword = signal(true);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = new FormGroup({
    identifier: new FormControl('carlos@dms.local', [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl('password123', [Validators.required]),
  });

  togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { identifier, password } = this.loginForm.value;
    if (!identifier || !password) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.signIn(identifier, password).subscribe({
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
   * El backend responde { error: string } con el codigo en err.status.
   */
  private resolverMensajeError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.';
    }
    if (err.status === 401) {
      return 'Correo o contraseña incorrectos. Inténtalo de nuevo.';
    }
    if (err.status === 403) {
      return (
        (err.error as { error?: string })?.error ??
        'Tu cuenta se encuentra desactivada. Contacta con el administrador.'
      );
    }
    if (err.status === 400) {
      return 'Revisa los datos ingresados: el correo debe ser válido.';
    }
    return (
      (err.error as { error?: string })?.error ??
      'Error al iniciar sesión. Inténtalo nuevamente.'
    );
  }

  // irARegistro(): void {
  //   this.router.navigate(['/auth/register']);
  // }

  fillDemoUser(username: string): void {
    if (username === 'carlos') {
      this.loginForm.patchValue({
        identifier: 'carlos@dms.local',
        password: 'password123',
      });
    } else {
      this.loginForm.patchValue({
        identifier: 'ana@dms.local',
        password: 'password123',
      });
    }
    this.errorMessage.set(null);
  }
}
