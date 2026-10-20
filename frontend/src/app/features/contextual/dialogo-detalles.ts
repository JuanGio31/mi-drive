import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Carpeta,
  ExtensionArchivo,
  ItemRecurso,
  NivelPermiso,
  UsuarioDirectorio,
  carpetaPadreItem,
  compartidosItem,
  esArchivo,
  nombreItem,
  propietarioItem,
} from '../../core/models';
import { ArchivoService } from '../../core/services/archivo-service';
import { CarpetaService } from '../../core/services/carpeta-service';
import { UsuarioService } from '../../core/services/usuario-service';
import {
  PermisoMostrado,
  etiquetaPermiso,
  iconoPermiso,
} from '../../core/utils/permisos';
import { formatearTamanio } from '../../core/utils/formato';

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
  ],
  templateUrl: './dialogo-detalles.html',
  styleUrl: './dialogo-detalles.scss',
})
export class DialogoDetallesComponent {
  readonly datos = inject<DatosDetalles>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<DialogoDetallesComponent>);
  private readonly archivoService = inject(ArchivoService);
  private readonly carpetaService = inject(CarpetaService);
  private readonly usuarioService = inject(UsuarioService);

  readonly esArchivo = esArchivo;
  readonly etiquetaPermiso = etiquetaPermiso;
  readonly iconoPermiso = iconoPermiso;

  readonly nombre = nombreItem(this.datos.item);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly accesos = signal<Acceso[]>([]);
  readonly totalArchivos = signal(0);
  readonly totalSubcarpetas = signal(0);
  readonly ubicacion = signal('Mi Unidad');

  readonly icono = computed(() =>
    esArchivo(this.datos.item)
      ? this.datos.item.archivo.tipo === ExtensionArchivo.Md
        ? 'code'
        : 'description'
      : 'folder',
  );

  readonly tipoTexto = computed(() =>
    esArchivo(this.datos.item)
      ? `Archivo .${this.datos.item.archivo.tipo}`
      : 'Carpeta',
  );

  readonly tamanio = computed(() =>
    esArchivo(this.datos.item)
      ? formatearTamanio(this.datos.item.archivo.tamanio)
      : null,
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
  }

  cerrar(): void {
    this.ref.close();
  }

  private async cargar(): Promise<void> {
    const item = this.datos.item;
    try {
      const [directorio, ancestros, conteo] = await Promise.all([
        firstValueFrom(this.usuarioService.directorio()).catch(
          () => [] as UsuarioDirectorio[],
        ),
        this.ancestros(carpetaPadreItem(item)),
        this.contar(item),
      ]);

      if (ancestros.length > 0) this.ubicacion.set(ancestros[0].nombre);
      if (conteo) {
        this.totalArchivos.set(conteo.archivos);
        this.totalSubcarpetas.set(conteo.subcarpetas);
      }
      this.accesos.set(this.construirAccesos(item, directorio, ancestros));
    } catch {
      this.error.set('No se pudieron cargar los detalles.');
    } finally {
      this.cargando.set(false);
    }
  }

  /** Carpetas padre, de la más cercana a la raíz. */
  private async ancestros(desdeId: string | null): Promise<Carpeta[]> {
    const lista: Carpeta[] = [];
    const vistos = new Set<string>();
    let id = desdeId;

    while (id && !vistos.has(id) && lista.length < MAX_ANCESTROS) {
      vistos.add(id);
      try {
        const carpeta = await firstValueFrom(
          this.carpetaService.buscarPorId(id),
        );
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
        firstValueFrom(
          this.archivoService.listar({ carpetaPadre: item.carpeta._id }),
        ),
        firstValueFrom(
          this.carpetaService.listar({ carpetaPadre: item.carpeta._id }),
        ),
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
      });
    };

    agregar(propietarioItem(item), 'propietario', '');

    for (const compartido of compartidosItem(item)) {
      agregar(
        compartido.usuario,
        compartido.permiso as NivelPermiso,
        'Compartido directamente',
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
