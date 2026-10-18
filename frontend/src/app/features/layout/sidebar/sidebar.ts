import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatRippleModule, MatTooltipModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  collapsed = signal(false);

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

  toggleCollapse() {
    this.collapsed.set(!this.collapsed());
  }
}
