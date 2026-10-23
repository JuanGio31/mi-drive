import { Location } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { marked } from 'marked';
import { map } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Archivo, ExtensionArchivo, NivelPermiso } from '../../core/models';
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
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  /** id del archivo desde la URL. */
  readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))), {
    initialValue: null,
  });

  readonly archivo = signal<Archivo | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly esMarkdown = computed(() => this.archivo()?.tipo === ExtensionArchivo.Md);

  /** Solo se muestra "Editar" si el backend reporta permiso de escritura. */
  readonly puedeEditar = computed(() => this.archivo()?.miPermiso === NivelPermiso.Escritura);

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

  editar(): void {
    const id = this.id();
    if (id) void this.router.navigate(['/archivo', id, 'editar']);
  }

  /** Descarga el contenido actual usando el endpoint de descarga. */
  async descargar(): Promise<void> {
    const archivo = this.archivo();
    if (!archivo) return;

    try {
      const contenido = await firstValueFrom(this.archivoService.descargar(archivo._id));
      this.guardarArchivo(archivo, contenido);
    } catch {
      this.snack.open('No se pudo descargar el archivo', 'Cerrar', {
        duration: 5000,
      });
    }
  }

  private guardarArchivo(archivo: Archivo, contenido: string): void {
    const tipo =
      archivo.tipo === ExtensionArchivo.Md
        ? 'text/markdown;charset=utf-8'
        : 'text/plain;charset=utf-8';
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = archivo.nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private async cargar(id: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const archivo = await firstValueFrom(this.archivoService.buscarPorId(id));
      this.archivo.set(archivo);

      // La auditoría de la vista no debe bloquear ni romper el visor.
      void firstValueFrom(this.archivoService.registrarApertura(id)).catch(() => undefined);
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
