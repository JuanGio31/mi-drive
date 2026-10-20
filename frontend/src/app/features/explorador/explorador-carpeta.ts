import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import {
  Archivo,
  Carpeta,
  ExtensionArchivo,
  ItemRecurso,
  NivelPermiso,
  propietarioItem,
} from '../../core/models';
import { ArchivoService } from '../../core/services/archivo-service';
import { AuthService } from '../../core/services/auth-service';
import { CarpetaService } from '../../core/services/carpeta-service';
import { RecargaService } from '../../core/services/recarga-service';
import { formatearTamanio } from '../../core/utils/formato';
import { itemsMenuUnidad } from '../contextual/items-menu';
import {
  ItemMenuContextual,
  MenuContextualComponent,
} from '../contextual/menu-contextual';

/** Modos de presentación del contenido de una carpeta. */
export type VistaRecursos = 'lista' | 'cuadricula';

/**
 * Lista el contenido de una carpeta (subcarpetas + archivos) con su menú
 * contextual. Reutilizable: sirve para la raíz (carpetaId = null) y para
 * cualquier carpeta.
 *
 * No decide la navegación ni ejecuta acciones: emite `abrirCarpeta`,
 * `abrirArchivo` y `accion` para que la vista contenedora decida qué hacer.
 */
@Component({
  selector: 'app-explorador-carpeta',
  imports: [MatIconModule, MatProgressSpinnerModule, MenuContextualComponent],
  templateUrl: './explorador-carpeta.html',
  styleUrl: './explorador-carpeta.scss',
})
export class ExploradorCarpetaComponent {
  private readonly carpetaService = inject(CarpetaService);
  private readonly archivoService = inject(ArchivoService);
  private readonly auth = inject(AuthService);
  private readonly recargaGlobal = inject(RecargaService);

  /** Carpeta a explorar. null = raíz. */
  readonly carpetaId = input<string | null>(null);

  /** Cambia de valor para forzar una recarga (tras renombrar, mover, etc.). */
  readonly recarga = input(0);

  /** Presentación del contenido: lista vertical o cuadrícula de tarjetas. */
  readonly vista = input<VistaRecursos>('lista');

  readonly abrirCarpeta = output<Carpeta>();
  readonly abrirArchivo = output<Archivo>();
  readonly accion = output<{ accion: string; item: ItemRecurso }>();

  readonly carpetas = signal<Carpeta[]>([]);
  readonly archivos = signal<Archivo[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly vacio = computed(
    () => this.carpetas().length === 0 && this.archivos().length === 0,
  );

  readonly formatearTamanio = formatearTamanio;

  constructor() {
    // Recarga al cambiar de carpeta o al pedir una recarga explícita
    // (desde la vista contenedora o desde cualquier parte de la app).
    effect(() => {
      const id = this.carpetaId();
      this.recarga();
      this.recargaGlobal.version();
      void this.cargar(id);
    });
  }

  /**
   * Opciones del menú según el permiso efectivo que envía el backend: el
   * propietario puede todo; un editor solo ver detalles y renombrar.
   */
  menuDe(item: ItemRecurso): ItemMenuContextual[] {
    const esPropio = propietarioItem(item) === this.auth.usuario()?.id;
    const recurso = item.tipo === 'archivo' ? item.archivo : item.carpeta;
    const puedeEditar = recurso.miPermiso === NivelPermiso.Escritura;
    return itemsMenuUnidad(esPropio, puedeEditar);
  }

  emitirAccion(accion: string, item: ItemRecurso): void {
    this.accion.emit({ accion, item });
  }

  /** Ícono según el tipo de archivo (texto plano / markdown). */
  iconoArchivo(tipo: ExtensionArchivo): string {
    return tipo === ExtensionArchivo.Md ? 'code' : 'description';
  }

  private async cargar(carpetaId: string | null): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const [carpetas, archivos] = await Promise.all([
        firstValueFrom(this.carpetaService.listar({ carpetaPadre: carpetaId })),
        firstValueFrom(this.archivoService.listar({ carpetaPadre: carpetaId })),
      ]);
      const unicas = new Map(
        [...carpetas.propias, ...carpetas.compartidas].map((carpeta) => [
          carpeta._id,
          carpeta,
        ]),
      );
      this.carpetas.set(
        [...unicas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      this.archivos.set(archivos);
    } catch {
      this.error.set('No se pudo cargar el contenido de la carpeta.');
    } finally {
      this.cargando.set(false);
    }
  }
}
