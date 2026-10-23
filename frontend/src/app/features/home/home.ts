import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import {
  AccionActividad,
  Actividad,
  Carpeta,
  ExtensionArchivo,
  TipoRecurso,
} from '../../core/models';
import { ActividadService } from '../../core/services/actividad-service';
import { ArchivoService } from '../../core/services/archivo-service';
import { AuthService } from '../../core/services/auth-service';
import { CarpetaService } from '../../core/services/carpeta-service';
import { claseAccion, etiquetaAccion, iconoAccion } from '../../core/utils/acciones';
import { carpetaCompartidaConOtros, esCarpetaCompartida } from '../../core/utils/carpetas';
import { esRecursoDestacado } from '../../core/utils/destacados';
import { formatearFecha, formatearFechaHora } from '../../core/utils/formato';

const LIMITE_CARPETAS = 10;
const LIMITE_ARCHIVOS = 10;
const LIMITE_CANDIDATOS = 20;
const LIMITE_ACTIVIDADES = 40;

const ACCIONES_OCULTAS = new Set<AccionActividad>([
  AccionActividad.EnviarPapelera,
  AccionActividad.EliminarPermanente,
]);

interface ArchivoReciente {
  id: string;
  nombre: string;
  tipo: ExtensionArchivo;
  accion: AccionActividad | null;
  fecha: string;
}

/**
 * Página principal del usuario: muestra sus carpetas raíz más recientes y los
 * últimos archivos sobre los que tuvo actividad.
 */
@Component({
  selector: 'app-home',
  imports: [RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {
  private readonly auth = inject(AuthService);
  private readonly carpetaService = inject(CarpetaService);
  private readonly archivoService = inject(ArchivoService);
  private readonly actividadService = inject(ActividadService);

  readonly usuario = this.auth.usuario;

  readonly carpetas = signal<Carpeta[]>([]);
  readonly archivos = signal<ArchivoReciente[]>([]);
  readonly cargandoCarpetas = signal(true);
  readonly cargandoArchivos = signal(true);
  readonly errorCarpetas = signal<string | null>(null);
  readonly errorArchivos = signal<string | null>(null);

  readonly formatearFecha = formatearFecha;
  readonly formatearFechaHora = formatearFechaHora;

  constructor() {
    void this.cargarCarpetas();
    void this.cargarArchivos();
  }

  /** Indica si la carpeta pertenece a otro usuario y fue compartida. */
  esCompartida(carpeta: Carpeta): boolean {
    return esCarpetaCompartida(carpeta, this.usuario()?.id);
  }

  /** Indica si una carpeta propia tiene comparticiones directas. */
  compartidaConOtros(carpeta: Carpeta): boolean {
    return carpetaCompartidaConOtros(carpeta, this.usuario()?.id);
  }

  /** Indica si la carpeta está destacada para el usuario actual. */
  esDestacado(carpeta: Carpeta): boolean {
    return esRecursoDestacado(carpeta, this.usuario()?.id);
  }

  /** Fecha en la que el usuario recibió una carpeta compartida. */
  fechaCompartida(carpeta: Carpeta): string {
    const usuarioId = this.usuario()?.id;
    const compartido = carpeta.compartidoCon.find((item) => item.usuario === usuarioId);
    return compartido?.fechaCompartido ?? carpeta.createdAt;
  }

  /** Ícono según el tipo de archivo. */
  iconoArchivo(tipo: ExtensionArchivo): string {
    return tipo === ExtensionArchivo.Md ? 'code' : 'description';
  }

  /** Etiqueta legible de la última acción registrada sobre el archivo. */
  textoAccion(item: ArchivoReciente): string {
    if (item.accion === AccionActividad.Abrir) return 'Visto';
    return item.accion ? etiquetaAccion(item.accion) : 'Actualizado';
  }

  /** Color del chip según la última acción. */
  claseAccionReciente(item: ArchivoReciente): string {
    return item.accion ? claseAccion(item.accion) : 'gris';
  }

  /** Ícono del chip según la última acción. */
  iconoAccionReciente(item: ArchivoReciente): string {
    return item.accion ? iconoAccion(item.accion) : 'schedule';
  }

  private async cargarCarpetas(): Promise<void> {
    this.cargandoCarpetas.set(true);
    this.errorCarpetas.set(null);

    try {
      const respuesta = await firstValueFrom(this.carpetaService.listar());
      const unicas = new Map(
        [...respuesta.propias, ...respuesta.compartidas].map((carpeta) => [carpeta._id, carpeta]),
      );

      this.carpetas.set(
        [...unicas.values()]
          .sort(
            (a, b) =>
              this.fechaEnMs(this.fechaReferencia(b)) - this.fechaEnMs(this.fechaReferencia(a)),
          )
          .slice(0, LIMITE_CARPETAS),
      );
    } catch {
      this.errorCarpetas.set('No se pudieron cargar las carpetas.');
    } finally {
      this.cargandoCarpetas.set(false);
    }
  }

  private async cargarArchivos(): Promise<void> {
    this.cargandoArchivos.set(true);
    this.errorArchivos.set(null);

    try {
      const vistas = await firstValueFrom(
        this.actividadService.miHistorial({
          recursoTipo: TipoRecurso.Archivo,
          accion: AccionActividad.Abrir,
          limit: LIMITE_ACTIVIDADES,
        }),
      );

      const vistos = this.actividadesUnicas(vistas)
        .slice(0, LIMITE_CANDIDATOS)
        .map((actividad) => this.aArchivoReciente(actividad));

      if (vistos.length > 0) {
        this.archivos.set(vistos.slice(0, LIMITE_ARCHIVOS));
        return;
      }

      const actividades = await firstValueFrom(
        this.actividadService.miHistorial({
          recursoTipo: TipoRecurso.Archivo,
          limit: LIMITE_ACTIVIDADES,
        }),
      );

      const recientes = this.actividadesUnicas(actividades)
        .slice(0, LIMITE_CANDIDATOS)
        .map((actividad) => this.aArchivoReciente(actividad));

      if (recientes.length > 0) {
        this.archivos.set(recientes.slice(0, LIMITE_ARCHIVOS));
        return;
      }

      await this.cargarArchivosRaiz();
    } catch {
      this.errorArchivos.set('No se pudieron cargar los archivos vistos.');
    } finally {
      this.cargandoArchivos.set(false);
    }
  }

  /** Deja una sola actividad por archivo, conservando la más reciente. */
  private actividadesUnicas(actividades: Actividad[]): Actividad[] {
    const vistos = new Set<string>();
    const unicas: Actividad[] = [];

    for (const actividad of actividades) {
      const id = actividad.recursoId;
      if (!id || vistos.has(id)) continue;

      vistos.add(id);
      if (ACCIONES_OCULTAS.has(actividad.accion)) continue;

      unicas.push(actividad);
    }

    return unicas;
  }

  private aArchivoReciente(actividad: Actividad): ArchivoReciente {
    const nombre = actividad.recursoNombre ?? 'Archivo sin nombre';
    return {
      id: actividad.recursoId ?? '',
      nombre,
      tipo: nombre.toLowerCase().endsWith('.md') ? ExtensionArchivo.Md : ExtensionArchivo.Txt,
      accion: actividad.accion,
      fecha: actividad.createdAt,
    };
  }

  /** Fallback para usuarios sin actividad: archivos de la raíz. */
  private async cargarArchivosRaiz(): Promise<void> {
    const archivos = await firstValueFrom(
      this.archivoService.listar({
        limit: LIMITE_ARCHIVOS,
        incluirCompartidas: true,
      }),
    );

    this.archivos.set(
      archivos.map((archivo) => ({
        id: archivo._id,
        nombre: archivo.nombre,
        tipo: archivo.tipo,
        accion: null,
        fecha: archivo.updatedAt,
      })),
    );
  }

  private fechaReferencia(carpeta: Carpeta): string {
    return this.esCompartida(carpeta) ? this.fechaCompartida(carpeta) : carpeta.createdAt;
  }

  private fechaEnMs(iso: string): number {
    const ms = new Date(iso).getTime();
    return Number.isNaN(ms) ? 0 : ms;
  }
}
