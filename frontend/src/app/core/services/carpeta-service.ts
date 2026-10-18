import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api-service';
import { buildParams } from '../utils/query-params';
import {
  Carpeta,
  CompartirCarpetaDto,
  CrearCarpetaDto,
  ListarCarpetasQuery,
  ListarCarpetasResponse,
  MoverCarpetaDto,
  RenombrarCarpetaDto,
} from '../models';

/** Consume /api/carpetas. Todas las rutas requieren autenticación. */
@Injectable({
  providedIn: 'root',
})
export class CarpetaService {
  private readonly api = inject(ApiService);

  /** GET /carpetas → { propias, compartidas }. */
  listar(query: ListarCarpetasQuery = {}): Observable<ListarCarpetasResponse> {
    return this.api.get<ListarCarpetasResponse>('carpetas', buildParams(query));
  }

  /** GET /carpetas/:id. */
  buscarPorId(id: string): Observable<Carpeta> {
    return this.api.get<Carpeta>(`carpetas/${id}`);
  }

  /** POST /carpetas. */
  crear(dto: CrearCarpetaDto): Observable<Carpeta> {
    return this.api.post<Carpeta>('carpetas', dto);
  }

  /** PATCH /carpetas/:id/renombrar. */
  renombrar(id: string, dto: RenombrarCarpetaDto): Observable<Carpeta> {
    return this.api.patch<Carpeta>(`carpetas/${id}/renombrar`, dto);
  }

  /** PATCH /carpetas/:id/mover. */
  mover(id: string, dto: MoverCarpetaDto): Observable<Carpeta> {
    return this.api.patch<Carpeta>(`carpetas/${id}/mover`, dto);
  }

  /** DELETE /carpetas/:id → a la papelera. Respuesta 204 sin cuerpo. */
  enviarAPapelera(id: string): Observable<void> {
    return this.api.delete<void>(`carpetas/${id}`);
  }

  /** POST /carpetas/:id/restaurar. */
  restaurar(id: string): Observable<Carpeta> {
    return this.api.post<Carpeta>(`carpetas/${id}/restaurar`, {});
  }

  /** POST /carpetas/:id/compartir. */
  compartir(id: string, dto: CompartirCarpetaDto): Observable<Carpeta> {
    return this.api.post<Carpeta>(`carpetas/${id}/compartir`, dto);
  }

  /** DELETE /carpetas/:id/compartir/:usuarioId. */
  quitarCompartido(id: string, usuarioId: string): Observable<Carpeta> {
    return this.api.delete<Carpeta>(`carpetas/${id}/compartir/${usuarioId}`);
  }
}
