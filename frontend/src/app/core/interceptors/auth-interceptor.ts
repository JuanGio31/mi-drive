import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  const cloned = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      // Si el token expiro o no está presente, cerro sesión y redirigir
      if (err.status === 401 && !req.url.includes('/auth/')) {
        authService.logout();
        router.navigate(['/auth/sign-in']);
      }
      return throwError(() => err);
    }),
  );
};
