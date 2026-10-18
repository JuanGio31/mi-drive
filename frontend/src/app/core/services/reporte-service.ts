import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api-service';
import { buildParams } from '../utils/query-params';
import {
  Actividad,
  ArchivoMasCompartidoItem,
  ArchivoMasOperacionesItem,
  ArchivoPorRangoItem,
  ArchivosPorTipoItem,
  ConteoPorAccion,
  ConteoPorPeriodo,
  PeriodoQuery,
  RangoFechasQuery,
  RecursosCompartidosResponse,
  RecursosRecibidosResponse,
  TopLimiteQuery,
  TopUsuarioItem,
  UsuarioMasCompartidosItem,
} from '../models';

/** Consume /api/reportes (estadísticas y analítica). */
@Injectable({
  providedIn: 'root',
})
export class ReporteService {
  private readonly api = inject(ApiService);

  // ============ Archivos y almacenamiento ============

  /** GET /reportes/archivos/por-tipo. */
  archivosPorTipo(): Observable<ArchivosPorTipoItem[]> {
    return this.api.get<ArchivosPorTipoItem[]>('reportes/archivos/por-tipo');
  }

  /** GET /reportes/archivos/por-rango. */
  archivosPorRango(query: RangoFechasQuery = {}): Observable<ArchivoPorRangoItem[]> {
    return this.api.get<ArchivoPorRangoItem[]>('reportes/archivos/por-rango', buildParams(query));
  }

  /** GET /reportes/archivos/mas-operaciones. */
  archivosConMasOperaciones(query: TopLimiteQuery = {}): Observable<ArchivoMasOperacionesItem[]> {
    return this.api.get<ArchivoMasOperacionesItem[]>(
      'reportes/archivos/mas-operaciones',
      buildParams(query),
    );
  }

  // ============ Usuarios ============

  /** GET /reportes/usuarios/top-archivos. */
  topUsuarios(query: TopLimiteQuery = {}): Observable<TopUsuarioItem[]> {
    return this.api.get<TopUsuarioItem[]>('reportes/usuarios/top-archivos', buildParams(query));
  }

  /** GET /reportes/usuarios/mas-compartidos. */
  usuariosMasCompartidos(query: TopLimiteQuery = {}): Observable<UsuarioMasCompartidosItem[]> {
    return this.api.get<UsuarioMasCompartidosItem[]>(
      'reportes/usuarios/mas-compartidos',
      buildParams(query),
    );
  }

  // ============ Compartición ============

  /** GET /reportes/compartidos/mas-compartidos. */
  archivosMasCompartidos(query: TopLimiteQuery = {}): Observable<ArchivoMasCompartidoItem[]> {
    return this.api.get<ArchivoMasCompartidoItem[]>(
      'reportes/compartidos/mas-compartidos',
      buildParams(query),
    );
  }

  /** GET /reportes/compartidos/por-usuario/:usuarioId. */
  recursosCompartidosPorUsuario(usuarioId: string): Observable<RecursosCompartidosResponse> {
    return this.api.get<RecursosCompartidosResponse>(`reportes/compartidos/por-usuario/${usuarioId}`);
  }

  /** GET /reportes/compartidos/recibidos/:usuarioId. */
  recursosRecibidosPorUsuario(usuarioId: string): Observable<RecursosRecibidosResponse> {
    return this.api.get<RecursosRecibidosResponse>(`reportes/compartidos/recibidos/${usuarioId}`);
  }

  // ============ Actividad ============

  /** GET /reportes/actividad/mi-rango → historial del usuario autenticado. */
  miActividadPorRango(query: RangoFechasQuery = {}): Observable<Actividad[]> {
    return this.api.get<Actividad[]>('reportes/actividad/mi-rango', buildParams(query));
  }

  /** GET /reportes/actividad/por-tipo → conteo por acción. */
  operacionesPorTipo(query: PeriodoQuery = {}): Observable<ConteoPorAccion[]> {
    return this.api.get<ConteoPorAccion[]>('reportes/actividad/por-tipo', buildParams(query));
  }

  /** GET /reportes/actividad/por-periodo → conteo por día/mes/año. */
  operacionesPorPeriodo(query: PeriodoQuery = {}): Observable<ConteoPorPeriodo[]> {
    return this.api.get<ConteoPorPeriodo[]>('reportes/actividad/por-periodo', buildParams(query));
  }

  // ============ Globales (solo admin) ============

  /** GET /reportes/admin/archivos/por-tipo. */
  archivosPorTipoGlobal(): Observable<ArchivosPorTipoItem[]> {
    return this.api.get<ArchivosPorTipoItem[]>('reportes/admin/archivos/por-tipo');
  }
}
