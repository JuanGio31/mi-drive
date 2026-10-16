import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

/**
 * Rutas protegidas (requieren estar login)
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaAutenticado()) return true;

  return router.parseUrl('/auth/sign-in');
};

/**
 * Rutas públicas (signIn y signUp)
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaAutenticado()) {
    return router.parseUrl('/home');
  }
  return true;
};

/**
 * Solo para administradores
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.esAdmin()) {
    return true;
  }

  return router.parseUrl('/home');
};
