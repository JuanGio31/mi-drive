import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Archivo, Carpeta } from '../../core/models';
import { CarpetaService } from '../../core/services/carpeta-service';
import { ExploradorCarpetaComponent } from '../explorador/explorador-carpeta';

/**
 * Vista "Mi Unidad": explora la carpeta raíz o una carpeta concreta según el
 * parámetro de ruta `:id`. Delega el listado en el explorador reutilizable.
 */
@Component({
  selector: 'app-mi-unidad',
  imports: [
    RouterLink,
    MatIconModule,
    MatButtonModule,
    ExploradorCarpetaComponent,
  ],
  templateUrl: './mi-unidad.html',
  styleUrl: './mi-unidad.scss',
})
export class MiUnidadComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly carpetaService = inject(CarpetaService);

  /** id de la carpeta actual desde la URL; null = raíz. */
  readonly carpetaId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id'))),
    { initialValue: null },
  );

  /** Metadatos de la carpeta actual (para el breadcrumb), null en la raíz. */
  readonly carpeta = signal<Carpeta | null>(null);

  constructor() {
    effect(() => {
      const id = this.carpetaId();
      if (!id) {
        this.carpeta.set(null);
        return;
      }
      void this.cargarCarpeta(id);
    });
  }

  /** Navega al interior de una subcarpeta. */
  irACarpeta(carpeta: Carpeta): void {
    this.router.navigate(['/mi-unidad', carpeta._id]);
  }

  /** Abre el visor del archivo. */
  abrirArchivo(archivo: Archivo): void {
    this.router.navigate(['/archivo', archivo._id]);
  }

  /** Sube a la carpeta padre o a la raíz. */
  subir(): void {
    const padre = this.carpeta()?.carpetaPadre;
    this.router.navigate(padre ? ['/mi-unidad', padre] : ['/mi-unidad']);
  }

  private async cargarCarpeta(id: string): Promise<void> {
    try {
      this.carpeta.set(await firstValueFrom(this.carpetaService.buscarPorId(id)));
    } catch {
      this.carpeta.set(null);
    }
  }
}
