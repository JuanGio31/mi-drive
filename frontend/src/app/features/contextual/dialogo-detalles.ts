import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Actividad,
  Carpeta,
  ExtensionArchivo,
  ItemRecurso,
  NivelPermiso,
  UsuarioDirectorio,
  carpetaPadreItem,
  compartidosItem,
  esArchivo,
  idItem,
  nombreItem,
  propietarioItem,
} from '../../core/models';
import { ActividadService } from '../../core/services/actividad-service';
import { ArchivoService } from '../../core/services/archivo-service';
import { CarpetaService } from '../../core/services/carpeta-service';
import { UsuarioService } from '../../core/services/usuario-service';
import { claseAccion, etiquetaAccion, iconoAccion } from '../../core/utils/acciones';
import { PermisoMostrado, etiquetaPermiso, iconoPermiso } from '../../core/utils/permisos';
import { formatearFechaHora, formatearTamanio } from '../../core/utils/formato';
import { DatosConfirmar, DialogoConfirmarComponent } from './dialogo-confirmar';

export interface DatosDetalles {
  item: ItemRecurso;
  usuarioActualId: string;
}

interface Acceso {
  usuarioId: string;
  nombre: string;
  correo: string;
  permiso: PermisoMostrado;
  origen: string;
  esTu: boolean;
  directo: boolean;
}

const MAX_ANCESTROS = 30;

/**
 * Diálogo de detalles: metadatos, número de archivos (en carpetas) y todas las
 * personas con acceso, distinguiendo el compartido directo del heredado.
 */
@Component({
  selector: 'app-dialogo-detalles',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './dialogo-detalles.html',
  styleUrl: './dialogo-detalles.scss',
})
export class DialogoDetallesComponent {
  readonly datos = inject<DatosDetalles>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<DialogoDetallesComponent, boolean>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly archivoService = inject(ArchivoService);
  private readonly carpetaService = inject(CarpetaService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly actividadService = inject(ActividadService);

  readonly esArchivo = esArchivo;
  readonly etiquetaPermiso = etiquetaPermiso;
  readonly iconoPermiso = iconoPermiso;
  readonly etiquetaAccion = etiquetaAccion;
  readonly iconoAccion = iconoAccion;
  readonly claseAccion = claseAccion;
  readonly formatearFechaHora = formatearFechaHora;
  readonly nivelesPermiso = [NivelPermiso.Lectura, NivelPermiso.Escritura, NivelPermiso.Comentar];

  readonly nombre = nombreItem(this.datos.item);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly accesos = signal<Acceso[]>([]);
  readonly totalArchivos = signal(0);
  readonly totalSubcarpetas = signal(0);
  readonly ubicacion = signal('Mi Unidad');
  readonly cargandoActividad = signal(true);
  readonly errorActividad = signal<string | null>(null);
  readonly actividades = signal<Actividad[]>([]);
  readonly quitando = signal<string | null>(null);
  readonly cambiandoPermiso = signal<string | null>(null);

  private readonly limiteActividades = 20;
  private readonly directorio = signal<UsuarioDirectorio[]>([]);
  private readonly ancestrosCarpetas = signal<Carpeta[]>([]);
  private cambio = false;

  readonly icono = computed(() =>
    esArchivo(this.datos.item)
      ? this.datos.item.archivo.tipo === ExtensionArchivo.Md
        ? 'code'
        : 'description'
      : 'folder',
  );

  readonly tipoTexto = computed(() =>
    esArchivo(this.datos.item) ? `Archivo .${this.datos.item.archivo.tipo}` : 'Carpeta',
  );

  readonly tamanio = computed(() =>
    esArchivo(this.datos.item) ? formatearTamanio(this.datos.item.archivo.tamanio) : null,
  );

  get creado(): string {
    return esArchivo(this.datos.item)
      ? this.datos.item.archivo.createdAt
      : this.datos.item.carpeta.createdAt;
  }

  get modificado(): string {
    return esArchivo(this.datos.item)
      ? this.datos.item.archivo.updatedAt
      : this.datos.item.carpeta.updatedAt;
  }

  constructor() {
    void this.cargar();
    void this.cargarActividad();
  }

  /** Indica si el usuario actual es propietario del recurso. */
  esPropietario(): boolean {
    return propietarioItem(this.datos.item) === this.datos.usuarioActualId;
  }

  /** Solo el propietario puede revocar accesos directos. */
  puedeQuitar(acceso: Acceso): boolean {
    return this.esPropietario() && acceso.directo;
  }

  /** Solo el propietario puede cambiar el nivel de un acceso directo. */
  puedeCambiarPermiso(acceso: Acceso): boolean {
    return this.puedeQuitar(acceso);
  }

  /** Actualiza el permiso de un acceso directo sin salir de los detalles. */
  async cambiarPermiso(acceso: Acceso, cambio: MatSelectChange): Promise<void> {
    const permiso = cambio.value as NivelPermiso;
    if (!this.puedeCambiarPermiso(acceso) || acceso.permiso === permiso) return;

    this.cambiandoPermiso.set(acceso.usuarioId);
    try {
      const item = this.datos.item;
      if (esArchivo(item)) {
        const actualizado = await firstValueFrom(
          this.archivoService.compartir(item.archivo._id, {
            usuarioId: acceso.usuarioId,
            permiso,
          }),
        );
        this.datos.item = { tipo: 'archivo', archivo: actualizado };
      } else {
        const actualizado = await firstValueFrom(
          this.carpetaService.compartir(item.carpeta._id, {
            usuarioId: acceso.usuarioId,
            permiso,
          }),
        );
        this.datos.item = { tipo: 'carpeta', carpeta: actualizado };
      }

      this.refrescarAccesos();
      this.cambio = true;
      this.avisar(`Ahora ${acceso.nombre} tiene ${etiquetaPermiso(permiso).toLowerCase()}`);
      void this.cargarActividad();
    } catch (error) {
      this.refrescarAccesos();
      this.mostrarError(error);
    } finally {
      this.cambiandoPermiso.set(null);
    }
  }

  /** Revoca un acceso directo tras confirmarlo. */
  async quitarAcceso(acceso: Acceso): Promise<void> {
    if (!this.puedeQuitar(acceso)) return;

    const confirmado = await firstValueFrom(
      this.dialog
        .open<DialogoConfirmarComponent, DatosConfirmar, boolean>(DialogoConfirmarComponent, {
          data: {
            titulo: 'Quitar acceso',
            mensaje: `“${acceso.nombre}” dejará de tener acceso directo a “${this.nombre}”.`,
            textoConfirmar: 'Quitar acceso',
            peligroso: true,
          },
        })
        .afterClosed(),
    );
    if (!confirmado) return;

    this.quitando.set(acceso.usuarioId);
    try {
      const item = this.datos.item;
      if (esArchivo(item)) {
        const actualizado = await firstValueFrom(
          this.archivoService.quitarCompartido(item.archivo._id, acceso.usuarioId),
        );
        this.datos.item = { tipo: 'archivo', archivo: actualizado };
      } else {
        const actualizado = await firstValueFrom(
          this.carpetaService.quitarCompartido(item.carpeta._id, acceso.usuarioId),
        );
        this.datos.item = { tipo: 'carpeta', carpeta: actualizado };
      }

      this.refrescarAccesos();
      this.cambio = true;
      this.avisar(`Se quitó el acceso a ${acceso.nombre}`);
      void this.cargarActividad();
    } catch (error) {
      this.mostrarError(error);
    } finally {
      this.quitando.set(null);
    }
  }

  cerrar(): void {
    this.ref.close(this.cambio);
  }

  private async cargar(): Promise<void> {
    const item = this.datos.item;
    try {
      const [directorio, ancestros, conteo] = await Promise.all([
        firstValueFrom(this.usuarioService.directorio()).catch(() => [] as UsuarioDirectorio[]),
        this.ancestros(carpetaPadreItem(item)),
        this.contar(item),
      ]);

      this.directorio.set(directorio);
      this.ancestrosCarpetas.set(ancestros);

      if (ancestros.length > 0) this.ubicacion.set(ancestros[0].nombre);
      if (conteo) {
        this.totalArchivos.set(conteo.archivos);
        this.totalSubcarpetas.set(conteo.subcarpetas);
      }
      this.refrescarAccesos();
    } catch {
      this.error.set('No se pudieron cargar los detalles.');
    } finally {
      this.cargando.set(false);
    }
  }

  /** Recalcula accesos con el estado actual del recurso. */
  private refrescarAccesos(): void {
    this.accesos.set(
      this.construirAccesos(this.datos.item, this.directorio(), this.ancestrosCarpetas()),
    );
  }

  /** Carga el historial del recurso sin bloquear el resto del diálogo. */
  private async cargarActividad(): Promise<void> {
    this.cargandoActividad.set(true);
    this.errorActividad.set(null);

    try {
      const actividades = await firstValueFrom(
        this.actividadService.listarPorRecurso(this.datos.item.tipo, idItem(this.datos.item)),
      );
      this.actividades.set(actividades.slice(0, this.limiteActividades));
    } catch {
      this.errorActividad.set('No se pudo cargar la actividad.');
    } finally {
      this.cargandoActividad.set(false);
    }
  }

  private avisar(mensaje: string): void {
    this.snack.open(mensaje, 'Cerrar', { duration: 3500 });
  }

  private mostrarError(error: unknown): void {
    const mensaje =
      (error as { error?: { error?: string } })?.error?.error ?? 'No se pudo actualizar el acceso.';
    this.snack.open(mensaje, 'Cerrar', { duration: 5000 });
  }

  /** Carpetas padre, de la más cercana a la raíz. */
  private async ancestros(desdeId: string | null): Promise<Carpeta[]> {
    const lista: Carpeta[] = [];
    const vistos = new Set<string>();
    let id = desdeId;

    while (id && !vistos.has(id) && lista.length < MAX_ANCESTROS) {
      vistos.add(id);
      try {
        const carpeta = await firstValueFrom(this.carpetaService.buscarPorId(id));
        lista.push(carpeta);
        id = carpeta.carpetaPadre;
      } catch {
        break;
      }
    }
    return lista;
  }

  /** Conteo de hijos directos si el recurso es una carpeta. */
  private async contar(
    item: ItemRecurso,
  ): Promise<{ archivos: number; subcarpetas: number } | null> {
    if (esArchivo(item)) return null;
    try {
      const [archivos, carpetas] = await Promise.all([
        firstValueFrom(this.archivoService.listar({ carpetaPadre: item.carpeta._id })),
        firstValueFrom(this.carpetaService.listar({ carpetaPadre: item.carpeta._id })),
      ]);
      return {
        archivos: archivos.length,
        subcarpetas: carpetas.propias.length,
      };
    } catch {
      return null;
    }
  }

  private construirAccesos(
    item: ItemRecurso,
    directorio: UsuarioDirectorio[],
    ancestros: Carpeta[],
  ): Acceso[] {
    const porId = new Map<string, UsuarioDirectorio>(
      directorio.map((u) => [u._id, u] as [string, UsuarioDirectorio]),
    );
    const accesos = new Map<string, Acceso>();

    const agregar = (
      usuarioId: string,
      permiso: PermisoMostrado,
      origen: string,
      directo = false,
    ): void => {
      if (accesos.has(usuarioId)) return;
      const usuario = porId.get(usuarioId);
      accesos.set(usuarioId, {
        usuarioId,
        nombre: usuario?.nombre ?? 'Usuario desconocido',
        correo: usuario?.correo ?? '',
        permiso,
        origen,
        esTu: usuarioId === this.datos.usuarioActualId,
        directo,
      });
    };

    agregar(propietarioItem(item), 'propietario', '');

    for (const compartido of compartidosItem(item)) {
      agregar(
        compartido.usuario,
        compartido.permiso as NivelPermiso,
        'Compartido directamente',
        true,
      );
    }

    for (const carpeta of ancestros) {
      for (const compartido of carpeta.compartidoCon) {
        agregar(
          compartido.usuario,
          compartido.permiso as NivelPermiso,
          `Heredado de “${carpeta.nombre}”`,
        );
      }
    }

    return [...accesos.values()];
  }
}
