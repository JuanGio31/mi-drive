import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { marked } from 'marked';
import { firstValueFrom, map } from 'rxjs';
import { Archivo, ExtensionArchivo } from '../../core/models';
import { ArchivoService } from '../../core/services/archivo-service';
import { PuedeDescartar } from './descartar-cambios.guard';

/**
 * Editor de archivos .txt / .md. Ruta: /archivo/:id/editar.
 * Guarda con el botón "Guardar" o con Ctrl+S / Cmd+S.
 */
@Component({
  selector: 'app-editor-archivo',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    CdkTextareaAutosize,
  ],
  templateUrl: './editor-archivo.html',
  styleUrl: './editor-archivo.scss',
  host: {
    '(keydown.control.s)': 'atajoGuardar($event)',
    '(keydown.meta.s)': 'atajoGuardar($event)',
  },
})
export class EditorArchivoComponent implements PuedeDescartar {
  private readonly route = inject(ActivatedRoute);
  private readonly archivoService = inject(ArchivoService);
  private readonly location = inject(Location);
  private readonly snack = inject(MatSnackBar);

  readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))), {
    initialValue: null,
  });

  readonly archivo = signal<Archivo | null>(null);
  readonly contenido = signal('');
  readonly original = signal('');
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly verPrevia = signal(false);

  readonly esMarkdown = computed(
    () => this.archivo()?.tipo === ExtensionArchivo.Md,
  );

  /** Hay cambios locales que no se han enviado al backend. */
  readonly modificado = computed(() => this.contenido() !== this.original());

  /** HTML renderizado del markdown (Angular sanitiza el innerHTML). */
  readonly html = computed(() => {
    if (!this.esMarkdown()) return '';
    return marked.parse(this.contenido(), { async: false });
  });

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) {
        this.archivo.set(null);
        return;
      }
      void this.cargar(id);
    });
  }

  hayCambiosSinGuardar(): boolean {
    return this.modificado();
  }

  volver(): void {
    this.location.back();
  }

  alternarPrevia(): void {
    this.verPrevia.update((valor) => !valor);
  }

  /** Ctrl+S / Cmd+S: evita el diálogo del navegador y guarda. */
  atajoGuardar(evento: Event): void {
    evento.preventDefault();
    void this.guardar();
  }

  async guardar(): Promise<void> {
    const archivo = this.archivo();
    if (!archivo || this.guardando() || !this.modificado()) return;

    this.guardando.set(true);
    this.error.set(null);
    try {
      const actualizado = await firstValueFrom(
        this.archivoService.actualizarContenido(archivo._id, {
          contenido: this.contenido(),
        }),
      );
      this.archivo.set(actualizado);
      this.original.set(actualizado.contenido);
      this.snack.open('Archivo guardado', 'Cerrar', { duration: 2500 });
    } catch (error) {
      this.error.set(this.mensajeError(error));
    } finally {
      this.guardando.set(false);
    }
  }

  private async cargar(id: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    this.archivo.set(null);
    this.contenido.set('');
    this.original.set('');
    this.verPrevia.set(false);
    try {
      const archivo = await firstValueFrom(this.archivoService.buscarPorId(id));
      this.archivo.set(archivo);
      this.contenido.set(archivo.contenido);
      this.original.set(archivo.contenido);
    } catch {
      this.error.set('No se pudo cargar el archivo.');
    } finally {
      this.cargando.set(false);
    }
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const mensaje = (error.error as { error?: unknown } | null)?.error;
      if (typeof mensaje === 'string' && mensaje.length > 0) return mensaje;
      if (error.status === 403) return 'No tienes permisos para editarlo.';
    }
    return 'No se pudo guardar el archivo.';
  }
}
