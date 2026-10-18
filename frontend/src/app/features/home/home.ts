import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [],
  template: ` <div style="padding: 2rem;">
    <h1>Bienvenido, {{ authService.usuario()?.nombre }}</h1>
    <p>Rol: {{ authService.usuario()?.rol }}</p>
    <button (click)="logout()">Cerrar sesión</button>
  </div>`,
  // templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/sign-in']);
  }
}
