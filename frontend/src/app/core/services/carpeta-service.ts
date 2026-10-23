import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { ApiService } from './api-service';
import { buildParams } from '../utils/query-params';
import {
  Carpeta,
  CompartirCarpetaDto,
  CrearCarpetaDto,
  DestacarCarpetaDto,
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

  /**
   * Recorre el árbol accesible del usuario para construir las opciones del
   * selector de destino. Se limita la profundidad para evitar ciclos.
   */
  async listarTodasAccesibles(): Promise<Carpeta[]> {
    const resultado = new Map<string, Carpeta>();
    const visitadas = new Set<string>();

    const cargar = async (carpetaPadre: string | null, nivel: number): Promise<void> => {
      if (nivel > 20) return;

      const respuesta = await firstValueFrom(
        this.listar({ carpetaPadre: carpetaPadre ?? undefined }),
      );
      const carpetas = [...respuesta.propias, ...respuesta.compartidas];
      const nuevas = carpetas.filter((carpeta) => !visitadas.has(carpeta._id));

      for (const carpeta of nuevas) {
        visitadas.add(carpeta._id);
        resultado.set(carpeta._id, carpeta);
      }

      await Promise.all(nuevas.map((carpeta) => cargar(carpeta._id, nivel + 1)));
    };

    await cargar(null, 0);
    return [...resultado.values()];
  }

  /** GET /carpetas/destacadas. */
  listarDestacadas(): Observable<Carpeta[]> {
    return this.api.get<Carpeta[]>('carpetas/destacadas');
  }

  /** GET /carpetas/papelera. */
  listarPapelera(): Observable<Carpeta[]> {
    return this.api.get<Carpeta[]>('carpetas/papelera');
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

  /** PATCH /carpetas/:id/destacar. */
  destacar(id: string, dto: DestacarCarpetaDto): Observable<{ destacado: boolean }> {
    return this.api.patch<{ destacado: boolean }>(`carpetas/${id}/destacar`, dto);
  }

  /** DELETE /carpetas/:id → a la papelera. Respuesta 204 sin cuerpo. */
  enviarAPapelera(id: string): Observable<void> {
    return this.api.delete<void>(`carpetas/${id}`);
  }

  /** POST /carpetas/:id/restaurar. */
  restaurar(id: string): Observable<Carpeta> {
    return this.api.post<Carpeta>(`carpetas/${id}/restaurar`, {});
  }

  /** DELETE /carpetas/:id/permanente → elimina también su subárbol. */
  eliminarPermanente(id: string): Observable<void> {
    return this.api.delete<void>(`carpetas/${id}/permanente`);
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
