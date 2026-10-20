import { Rol } from './enums';

/** Documento de usuario del backend (passwordHash nunca se envía). */
export interface Usuario {
  _id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Entrada mínima de GET /usuarios/directorio: para compartir y resolver nombres. */
export interface UsuarioDirectorio {
  _id: string;
  nombre: string;
  correo: string;
  rol: Rol;
}

/** Body de POST /usuarios (solo admin). */
export interface CrearUsuarioDto {
  nombre: string;
  correo: string;
  password: string;
  rol?: Rol;
}

/** Body de PATCH /usuarios/:id (actualización parcial). */
export interface ActualizarUsuarioDto {
  nombre?: string;
  correo?: string;
  activo?: boolean;
  rol?: Rol;
}

/** Respuesta paginada de GET /usuarios (admin). */
export interface ListarUsuariosResponse {
  usuarios: Usuario[];
  total: number;
  page: number;
  limit: number;
}

/** Body de PATCH /usuarios/:id/password (autoservicio). */
export interface CambiarPasswordDto {
  passwordActual: string;
  passwordNueva: string;
}

/** Query de GET /usuarios (solo admin). */
export interface ListarUsuariosQuery {
  rol?: Rol;
  activo?: boolean;
  page?: number;
  limit?: number;
}
