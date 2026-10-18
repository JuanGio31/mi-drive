import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api-service';
import { buildParams } from '../utils/query-params';
import { Actividad, FiltrosActividad, TipoRecursoActividad } from '../models';

/** Consume /api/actividad (auditoría / historial de acciones). */
@Injectable({
  providedIn: 'root',
})
export class ActividadService {
  private readonly api = inject(ApiService);

  /** GET /actividad → historial global (solo admin). */
  listar(filtros: FiltrosActividad = {}): Observable<Actividad[]> {
    return this.api.get<Actividad[]>('actividad', buildParams(filtros));
  }

  /** GET /actividad/mi-historial → historial del usuario autenticado. */
  miHistorial(filtros: FiltrosActividad = {}): Observable<Actividad[]> {
    return this.api.get<Actividad[]>('actividad/mi-historial', buildParams(filtros));
  }

  /** GET /actividad/recurso/:tipo/:id → historial de un recurso concreto. */
  listarPorRecurso(tipo: TipoRecursoActividad, id: string): Observable<Actividad[]> {
    return this.api.get<Actividad[]>(`actividad/recurso/${tipo}/${id}`);
  }
}
