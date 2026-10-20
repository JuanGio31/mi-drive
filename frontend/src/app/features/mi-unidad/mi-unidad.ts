import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Archivo, Carpeta, ItemRecurso } from '../../core/models';
import { CarpetaService } from '../../core/services/carpeta-service';
import {
  ExploradorCarpetaComponent,
  VistaRecursos,
} from '../explorador/explorador-carpeta';
import {
  AccionesRecursosService,
  AccionRecurso,
} from '../contextual/acciones-recursos.service';

const CLAVE_VISTA = 'dms_vista_mi_unidad';

/**
 * Vista "Mi Unidad": explora la carpeta raíz o una carpeta concreta según el
 * parámetro de ruta `:id`. Delega el listado en el explorador reutilizable.
 */
@Component({
  selector: 'app-mi-unidad',
  imports: [
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    ExploradorCarpetaComponent,
  ],
  templateUrl: './mi-unidad.html',
  styleUrl: './mi-unidad.scss',
})
export class MiUnidadComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly carpetaService = inject(CarpetaService);
  private readonly acciones = inject(AccionesRecursosService);

  /** Se incrementa para pedir al explorador que recargue su contenido. */
  readonly recarga = signal(0);

  /** Vista elegida por el usuario; se conserva entre visitas. */
  readonly vista = signal<VistaRecursos>(this.vistaGuardada());

  /** id de la carpeta actual desde la URL; null = raíz. */
  readonly carpetaId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id'))),
    { initialValue: null },
  );

  /** Metadatos de la carpeta actual (para el breadcrumb), null en la raíz. */
  readonly carpeta = signal<Carpeta | null>(null);

  constructor() {
    effect(() => {
      const id = this.carpetaId();
      if (!id) {
        this.carpeta.set(null);
        return;
      }
      void this.cargarCarpeta(id);
    });
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

  /** Navega al interior de una subcarpeta. */
  irACarpeta(carpeta: Carpeta): void {
    this.router.navigate(['/mi-unidad', carpeta._id]);
  }

  /** Abre el visor del archivo. */
  abrirArchivo(archivo: Archivo): void {
    this.router.navigate(['/archivo', archivo._id]);
  }

  /** Ejecuta una acción del menú contextual y recarga si hubo cambios. */
  async onAccion(evento: {
    accion: string;
    item: ItemRecurso;
  }): Promise<void> {
    const cambio = await this.acciones.ejecutar(
      evento.accion as AccionRecurso,
      evento.item,
    );
    if (cambio) this.recarga.update((n) => n + 1);
  }

  /** Sube a la carpeta padre o a la raíz. */
  subir(): void {
    const padre = this.carpeta()?.carpetaPadre;
    this.router.navigate(padre ? ['/mi-unidad', padre] : ['/mi-unidad']);
  }

  /** Lee la última vista guardada, usando lista como valor seguro. */
  private vistaGuardada(): VistaRecursos {
    try {
      return localStorage.getItem(CLAVE_VISTA) === 'cuadricula'
        ? 'cuadricula'
        : 'lista';
    } catch {
      return 'lista';
    }
  }

  private async cargarCarpeta(id: string): Promise<void> {
    try {
      this.carpeta.set(await firstValueFrom(this.carpetaService.buscarPorId(id)));
    } catch {
      this.carpeta.set(null);
    }
  }
}
