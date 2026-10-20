import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExtensionArchivo, Rol } from '../../../core/models';
import { AuthService } from '../../../core/services/auth-service';
import { NuevoRecursoService } from '../../contextual/nuevo-recurso.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatRippleModule,
    MatTooltipModule,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly nuevos = inject(NuevoRecursoService);
  private readonly authService = inject(AuthService);

  collapsed = signal(false);

  /** El administrador también es usuario: conserva su menú y ve el bloque admin. */
  readonly esAdmin = computed(
    () => this.authService.usuario()?.rol === Rol.Administrador,
  );

  items: NavItem[] = [
    { label: 'Pagina principal', icon: 'home', route: '/home' },
    {
      label: 'Mi Unidad',
      icon: 'folder',
      route: '/mi-unidad',
    },
    { label: 'Recientes', icon: 'schedule', route: '/recientes' },
    { label: 'Compartidos', icon: 'share', route: '/compartidos' },
    { label: 'Papelera', icon: 'delete', route: '/papelera' },
  ];

  adminItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'Usuarios', icon: 'group', route: '/admin/usuarios' },
    { label: 'Reportes', icon: 'insights', route: '/admin/reportes' },
    { label: 'Actividad', icon: 'history', route: '/admin/actividad' },
  ];

  toggleCollapse() {
    this.collapsed.set(!this.collapsed());
  }

  crearCarpeta(): void {
    void this.nuevos.crear('carpeta');
  }

  crearTexto(): void {
    void this.nuevos.crear(ExtensionArchivo.Txt);
  }

  crearMarkdown(): void {
    void this.nuevos.crear(ExtensionArchivo.Md);
  }
}
