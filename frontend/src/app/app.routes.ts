import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // Rutas de autenticación (signIn y signUp)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth-routes').then((m) => m.authRoutes),
  },

  // Shell protegido: layout (sidebar + topbar) con las secciones internas
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/layout/layout/layout').then((m) => m.Layout),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./features/home/home').then((m) => m.HomeComponent),
        title: 'Inicio',
      },
      {
        path: 'mi-unidad',
        loadComponent: () =>
          import('./features/mi-unidad/mi-unidad').then((m) => m.MiUnidadComponent),
        title: 'Mi Unidad',
      },
      {
        path: 'mi-unidad/:id',
        loadComponent: () =>
          import('./features/mi-unidad/mi-unidad').then((m) => m.MiUnidadComponent),
        title: 'Mi Unidad',
      },
      {
        path: 'archivo/:id',
        loadComponent: () =>
          import('./features/visor/visor-archivo').then((m) => m.VisorArchivoComponent),
        title: 'Archivo',
      },
      // Aquí se irán añadiendo las secciones del sidebar:
      // recientes, compartidos, papelera
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },

  // 404 -> home
  {
    path: '**',
    redirectTo: '/home',
  },
];
