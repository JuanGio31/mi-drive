import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api-service';
import { buildParams } from '../utils/query-params';
import {
  ActualizarUsuarioDto,
  CambiarPasswordDto,
  CrearUsuarioDto,
  ListarUsuariosQuery,
  ListarUsuariosResponse,
  Usuario,
  UsuarioDirectorio,
} from '../models';

/**
 * Consume /api/usuarios.
 * Requiere rol administrador salvo buscarPorId/actualizar/cambiarPassword
 * sobre el propio usuario.
 */
@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private readonly api = inject(ApiService);

  /** GET /usuarios (admin) → usuarios de la página + total. */
  listar(query: ListarUsuariosQuery = {}): Observable<ListarUsuariosResponse> {
    return this.api.get<ListarUsuariosResponse>('usuarios', buildParams(query));
  }

  /** GET /usuarios/directorio → usuarios activos (id, nombre, correo, rol). */
  directorio(): Observable<UsuarioDirectorio[]> {
    return this.api.get<UsuarioDirectorio[]>('usuarios/directorio');
  }

  /** GET /usuarios/:id. */
  buscarPorId(id: string): Observable<Usuario> {
    return this.api.get<Usuario>(`usuarios/${id}`);
  }

  /** POST /usuarios (admin). */
  crear(dto: CrearUsuarioDto): Observable<Usuario> {
    return this.api.post<Usuario>('usuarios', dto);
  }

  /** PATCH /usuarios/:id. */
  actualizar(id: string, dto: ActualizarUsuarioDto): Observable<Usuario> {
    return this.api.patch<Usuario>(`usuarios/${id}`, dto);
  }

  /** PATCH /usuarios/:id/password → cambia la contraseña del propio usuario. */
  cambiarPassword(id: string, dto: CambiarPasswordDto): Observable<{ mensaje: string }> {
    return this.api.patch<{ mensaje: string }>(`usuarios/${id}/password`, dto);
  }

  /** DELETE /usuarios/:id → soft delete (desactiva). Respuesta 200 con el usuario. */
  desactivar(id: string): Observable<Usuario> {
    return this.api.delete<Usuario>(`usuarios/${id}`);
  }

  /** POST /usuarios/:id/reactivar (admin). */
  reactivar(id: string): Observable<Usuario> {
    return this.api.post<Usuario>(`usuarios/${id}/reactivar`, {});
  }
}
