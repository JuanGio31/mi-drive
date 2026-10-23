import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { Archivo, Carpeta, ExtensionArchivo, NivelPermiso } from '../../core/models';
import { ArchivoService } from '../../core/services/archivo-service';
import { AuthService } from '../../core/services/auth-service';
import { CarpetaService } from '../../core/services/carpeta-service';
import { formatearFecha, formatearTamanio } from '../../core/utils/formato';
import { AccionesRecursosService, AccionRecurso } from '../contextual/acciones-recursos.service';
import { itemsMenuUnidad } from '../contextual/items-menu';
import { MenuContextualComponent } from '../contextual/menu-contextual';

/**
 * Vista "Destacados": reúne las carpetas y archivos que el usuario marcó,
 * incluyendo recursos propios y compartidos a los que aún tiene acceso.
 */
@Component({
  selector: 'app-destacados',
  imports: [RouterLink, MatIconModule, MatProgressSpinnerModule, MenuContextualComponent],
  templateUrl: './destacados.html',
  styleUrl: './destacados.scss',
})
export class DestacadosComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly carpetaService = inject(CarpetaService);
  private readonly archivoService = inject(ArchivoService);
  private readonly acciones = inject(AccionesRecursosService);

  readonly carpetas = signal<Carpeta[]>([]);
  readonly archivos = signal<Archivo[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly totalCarpetas = computed(() => this.carpetas().length);
  readonly totalArchivos = computed(() => this.archivos().length);
  readonly total = computed(() => this.totalCarpetas() + this.totalArchivos());

  readonly formatearFecha = formatearFecha;
  readonly formatearTamanio = formatearTamanio;

  constructor() {
    void this.cargar();
  }

  /** Reintenta la carga desde el estado de error. */
  recargar(): void {
    void this.cargar();
  }

  /** Abre una carpeta destacada en el explorador. */
  abrirCarpeta(carpeta: Carpeta): void {
    void this.router.navigate(['/mi-unidad', carpeta._id]);
  }

  /** Abre un archivo destacado en el visor. */
  abrirArchivo(archivo: Archivo): void {
    void this.router.navigate(['/archivo', archivo._id]);
  }

  /** Indica si la carpeta pertenece al usuario actual. */
  esPropia(carpeta: Carpeta): boolean {
    return carpeta.propietario === this.usuarioId();
  }

  /** Indica si el archivo pertenece al usuario actual. */
  esPropioArchivo(archivo: Archivo): boolean {
    return archivo.propietario === this.usuarioId();
  }

  /** Opciones del menú para una carpeta destacada. */
  menuCarpeta(carpeta: Carpeta) {
    return itemsMenuUnidad(
      this.esPropia(carpeta),
      carpeta.miPermiso === NivelPermiso.Escritura,
      true,
    );
  }

  /** Opciones del menú para un archivo destacado. */
  menuArchivo(archivo: Archivo) {
    return itemsMenuUnidad(
      this.esPropioArchivo(archivo),
      archivo.miPermiso === NivelPermiso.Escritura,
      true,
    );
  }

  /** Ejecuta una acción sobre una carpeta y recarga si hubo cambios. */
  async onAccionCarpeta(accion: string, carpeta: Carpeta): Promise<void> {
    const cambio = await this.acciones.ejecutar(accion as AccionRecurso, {
      tipo: 'carpeta',
      carpeta,
    });
    if (cambio) await this.cargar();
  }

  /** Ejecuta una acción sobre un archivo y recarga si hubo cambios. */
  async onAccionArchivo(accion: string, archivo: Archivo): Promise<void> {
    const cambio = await this.acciones.ejecutar(accion as AccionRecurso, {
      tipo: 'archivo',
      archivo,
    });
    if (cambio) await this.cargar();
  }

  /** Ícono según el tipo de archivo. */
  iconoArchivo(tipo: ExtensionArchivo): string {
    return tipo === ExtensionArchivo.Md ? 'code' : 'description';
  }

  /** Carga en paralelo las carpetas y archivos destacados. */
  private async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      const [carpetas, archivos] = await Promise.all([
        firstValueFrom(this.carpetaService.listarDestacadas()),
        firstValueFrom(this.archivoService.listarDestacados()),
      ]);

      this.carpetas.set(carpetas);
      this.archivos.set(archivos);
    } catch {
      this.error.set('No se pudieron cargar los destacados. Intenta de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }

  private usuarioId(): string {
    return this.auth.usuario()?.id ?? '';
  }
}
