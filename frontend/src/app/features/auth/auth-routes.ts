import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/auth-guard';

export const authRoutes: Routes = [
  {
    path: 'sign-in',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login').then((m) => m.LoginComponent),
    title: 'Iniciar Sesión',
  },
  // signUp
  {
    path: 'sign-up',
    canActivate: [guestGuard],
    loadComponent: () => import('./sign-up/sign-up').then((m) => m.SignUpComponent),
    title: 'Crear cuenta',
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'sign-in',
  },
];
