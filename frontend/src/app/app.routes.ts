import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // Rutas de autenticación (signIn y signUp)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth-routes').then((m) => m.authRoutes),
  },

  // Home (protegido)
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then((m) => m.HomeComponent),
    title: 'Inicio',
  },
  // Raíz -> Redirigir a home
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  // 404
  {
    path: '**',
    redirectTo: '/home',
  },
];
