import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { Archivo, Carpeta, ExtensionArchivo } from '../../core/models';
import { ArchivoService } from '../../core/services/archivo-service';
import { CarpetaService } from '../../core/services/carpeta-service';

/**
 * Lista el contenido de una carpeta (subcarpetas + archivos).
 * Reutilizable: sirve para la raíz (carpetaId = null) y para cualquier carpeta.
 * No decide la navegación; emite `abrirCarpeta` / `abrirArchivo` para que la
 * vista contenedora decida qué hacer.
 */
@Component({
  selector: 'app-explorador-carpeta',
  imports: [MatIconModule, MatProgressSpinnerModule],
  templateUrl: './explorador-carpeta.html',
  styleUrl: './explorador-carpeta.scss',
})
export class ExploradorCarpetaComponent {
  private readonly carpetaService = inject(CarpetaService);
  private readonly archivoService = inject(ArchivoService);

  /** Carpeta a explorar. null = raíz. */
  readonly carpetaId = input<string | null>(null);

  readonly abrirCarpeta = output<Carpeta>();
  readonly abrirArchivo = output<Archivo>();

  readonly carpetas = signal<Carpeta[]>([]);
  readonly archivos = signal<Archivo[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly vacio = computed(
    () => this.carpetas().length === 0 && this.archivos().length === 0,
  );

  constructor() {
    // Recarga automáticamente cuando cambia la carpeta a explorar.
    effect(() => {
      const id = this.carpetaId();
      void this.cargar(id);
    });
  }

  private async cargar(carpetaId: string | null): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const [carpetas, archivos] = await Promise.all([
        firstValueFrom(this.carpetaService.listar({ carpetaPadre: carpetaId })),
        firstValueFrom(this.archivoService.listar({ carpetaPadre: carpetaId })),
      ]);
      this.carpetas.set(carpetas.propias);
      this.archivos.set(archivos);
    } catch {
      this.error.set('No se pudo cargar el contenido de la carpeta.');
    } finally {
      this.cargando.set(false);
    }
  }

  /** Ícono según el tipo de archivo (texto plano / markdown). */
  iconoArchivo(tipo: ExtensionArchivo): string {
    return tipo === ExtensionArchivo.Md ? 'code' : 'description';
  }

  /** Tamaño legible en B / KB / MB. */
  formatearTamanio(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
