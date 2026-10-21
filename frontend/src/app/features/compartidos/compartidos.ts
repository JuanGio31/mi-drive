import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import {
  Archivo,
  Carpeta,
  ExtensionArchivo,
  NivelPermiso,
  UsuarioDirectorio,
} from '../../core/models';
import { AccionesRecursosService, AccionRecurso } from '../contextual/acciones-recursos.service';
import { itemsMenuUnidad } from '../contextual/items-menu';
import { MenuContextualComponent } from '../contextual/menu-contextual';
import { ArchivoService } from '../../core/services/archivo-service';
import { AuthService } from '../../core/services/auth-service';
import { CarpetaService } from '../../core/services/carpeta-service';
import { UsuarioService } from '../../core/services/usuario-service';
import { formatearFecha, formatearTamanio } from '../../core/utils/formato';
import { etiquetaPermiso, iconoPermiso } from '../../core/utils/permisos';

interface CarpetaCompartida {
  carpeta: Carpeta;
  permiso: NivelPermiso;
  fechaCompartido: string;
  propietarioNombre: string;
}

interface ArchivoCompartido {
  archivo: Archivo;
  permiso: NivelPermiso;
  fechaCompartido: string;
  propietarioNombre: string;
}

/**
 * Vista "Compartido conmigo": reúne las carpetas y archivos que otros
 * usuarios compartieron directamente con el usuario autenticado.
 */
@Component({
  selector: 'app-compartidos',
  imports: [RouterLink, MatIconModule, MatProgressSpinnerModule, MenuContextualComponent],
  templateUrl: './compartidos.html',
  styleUrl: './compartidos.scss',
})
export class CompartidosComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly carpetaService = inject(CarpetaService);
  private readonly archivoService = inject(ArchivoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly acciones = inject(AccionesRecursosService);

  readonly carpetas = signal<CarpetaCompartida[]>([]);
  readonly archivos = signal<ArchivoCompartido[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly totalCarpetas = computed(() => this.carpetas().length);
  readonly totalArchivos = computed(() => this.archivos().length);
  readonly total = computed(() => this.totalCarpetas() + this.totalArchivos());

  readonly formatearFecha = formatearFecha;
  readonly formatearTamanio = formatearTamanio;
  readonly etiquetaPermiso = etiquetaPermiso;
  readonly iconoPermiso = iconoPermiso;

  constructor() {
    void this.cargar();
  }

  /** Reintenta la carga desde el estado de error. */
  recargar(): void {
    void this.cargar();
  }

  /** Abre una carpeta compartida en el explorador. */
  abrirCarpeta(carpeta: Carpeta): void {
    void this.router.navigate(['/mi-unidad', carpeta._id]);
  }

  /** Abre un archivo compartido en el visor. */
  abrirArchivo(archivo: Archivo): void {
    void this.router.navigate(['/archivo', archivo._id]);
  }

  /** Solo se puede renombrar con permiso de escritura; nunca se comparte ni se borra desde aquí. */
  menuCarpeta(item: CarpetaCompartida) {
    return itemsMenuUnidad(false, item.permiso === NivelPermiso.Escritura);
  }

  /** Solo se puede renombrar con permiso de escritura; nunca se comparte ni se borra desde aquí. */
  menuArchivo(item: ArchivoCompartido) {
    return itemsMenuUnidad(false, item.permiso === NivelPermiso.Escritura);
  }

  /** Ejecuta una acción sobre una carpeta y recarga la vista si cambió. */
  async onAccionCarpeta(accion: string, item: CarpetaCompartida): Promise<void> {
    const cambio = await this.acciones.ejecutar(accion as AccionRecurso, {
      tipo: 'carpeta',
      carpeta: item.carpeta,
    });
    if (cambio) await this.cargar();
  }

  /** Ejecuta una acción sobre un archivo y recarga la vista si cambió. */
  async onAccionArchivo(accion: string, item: ArchivoCompartido): Promise<void> {
    const cambio = await this.acciones.ejecutar(accion as AccionRecurso, {
      tipo: 'archivo',
      archivo: item.archivo,
    });
    if (cambio) await this.cargar();
  }

  /** Ícono según el tipo de archivo. */
  iconoArchivo(tipo: ExtensionArchivo): string {
    return tipo === ExtensionArchivo.Md ? 'code' : 'description';
  }

  /** Color del chip según el nivel de permiso. */
  clasePermiso(permiso: NivelPermiso): string {
    return permiso;
  }

  /** Carga en paralelo carpetas, archivos y nombres de propietarios. */
  private async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      const usuarioId = this.auth.usuario()?.id ?? '';
      const [carpetas, archivos, directorio] = await Promise.all([
        firstValueFrom(this.carpetaService.listar()),
        firstValueFrom(this.archivoService.listarCompartidos()),
        firstValueFrom(this.usuarioService.directorio()).catch(() => [] as UsuarioDirectorio[]),
      ]);

      const nombres = new Map(directorio.map((usuario) => [usuario._id, usuario.nombre]));

      this.carpetas.set(
        this.ordenarPorFecha(
          carpetas.compartidas.flatMap((carpeta) => {
            const acceso = carpeta.compartidoCon.find(
              (compartido) => compartido.usuario === usuarioId,
            );
            if (!acceso) return [];

            return [
              {
                carpeta,
                permiso: acceso.permiso,
                fechaCompartido: acceso.fechaCompartido,
                propietarioNombre: this.nombrePropietario(carpeta.propietario, nombres),
              },
            ];
          }),
        ),
      );

      this.archivos.set(
        this.ordenarPorFecha(
          archivos.flatMap((archivo) => {
            const acceso = archivo.compartidoCon.find(
              (compartido) => compartido.usuario === usuarioId,
            );
            if (!acceso) return [];

            return [
              {
                archivo,
                permiso: acceso.permiso,
                fechaCompartido: acceso.fechaCompartido,
                propietarioNombre: this.nombrePropietario(archivo.propietario, nombres),
              },
            ];
          }),
        ),
      );
    } catch {
      this.error.set('No se pudieron cargar los recursos compartidos. Intenta de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }

  private nombrePropietario(propietarioId: string, nombres: Map<string, string>): string {
    return nombres.get(propietarioId) ?? 'Otro usuario';
  }

  private ordenarPorFecha<T extends { fechaCompartido: string }>(items: T[]): T[] {
    return items.sort(
      (a, b) => this.fechaEnMs(b.fechaCompartido) - this.fechaEnMs(a.fechaCompartido),
    );
  }

  private fechaEnMs(iso: string): number {
    const ms = new Date(iso).getTime();
    return Number.isNaN(ms) ? 0 : ms;
  }
}
