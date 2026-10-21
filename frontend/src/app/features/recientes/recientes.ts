import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { AccionActividad, Actividad, TipoRecurso } from '../../core/models';
import { ActividadService } from '../../core/services/actividad-service';
import { claseAccion, etiquetaAccion, iconoAccion } from '../../core/utils/acciones';
import { formatearFechaHora } from '../../core/utils/formato';

type FiltroRecientes = 'todo' | 'archivos' | 'carpetas';

interface Reciente {
  id: string;
  nombre: string;
  tipo: TipoRecurso;
  accion: AccionActividad;
  fecha: string;
}

const LIMITE_ACTIVIDADES = 100;
const LIMITE_RECURSOS = 50;

const ACCIONES_OCULTAS = new Set<AccionActividad>([
  AccionActividad.EnviarPapelera,
  AccionActividad.EliminarPermanente,
]);

/**
 * Vista "Recientes": últimos archivos y carpetas sobre los que el usuario
 * realizó alguna acción, sin duplicados por recurso.
 */
@Component({
  selector: 'app-recientes',
  imports: [RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './recientes.html',
  styleUrl: './recientes.scss',
})
export class RecientesComponent {
  private readonly actividadService = inject(ActividadService);

  readonly recientes = signal<Reciente[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly filtro = signal<FiltroRecientes>('todo');

  readonly total = computed(() => this.recientes().length);
  readonly totalArchivos = computed(
    () => this.recientes().filter((item) => item.tipo === TipoRecurso.Archivo).length,
  );
  readonly totalCarpetas = computed(
    () => this.recientes().filter((item) => item.tipo === TipoRecurso.Carpeta).length,
  );

  readonly visibles = computed(() => {
    switch (this.filtro()) {
      case 'archivos':
        return this.recientes().filter((item) => item.tipo === TipoRecurso.Archivo);
      case 'carpetas':
        return this.recientes().filter((item) => item.tipo === TipoRecurso.Carpeta);
      default:
        return this.recientes();
    }
  });

  readonly etiquetaAccion = etiquetaAccion;
  readonly iconoAccion = iconoAccion;
  readonly claseAccion = claseAccion;
  readonly formatearFechaHora = formatearFechaHora;

  constructor() {
    void this.cargar();
  }

  /** Reintenta la carga desde el estado de error. */
  recargar(): void {
    void this.cargar();
  }

  /** Ícono de carpeta o del archivo según su extensión. */
  icono(item: Reciente): string {
    if (item.tipo === TipoRecurso.Carpeta) return 'folder';
    return item.nombre.toLowerCase().endsWith('.md') ? 'code' : 'description';
  }

  /** Ruta del recurso reciente. */
  ruta(item: Reciente): string[] {
    return item.tipo === TipoRecurso.Carpeta ? ['/mi-unidad', item.id] : ['/archivo', item.id];
  }

  /** Texto del tipo de recurso. */
  tipoTexto(item: Reciente): string {
    return item.tipo === TipoRecurso.Carpeta ? 'Carpeta' : 'Archivo';
  }

  /** Carga el historial y deja la última actividad de cada recurso. */
  private async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      const [archivos, carpetas] = await Promise.all([
        firstValueFrom(
          this.actividadService.miHistorial({
            recursoTipo: TipoRecurso.Archivo,
            limit: LIMITE_ACTIVIDADES,
          }),
        ),
        firstValueFrom(
          this.actividadService.miHistorial({
            recursoTipo: TipoRecurso.Carpeta,
            limit: LIMITE_ACTIVIDADES,
          }),
        ),
      ]);

      const actividades = [...archivos, ...carpetas].sort(
        (a, b) => this.fechaEnMs(b.createdAt) - this.fechaEnMs(a.createdAt),
      );

      this.recientes.set(
        this.unicos(actividades)
          .slice(0, LIMITE_RECURSOS)
          .map((actividad) => this.aReciente(actividad)),
      );
    } catch {
      this.error.set('No se pudo cargar la actividad reciente. Intenta de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Conserva la actividad más reciente por archivo o carpeta. Si la última
   * acción fue enviar a papelera o eliminar, el recurso no se muestra.
   */
  private unicos(actividades: Actividad[]): Actividad[] {
    const vistos = new Set<string>();
    const unicos: Actividad[] = [];

    for (const actividad of actividades) {
      const id = actividad.recursoId;
      if (!id) continue;
      if (vistos.has(id)) continue;

      vistos.add(id);
      if (ACCIONES_OCULTAS.has(actividad.accion)) continue;

      unicos.push(actividad);
    }

    return unicos;
  }

  private fechaEnMs(iso: string): number {
    const ms = new Date(iso).getTime();
    return Number.isNaN(ms) ? 0 : ms;
  }

  private aReciente(actividad: Actividad): Reciente {
    return {
      id: actividad.recursoId ?? '',
      nombre: actividad.recursoNombre ?? 'Recurso sin nombre',
      tipo: actividad.recursoTipo,
      accion: actividad.accion,
      fecha: actividad.createdAt,
    };
  }
}
