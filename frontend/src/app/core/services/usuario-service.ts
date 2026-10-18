import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api-service';
import { buildParams } from '../utils/query-params';
import {
  ActualizarUsuarioDto,
  CrearUsuarioDto,
  ListarUsuariosQuery,
  Usuario,
} from '../models';

/**
 * Consume /api/usuarios.
 * Requiere rol administrador salvo buscarPorId/actualizar sobre el propio usuario.
 */
@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private readonly api = inject(ApiService);

  /** GET /usuarios (admin). */
  listar(query: ListarUsuariosQuery = {}): Observable<Usuario[]> {
    return this.api.get<Usuario[]>('usuarios', buildParams(query));
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

  /** DELETE /usuarios/:id → soft delete (desactiva). Respuesta 200 con el usuario. */
  desactivar(id: string): Observable<Usuario> {
    return this.api.delete<Usuario>(`usuarios/${id}`);
  }

  /** POST /usuarios/:id/reactivar (admin). */
  reactivar(id: string): Observable<Usuario> {
    return this.api.post<Usuario>(`usuarios/${id}/reactivar`, {});
  }
}
