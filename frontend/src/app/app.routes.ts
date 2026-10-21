import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/auth-guard';
import { descartarCambiosGuard } from './features/editor/descartar-cambios.guard';

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
        path: 'archivo/:id/editar',
        loadComponent: () =>
          import('./features/editor/editor-archivo').then((m) => m.EditorArchivoComponent),
        canDeactivate: [descartarCambiosGuard],
        title: 'Editar archivo',
      },
      {
        path: 'archivo/:id',
        loadComponent: () =>
          import('./features/visor/visor-archivo').then((m) => m.VisorArchivoComponent),
        title: 'Archivo',
      },
      {
        path: 'perfil',
        loadComponent: () => import('./features/perfil/perfil').then((m) => m.PerfilComponent),
        title: 'Mi perfil',
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/admin/dashboard/dashboard').then((m) => m.AdminDashboardComponent),
            title: 'Dashboard admin',
          },
          {
            path: 'usuarios',
            loadComponent: () =>
              import('./features/admin/usuarios/usuarios').then((m) => m.AdminUsuariosComponent),
            title: 'Usuarios',
          },
          {
            path: 'reportes',
            loadComponent: () =>
              import('./features/admin/reportes/reportes').then((m) => m.AdminReportesComponent),
            title: 'Reportes',
          },
          {
            path: 'actividad',
            loadComponent: () =>
              import('./features/admin/actividad/actividad').then((m) => m.AdminActividadComponent),
            title: 'Actividad',
          },
        ],
      },
      {
        path: 'recientes',
        loadComponent: () =>
          import('./features/recientes/recientes').then((m) => m.RecientesComponent),
        title: 'Recientes',
      },
      {
        path: 'compartidos',
        loadComponent: () =>
          import('./features/compartidos/compartidos').then((m) => m.CompartidosComponent),
        title: 'Compartido conmigo',
      },
      {
        path: 'papelera',
        loadComponent: () =>
          import('./features/papelera/papelera').then((m) => m.PapeleraComponent),
        title: 'Papelera',
      },
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
