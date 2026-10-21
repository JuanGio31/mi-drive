import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Archivo, Carpeta, ExtensionArchivo, ItemRecurso } from '../../core/models';
import { ArchivoService } from '../../core/services/archivo-service';
import { CarpetaService } from '../../core/services/carpeta-service';
import { formatearTamanio } from '../../core/utils/formato';
import { VistaRecursos } from '../explorador/explorador-carpeta';
import { AccionesRecursosService, AccionRecurso } from '../contextual/acciones-recursos.service';
import { ITEMS_MENU_PAPELERA } from '../contextual/items-menu';
import { MenuContextualComponent } from '../contextual/menu-contextual';

const CLAVE_VISTA = 'dms_vista_papelera';

/**
 * Vista "Papelera": lista los archivos y carpetas propios que están en la
 * papelera (`enPapelera: true`) y permite restaurarlos desde su menú contextual.
 */
@Component({
  selector: 'app-papelera',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MenuContextualComponent,
  ],
  templateUrl: './papelera.html',
  styleUrl: './papelera.scss',
})
export class PapeleraComponent {
  private readonly carpetaService = inject(CarpetaService);
  private readonly archivoService = inject(ArchivoService);
  private readonly acciones = inject(AccionesRecursosService);

  readonly carpetas = signal<Carpeta[]>([]);
  readonly archivos = signal<Archivo[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly vacio = computed(() => this.carpetas().length === 0 && this.archivos().length === 0);

  /** Vista elegida por el usuario; se conserva entre visitas. */
  readonly vista = signal<VistaRecursos>(this.vistaGuardada());

  readonly itemsMenu = ITEMS_MENU_PAPELERA;
  readonly formatearTamanio = formatearTamanio;

  constructor() {
    void this.cargar();
  }

  /** Ícono según el tipo de archivo (texto plano / markdown). */
  iconoArchivo(tipo: ExtensionArchivo): string {
    return tipo === ExtensionArchivo.Md ? 'code' : 'description';
  }

  /** Cambia la presentación del listado y recuerda la preferencia. */
  cambiarVista(vista: VistaRecursos): void {
    this.vista.set(vista);
    try {
      localStorage.setItem(CLAVE_VISTA, vista);
    } catch {
      // Sin almacenamiento disponible: la vista solo dura esta sesión.
    }
  }

  /** Ejecuta la acción del menú (restaurar) y recarga si hubo cambios. */
  async onAccion(accion: string, item: ItemRecurso): Promise<void> {
    const cambio = await this.acciones.ejecutar(accion as AccionRecurso, item);
    if (cambio) await this.cargar();
  }

  /** Lee la última vista guardada, usando lista como valor seguro. */
  private vistaGuardada(): VistaRecursos {
    try {
      return localStorage.getItem(CLAVE_VISTA) === 'cuadricula' ? 'cuadricula' : 'lista';
    } catch {
      return 'lista';
    }
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const [carpetas, archivos] = await Promise.all([
        firstValueFrom(this.carpetaService.listarPapelera()),
        firstValueFrom(this.archivoService.listarPapelera()),
      ]);
      this.carpetas.set(carpetas);
      this.archivos.set(archivos);
    } catch {
      this.error.set('No se pudo cargar la papelera.');
    } finally {
      this.cargando.set(false);
    }
  }
}
