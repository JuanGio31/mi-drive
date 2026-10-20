import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { Archivo, Carpeta, ExtensionArchivo } from '../../core/models';
import { ArchivoService } from '../../core/services/archivo-service';
import { CarpetaService } from '../../core/services/carpeta-service';

/** `carpeta` o la extensión del archivo que se va a crear. */
export type TipoNuevo = 'carpeta' | ExtensionArchivo;

export interface DatosNuevo {
  tipo: TipoNuevo;
  /** Carpeta destino. null = raíz de Mi Unidad. */
  carpetaPadre: string | null;
  /** Texto para indicar dónde se creará ("Mi Unidad", "esta carpeta"). */
  destino: string;
}

export type ResultadoNuevo =
  | { tipo: 'carpeta'; carpeta: Carpeta }
  | { tipo: 'archivo'; archivo: Archivo };

const NOMBRE_POR_DEFECTO = 'Sin título';

/**
 * Diálogo para crear una carpeta o un archivo. Hace la petición al backend
 * desde aquí para poder mostrar inline los errores (nombre duplicado, sin
 * permisos…) y dejar corregir sin cerrar el diálogo.
 */
@Component({
  selector: 'app-dialogo-nuevo',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dialogo-nuevo.html',
  styleUrl: './dialogo-nuevo.scss',
})
export class DialogoNuevoComponent {
  readonly datos = inject<DatosNuevo>(MAT_DIALOG_DATA);
  private readonly ref =
    inject<MatDialogRef<DialogoNuevoComponent, ResultadoNuevo | null>>(
      MatDialogRef,
    );
  private readonly carpetaService = inject(CarpetaService);
  private readonly archivoService = inject(ArchivoService);
  private readonly campo = viewChild<ElementRef<HTMLInputElement>>('campo');

  readonly nombre = signal(
    this.datos.tipo === 'carpeta' ? 'Nueva carpeta' : NOMBRE_POR_DEFECTO,
  );
  readonly creando = signal(false);
  readonly error = signal<string | null>(null);

  /** Extensión fija para archivos (con punto); null para carpetas. */
  readonly extension = computed(() =>
    this.datos.tipo === 'carpeta' ? null : `.${this.datos.tipo}`,
  );

  readonly titulo = computed(() => {
    switch (this.datos.tipo) {
      case 'carpeta':
        return 'Nueva carpeta';
      case ExtensionArchivo.Txt:
        return 'Nuevo archivo de texto';
      default:
        return 'Nuevo archivo de markdown';
    }
  });

  readonly valido = computed(() => this.nombre().trim().length > 0);

  /** Nombre final tal como se guarda (con extensión si es archivo). */
  private readonly nombreCompleto = computed(
    () => `${this.nombre().trim()}${this.extension() ?? ''}`,
  );

  constructor() {
    // Al abrirse el diálogo se preselecciona el nombre por defecto para que
    // el usuario pueda sobrescribirlo escribiendo directamente.
    this.ref.afterOpened().subscribe(() => {
      const input = this.campo()?.nativeElement;
      if (!input) return;
      input.focus();
      input.select();
    });
  }

  seleccionar(evento: FocusEvent): void {
    (evento.target as HTMLInputElement | null)?.select();
  }

  cancelar(): void {
    if (this.creando()) return;
    this.ref.close(null);
  }

  async crear(): Promise<void> {
    if (!this.valido() || this.creando()) return;

    this.creando.set(true);
    this.error.set(null);
    try {
      const nombre = this.nombreCompleto();
      const resultado: ResultadoNuevo =
        this.datos.tipo === 'carpeta'
          ? {
              tipo: 'carpeta',
              carpeta: await firstValueFrom(
                this.carpetaService.crear({
                  nombre,
                  carpetaPadre: this.datos.carpetaPadre,
                }),
              ),
            }
          : {
              tipo: 'archivo',
              archivo: await firstValueFrom(
                this.archivoService.crear({
                  nombre,
                  tipo: this.datos.tipo,
                  contenido: '',
                  carpetaPadre: this.datos.carpetaPadre,
                }),
              ),
            };
      this.ref.close(resultado);
    } catch (error) {
      this.error.set(this.mensajeError(error));
    } finally {
      this.creando.set(false);
    }
  }

  /** Mensaje del backend o uno genérico si no viene detallado. */
  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const mensaje = (error.error as { error?: unknown } | null)?.error;
      if (typeof mensaje === 'string' && mensaje.length > 0) return mensaje;
      if (error.status === 403) return 'No tienes permisos para crear aquí.';
    }
    return 'No se pudo crear el recurso.';
  }
}
