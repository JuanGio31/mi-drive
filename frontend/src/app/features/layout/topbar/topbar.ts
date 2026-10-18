import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-topbar',
  imports: [FormsModule, MatIconModule, MatMenuModule, MatDividerModule, MatButtonModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  private readonly authService = inject(AuthService);

  /** Usuario autenticado actual (modelo UsuarioSesion). */
  readonly user = this.authService.usuario;

  /** Iniciales del usuario para el avatar (ej. "Carlos Gómez" → "CG"). */
  readonly initials = computed(() => {
    const nombre = this.user()?.nombre ?? '';
    const letras = nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
    return letras || 'U';
  });

  searchQuery = '';

  logout(): void {
    this.authService.logout();
  }
}
