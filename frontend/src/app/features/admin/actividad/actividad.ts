import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import {
  AccionActividad,
  Actividad,
  FiltrosActividad,
  TipoRecurso,
  Usuario,
} from '../../../core/models';
import { ActividadService } from '../../../core/services/actividad-service';
import { UsuarioService } from '../../../core/services/usuario-service';
import {
  OPCIONES_ACCION,
  claseAccion,
  etiquetaAccion,
  iconoAccion,
} from '../../../core/utils/acciones';
import { fechaLocalAIso } from '../../../core/utils/fecha';
import { formatearFechaHora } from '../../../core/utils/formato';

/** Auditoría global del sistema con filtros. Ruta: /admin/actividad. */
@Component({
  selector: 'app-admin-actividad',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
  ],
  templateUrl: './actividad.html',
  styleUrl: './actividad.scss',
})
export class AdminActividadComponent {
  private readonly actividadService = inject(ActividadService);
  private readonly usuarioService = inject(UsuarioService);

  readonly columnas = ['fecha', 'usuario', 'accion', 'recurso'];
  readonly acciones = OPCIONES_ACCION;
  readonly tiposRecurso = Object.values(TipoRecurso);
  readonly etiquetaAccion = etiquetaAccion;
  readonly iconoAccion = iconoAccion;
  readonly claseAccion = claseAccion;
  readonly formatearFechaHora = formatearFechaHora;

  readonly actividades = signal<Actividad[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly usuarioId = signal('');
  readonly accion = signal<AccionActividad | ''>('');
  readonly recursoTipo = signal<TipoRecurso | ''>('');
  readonly desde = signal('');
  readonly hasta = signal('');

  constructor() {
    this.cargarUsuarios();
    this.cargar();
  }

  /** Carga los usuarios para el filtro (máximo 100, ordenados por alta). */
  private cargarUsuarios(): void {
    this.usuarioService.listar({ limit: 100 }).subscribe({
      next: (res) => this.usuarios.set(res.usuarios),
      error: () => this.usuarios.set([]),
    });
  }

  /** Consulta la página actual aplicando los filtros. */
  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    const filtros: FiltrosActividad = {
      page: this.page(),
      limit: this.limit(),
      ...(this.usuarioId() ? { usuarioId: this.usuarioId() } : {}),
      ...(this.accion() ? { accion: this.accion() as AccionActividad } : {}),
      ...(this.recursoTipo() ? { recursoTipo: this.recursoTipo() as TipoRecurso } : {}),
      ...(this.desde() ? { desde: fechaLocalAIso(this.desde()) } : {}),
      ...(this.hasta() ? { hasta: fechaLocalAIso(this.hasta(), true) } : {}),
    };

    this.actividadService.listar(filtros).subscribe({
      next: (res) => {
        this.actividades.set(res.actividades);
        this.total.set(res.total);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(err));
      },
    });
  }

  /** Aplica los filtros desde la primera página. */
  filtrar(): void {
    this.page.set(1);
    this.cargar();
  }

  /** Restablece todos los filtros y recarga. */
  limpiar(): void {
    this.usuarioId.set('');
    this.accion.set('');
    this.recursoTipo.set('');
    this.desde.set('');
    this.hasta.set('');
    this.page.set(1);
    this.cargar();
  }

  /** Cambia de página respetando el tamaño seleccionado. */
  cambiarPagina(evento: PageEvent): void {
    this.page.set(evento.pageIndex + 1);
    this.limit.set(evento.pageSize);
    this.cargar();
  }

  /** Traduce el error HTTP a un mensaje legible. */
  private mensajeError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    return (err.error as { error?: string })?.error ?? 'No se pudo cargar la actividad.';
  }
}
