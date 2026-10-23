import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api-service';
import { buildParams } from '../utils/query-params';
import { environment } from '../../../environments/environment';
import {
  ActualizarContenidoDto,
  Archivo,
  CompartirArchivoDto,
  CrearArchivoDto,
  DestacarArchivoDto,
  ListarArchivosQuery,
  MoverArchivoDto,
  RenombrarArchivoDto,
} from '../models';

/** Consume /api/archivos. Todas las rutas requieren autenticación. */
@Injectable({
  providedIn: 'root',
})
export class ArchivoService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  /** GET /archivos. */
  listar(query: ListarArchivosQuery = {}): Observable<Archivo[]> {
    return this.api.get<Archivo[]>('archivos', buildParams(query));
  }

  /** GET /archivos/compartidos. */
  listarCompartidos(): Observable<Archivo[]> {
    return this.api.get<Archivo[]>('archivos/compartidos');
  }

  /** GET /archivos/destacados. */
  listarDestacados(): Observable<Archivo[]> {
    return this.api.get<Archivo[]>('archivos/destacados');
  }

  /** GET /archivos/papelera. */
  listarPapelera(): Observable<Archivo[]> {
    return this.api.get<Archivo[]>('archivos/papelera');
  }

  /** GET /archivos/:id. */
  buscarPorId(id: string): Observable<Archivo> {
    return this.api.get<Archivo>(`archivos/${id}`);
  }

  /** POST /archivos. */
  crear(dto: CrearArchivoDto): Observable<Archivo> {
    return this.api.post<Archivo>('archivos', dto);
  }

  /** POST /archivos/:id/abrir → registra la apertura en el visor. */
  registrarApertura(id: string): Observable<void> {
    return this.api.post<void>(`archivos/${id}/abrir`, {});
  }

  /** PUT /archivos/:id/contenido. */
  actualizarContenido(id: string, dto: ActualizarContenidoDto): Observable<Archivo> {
    return this.api.put<Archivo>(`archivos/${id}/contenido`, dto);
  }

  /** PATCH /archivos/:id/renombrar. */
  renombrar(id: string, dto: RenombrarArchivoDto): Observable<Archivo> {
    return this.api.patch<Archivo>(`archivos/${id}/renombrar`, dto);
  }

  /** PATCH /archivos/:id/mover. */
  mover(id: string, dto: MoverArchivoDto): Observable<Archivo> {
    return this.api.patch<Archivo>(`archivos/${id}/mover`, dto);
  }

  /** PATCH /archivos/:id/destacar. */
  destacar(id: string, dto: DestacarArchivoDto): Observable<{ destacado: boolean }> {
    return this.api.patch<{ destacado: boolean }>(`archivos/${id}/destacar`, dto);
  }

  /** DELETE /archivos/:id → a la papelera. Respuesta 204 sin cuerpo. */
  enviarAPapelera(id: string): Observable<void> {
    return this.api.delete<void>(`archivos/${id}`);
  }

  /** POST /archivos/:id/restaurar. */
  restaurar(id: string): Observable<Archivo> {
    return this.api.post<Archivo>(`archivos/${id}/restaurar`, {});
  }

  /** DELETE /archivos/:id/permanente. */
  eliminarPermanente(id: string): Observable<void> {
    return this.api.delete<void>(`archivos/${id}/permanente`);
  }

  /** POST /archivos/:id/compartir. */
  compartir(id: string, dto: CompartirArchivoDto): Observable<Archivo> {
    return this.api.post<Archivo>(`archivos/${id}/compartir`, dto);
  }

  /** DELETE /archivos/:id/compartir/:usuarioId. */
  quitarCompartido(id: string, usuarioId: string): Observable<Archivo> {
    return this.api.delete<Archivo>(`archivos/${id}/compartir/${usuarioId}`);
  }

  /** GET /archivos/:id/descargar → devuelve el contenido como texto plano. */
  descargar(id: string): Observable<string> {
    return this.http.get(`${environment.apiUrl}/archivos/${id}/descargar`, {
      responseType: 'text',
    });
  }
}
