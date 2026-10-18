import { Location } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { marked } from 'marked';
import { map } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Archivo, ExtensionArchivo } from '../../core/models';
import { ArchivoService } from '../../core/services/archivo-service';

/**
 * Visor de archivos: muestra el contenido de un archivo .md (renderizado) o
 * .txt (texto plano). Ruta: /archivo/:id.
 */
@Component({
  selector: 'app-visor-archivo',
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './visor-archivo.html',
  styleUrl: './visor-archivo.scss',
})
export class VisorArchivoComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly archivoService = inject(ArchivoService);
  private readonly location = inject(Location);

  /** id del archivo desde la URL. */
  readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))), {
    initialValue: null,
  });

  readonly archivo = signal<Archivo | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly esMarkdown = computed(
    () => this.archivo()?.tipo === ExtensionArchivo.Md,
  );

  /** HTML renderizado del markdown (Angular sanitiza el innerHTML). */
  readonly html = computed(() => {
    const archivo = this.archivo();
    if (!archivo || archivo.tipo !== ExtensionArchivo.Md) return '';
    return marked.parse(archivo.contenido, { async: false });
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

  volver(): void {
    this.location.back();
  }

  private async cargar(id: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.archivo.set(await firstValueFrom(this.archivoService.buscarPorId(id)));
    } catch {
      this.error.set('No se pudo cargar el archivo.');
    } finally {
      this.cargando.set(false);
    }
  }

  /** Tamaño legible en B / KB / MB. */
  formatearTamanio(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
