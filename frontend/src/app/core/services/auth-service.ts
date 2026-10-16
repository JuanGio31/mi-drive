import { inject, Injectable, signal } from '@angular/core';
import { ApiService } from './api-service';
import { Observable, tap } from 'rxjs';

export interface LoginReponse {
  token: string;
  usuario: {
    id: string;
    nombre: string;
    correo: string;
    rol: 'administrador' | 'usuario';
  };
}

const TOKEN_KEY = 'dms_token';
const USER_KEY = 'dms_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);

  // Signal para el usuario actual/logueado
  readonly usuario = signal<LoginReponse['usuario'] | null>(this.loadUser());

  signIn(correo: string, password: string): Observable<LoginReponse> {
    return this.api.post<LoginReponse>('auth/sign-in', { correo, password }).pipe(
      // tap para actualizar estado luego de login exitoso
      tap((res) => {
        this.guardarSesion(res);
      }),
    );
  }

  signUp(nombre: string, correo: string, password: string): Observable<LoginReponse> {
    return this.api.post<LoginReponse>('auth/sign-up', { nombre, correo, password }).pipe(
      tap((res) => {
        this.guardarSesion(res);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.usuario.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  estaAutenticado(): boolean {
    return !!this.getToken();
  }

  esAdmin(): boolean {
    return this.usuario()?.rol === 'administrador';
  }

  private guardarSesion(res: LoginReponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.usuario));
    this.usuario.set(res.usuario);
  }

  private loadUser(): LoginReponse['usuario'] | null {
    try {
      const user = localStorage.getItem(USER_KEY); // persistir el token entre recargas
      return user ? (JSON.parse(user) as LoginReponse['usuario']) : null;
    } catch {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  }
}
