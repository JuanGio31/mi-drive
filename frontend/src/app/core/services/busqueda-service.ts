import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api-service';
import { ResultadosBusqueda } from '../models';

/** Consume /api/buscar (búsqueda global de archivos y carpetas). */
@Injectable({
  providedIn: 'root',
})
export class BusquedaService {
  private readonly api = inject(ApiService);

  /** GET /buscar?q=texto → archivos y carpetas que coinciden. */
  buscar(q: string, limite?: number): Observable<ResultadosBusqueda> {
    return this.api.get<ResultadosBusqueda>('buscar', {
      q,
      ...(limite ? { limite } : {}),
    });
  }
}
