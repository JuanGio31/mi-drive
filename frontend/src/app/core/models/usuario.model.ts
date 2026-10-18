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
}

/** Query de GET /usuarios (solo admin). */
export interface ListarUsuariosQuery {
  rol?: Rol;
  activo?: boolean;
  page?: number;
  limit?: number;
}
