import { Rol } from './enums';

/** Usuario tal como viaja en el payload del token y en /auth/me. */
export interface UsuarioSesion {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
}

/** Respuesta de POST /auth/sign-in y POST /auth/sign-up. */
export interface LoginResponse {
  token: string;
  usuario: UsuarioSesion;
}

/** Respuesta de GET /auth/me. */
export interface MeResponse {
  usuario: UsuarioSesion;
}

export interface LoginDto {
  correo: string;
  password: string;
}

export interface RegistroDto {
  nombre: string;
  correo: string;
  password: string;
}
