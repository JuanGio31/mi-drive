import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RecargaService } from '../../core/services/recarga-service';
import {
  DatosNuevo,
  DialogoNuevoComponent,
  ResultadoNuevo,
  TipoNuevo,
} from './dialogo-nuevo';

/**
 * Flujo del botón "Nuevo" de la barra lateral: decide la carpeta destino
 * según la ruta actual, pide el nombre en un diálogo y, tras crear el recurso,
 * refresca la lista o navega al editor.
 */
@Injectable({ providedIn: 'root' })
export class NuevoRecursoService {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly recarga = inject(RecargaService);

  async crear(tipo: TipoNuevo): Promise<void> {
    const carpetaPadre = this.carpetaActual();
    const datos: DatosNuevo = {
      tipo,
      carpetaPadre,
      destino: carpetaPadre ? 'esta carpeta' : 'Mi Unidad',
    };

    const resultado = await firstValueFrom(
      this.dialog
        .open<DialogoNuevoComponent, DatosNuevo, ResultadoNuevo | null>(
          DialogoNuevoComponent,
          { data: datos, width: '420px', autoFocus: 'dialog' },
        )
        .afterClosed(),
    );
    if (!resultado) return;

    if (resultado.tipo === 'archivo') {
      this.snack.open('Archivo creado', 'Cerrar', { duration: 2500 });
      await this.router.navigate([
        '/archivo',
        resultado.archivo._id,
        'editar',
      ]);
      return;
    }

    this.snack.open('Carpeta creada', 'Cerrar', { duration: 2500 });
    if (this.enMiUnidad()) {
      this.recarga.pedir();
    } else {
      // Fuera de Mi Unidad: ir a la raíz para que el usuario vea el resultado.
      await this.router.navigate(['/mi-unidad']);
    }
  }

  /** id de la carpeta abierta en /mi-unidad/:id; null en cualquier otro caso. */
  private carpetaActual(): string | null {
    const ruta = this.rutaActual();
    return /^\/mi-unidad\/([0-9a-fA-F]{24})$/.exec(ruta)?.[1] ?? null;
  }

  private enMiUnidad(): boolean {
    return /^\/mi-unidad(\/|$)/.test(this.rutaActual());
  }

  private rutaActual(): string {
    return this.router.url.split(/[?#]/)[0];
  }
}
