import { Component, inject, Signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { AuthService } from '../../../core/services/auth-service';
import { UsuarioSesion } from '../../../core/models';

@Component({
  selector: 'app-layout',
  imports: [Sidebar, Topbar, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  private readonly authService = inject(AuthService);

  /** Usuario autenticado actual (modelo UsuarioSesion). */
  readonly user: Signal<UsuarioSesion | null> = this.authService.usuario;

  /** Cierra la sesión del usuario actual. */
  logout(): void {
    this.authService.logout();
  }

  /** Indica si el usuario actual es administrador. */
  esAdmin(): boolean {
    return this.authService.esAdmin();
  }
}
