import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import {
  ArchivoMasCompartidoItem,
  ArchivoMasOperacionesItem,
  ArchivoPorRangoItem,
  ArchivosPorTipoItem,
  ConteoPorAccion,
  ConteoPorPeriodo,
  RecursoCompartidoItem,
  RecursoRecibidoItem,
  TopUsuarioItem,
  UnidadPeriodo,
  Usuario,
  UsuarioMasCompartidosItem,
} from '../../../core/models';
import { ReporteService } from '../../../core/services/reporte-service';
import { UsuarioService } from '../../../core/services/usuario-service';
import { etiquetaAccion } from '../../../core/utils/acciones';
import { fechaLocalAIso } from '../../../core/utils/fecha';
import {
  formatearFecha,
  formatearTamanio,
} from '../../../core/utils/formato';

/** Reportes globales del sistema. Ruta: /admin/reportes. */
@Component({
  selector: 'app-admin-reportes',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTabsModule,
  ],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
})
export class AdminReportesComponent {
  private readonly reporteService = inject(ReporteService);
  private readonly usuarioService = inject(UsuarioService);

  readonly formatearTamanio = formatearTamanio;
  readonly formatearFecha = formatearFecha;
  readonly etiquetaAccion = etiquetaAccion;

  readonly archivosPorTipo = signal<ArchivosPorTipoItem[]>([]);
  readonly archivosRango = signal<ArchivoPorRangoItem[]>([]);
  readonly masOperaciones = signal<ArchivoMasOperacionesItem[]>([]);
  readonly topUsuarios = signal<TopUsuarioItem[]>([]);
  readonly usuariosCompartidos = signal<UsuarioMasCompartidosItem[]>([]);
  readonly archivosCompartidos = signal<ArchivoMasCompartidoItem[]>([]);
  readonly usuarios = signal<Usuario[]>([]);
  readonly compartidosUsuario = signal<RecursoCompartidoItem[]>([]);
  readonly recibidosUsuario = signal<RecursoRecibidoItem[]>([]);
  readonly actividadPorTipo = signal<ConteoPorAccion[]>([]);
  readonly actividadPorPeriodo = signal<ConteoPorPeriodo[]>([]);

  readonly desde = signal('');
  readonly hasta = signal('');
  readonly usuarioSeleccionado = signal('');
  readonly unidad = signal<UnidadPeriodo>('dia');

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  private solicitudes = 0;

  readonly totalArchivos = computed(() =>
    this.archivosPorTipo().reduce((total, item) => total + item.total, 0),
  );

  readonly totalAlmacenamiento = computed(() =>
    this.archivosPorTipo().reduce(
      (total, item) => total + item.tamañoTotal,
      0,
    ),
  );

  readonly totalOperacionesTipo = computed(() =>
    this.actividadPorTipo().reduce((total, item) => total + item.total, 0),
  );

  readonly totalPeriodo = computed(() =>
    this.actividadPorPeriodo().reduce((total, item) => total + item.total, 0),
  );

  constructor() {
    this.cargarTodo();
    this.cargarUsuarios();
  }

  /** Lanza las consultas principales de todas las pestañas. */
  private cargarTodo(): void {
    this.consultar(
      this.reporteService.archivosPorTipo(),
      (datos) => this.archivosPorTipo.set(datos),
    );
    this.consultar(
      this.reporteService.archivosPorRango(),
      (datos) => this.archivosRango.set(datos),
    );
    this.consultar(
      this.reporteService.archivosConMasOperaciones({ limite: 10 }),
      (datos) => this.masOperaciones.set(datos),
    );
    this.consultar(
      this.reporteService.topUsuarios({ limite: 10 }),
      (datos) => this.topUsuarios.set(datos),
    );
    this.consultar(
      this.reporteService.usuariosMasCompartidos({ limite: 10 }),
      (datos) => this.usuariosCompartidos.set(datos),
    );
    this.consultar(
      this.reporteService.archivosMasCompartidos({ limite: 10 }),
      (datos) => this.archivosCompartidos.set(datos),
    );
    this.cargarActividad();
  }

  /** Carga los usuarios para el selector de compartición. */
  private cargarUsuarios(): void {
    this.usuarioService.listar({ limit: 100 }).subscribe({
      next: (res) => this.usuarios.set(res.usuarios),
      error: () => this.usuarios.set([]),
    });
  }

  /** Aplica el rango de fechas al reporte de archivos. */
  buscarRango(): void {
    this.consultar(
      this.reporteService.archivosPorRango({
        desde: fechaLocalAIso(this.desde()),
        hasta: fechaLocalAIso(this.hasta(), true),
      }),
      (datos) => this.archivosRango.set(datos),
    );
  }

  /** Limpia el rango de fechas y vuelve a los últimos archivos. */
  limpiarRango(): void {
    this.desde.set('');
    this.hasta.set('');
    this.buscarRango();
  }

  /** Carga los recursos compartidos y recibidos del usuario elegido. */
  seleccionarUsuario(usuarioId: string): void {
    this.usuarioSeleccionado.set(usuarioId);
    this.compartidosUsuario.set([]);
    this.recibidosUsuario.set([]);

    if (!usuarioId) return;

    this.consultar(
      this.reporteService.recursosCompartidosPorUsuario(usuarioId),
      (datos) => {
        this.compartidosUsuario.set([
          ...datos.archivos,
          ...datos.carpetas,
        ]);
      },
    );
    this.consultar(
      this.reporteService.recursosRecibidosPorUsuario(usuarioId),
      (datos) => {
        this.recibidosUsuario.set([...datos.archivos, ...datos.carpetas]);
      },
    );
  }

  /** Cambia la unidad de agrupación y recarga los conteos globales. */
  cambiarUnidad(unidad: UnidadPeriodo): void {
    this.unidad.set(unidad);
    this.cargarActividad();
  }

  /** Carga los conteos globales por acción y por período. */
  private cargarActividad(): void {
    this.consultar(
      this.reporteService.operacionesPorTipoGlobal(),
      (datos) => this.actividadPorTipo.set(datos),
    );
    this.consultar(
      this.reporteService.operacionesPorPeriodoGlobal({
        unidad: this.unidad(),
      }),
      (datos) => this.actividadPorPeriodo.set(datos),
    );
  }

  /** Ejecuta una consulta con contador de carga y manejo de error común. */
  private consultar<T>(
    peticion: Observable<T>,
    aplicar: (datos: T) => void,
  ): void {
    this.solicitudes++;
    this.cargando.set(true);
    this.error.set(null);

    peticion.subscribe({
      next: (datos) => {
        aplicar(datos);
        this.finalizar();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeError(err));
        this.finalizar();
      },
    });
  }

  /** Decrementa el contador y apaga el indicador al terminar todo. */
  private finalizar(): void {
    this.solicitudes = Math.max(0, this.solicitudes - 1);
    if (this.solicitudes === 0) this.cargando.set(false);
  }

  /** Accede a `tamañoTotal` sin el identificador Unicode en la plantilla. */
  tamanoTotal(item: { tamañoTotal: number }): number {
    return item['tamañoTotal'];
  }

  /** Accede a `tamaño` sin el identificador Unicode en la plantilla. */
  tamano(item: { tamaño: number }): number {
    return item['tamaño'];
  }

  /** Porcentaje entero para las barras de distribución. */
  porcentaje(valor: number, total: number): number {
    if (!total) return 0;
    return Math.max(2, Math.round((valor / total) * 100));
  }

  /** Traduce el error HTTP a un mensaje legible. */
  private mensajeError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    return (
      (err.error as { error?: string })?.error ??
      'No se pudo cargar el reporte.'
    );
  }
}
