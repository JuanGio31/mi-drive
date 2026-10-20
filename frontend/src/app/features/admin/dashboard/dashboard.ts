import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Actividad,
  ArchivoMasCompartidoItem,
  ResumenAdmin,
  TopUsuarioItem,
} from '../../../core/models';
import {
  claseAccion,
  etiquetaAccion,
  iconoAccion,
} from '../../../core/utils/acciones';
import { ActividadService } from '../../../core/services/actividad-service';
import { ReporteService } from '../../../core/services/reporte-service';
import {
  formatearFechaHora,
  formatearTamanio,
} from '../../../core/utils/formato';

/** Vista general del sistema. Ruta: /admin/dashboard. */
@Component({
  selector: 'app-admin-dashboard',
  imports: [
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class AdminDashboardComponent {
  private readonly reporteService = inject(ReporteService);
  private readonly actividadService = inject(ActividadService);

  readonly resumen = signal<ResumenAdmin | null>(null);
  readonly topUsuarios = signal<TopUsuarioItem[]>([]);
  readonly archivosCompartidos = signal<ArchivoMasCompartidoItem[]>([]);
  readonly actividades = signal<Actividad[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly maxArchivos = computed(() =>
    Math.max(1, ...this.topUsuarios().map((u) => u.totalArchivos)),
  );

  readonly formatearTamanio = formatearTamanio;
  readonly formatearFechaHora = formatearFechaHora;

  constructor() {
    this.cargar();
  }

  /** Carga en paralelo los totales, tops y la actividad reciente. */
  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    forkJoin({
      resumen: this.reporteService.resumenAdmin(),
      usuarios: this.reporteService.topUsuarios({ limite: 5 }),
      compartidos: this.reporteService.archivosMasCompartidos({ limite: 5 }),
      actividad: this.actividadService.listar({ limit: 10 }),
    }).subscribe({
      next: ({ resumen, usuarios, compartidos, actividad }) => {
        this.resumen.set(resumen);
        this.topUsuarios.set(usuarios);
        this.archivosCompartidos.set(compartidos);
        this.actividades.set(actividad.actividades);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(
          (err.error as { error?: string })?.error ??
            'No se pudieron cargar los datos del dashboard.',
        );
      },
    });
  }

  /** Icono representativo de una acción de auditoría. */
  readonly iconoAccion = iconoAccion;

  /** Etiqueta legible de una acción de auditoría. */
  readonly etiquetaAccion = etiquetaAccion;

  /** Color del icono según el tipo de acción. */
  readonly claseAccion = claseAccion;

  /** Iniciales para el avatar del top de usuarios. */
  iniciales(nombre: string): string {
    return (
      nombre
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join('') || 'U'
    );
  }

  /** Accede a `tamañoTotal` sin el identificador Unicode en la plantilla. */
  tamanoTotal(item: { tamañoTotal: number }): number {
    return item['tamañoTotal'];
  }

  /** Porcentaje del total de archivos del usuario respecto al top. */
  porcentajeArchivos(total: number): number {
    return Math.max(4, Math.round((total / this.maxArchivos()) * 100));
  }
}
