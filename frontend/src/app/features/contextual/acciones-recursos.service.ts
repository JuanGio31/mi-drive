import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { ItemRecurso, esArchivo, nombreItem } from '../../core/models';
import { ArchivoService } from '../../core/services/archivo-service';
import { AuthService } from '../../core/services/auth-service';
import { CarpetaService } from '../../core/services/carpeta-service';
import {
  DialogoConfirmarComponent,
  DatosConfirmar,
} from './dialogo-confirmar';
import {
  DialogoRenombrarComponent,
  DatosRenombrar,
} from './dialogo-renombrar';
import {
  DatosCompartir,
  DialogoCompartirComponent,
  ResultadoCompartir,
} from './dialogo-compartir';
import { DatosDetalles, DialogoDetallesComponent } from './dialogo-detalles';

export type AccionRecurso =
  | 'detalles'
  | 'renombrar'
  | 'compartir'
  | 'papelera'
  | 'restaurar';

/**
 * Ejecuta las acciones del menú contextual sobre un archivo o carpeta,
 * abriendo el diálogo que corresponda. Centraliza la lógica para que las
 * vistas (Mi Unidad y Papelera) solo tengan que recargar si hubo cambios.
 */
@Injectable({ providedIn: 'root' })
export class AccionesRecursosService {
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly archivoService = inject(ArchivoService);
  private readonly carpetaService = inject(CarpetaService);
  private readonly auth = inject(AuthService);

  /** Devuelve `true` si la vista debe recargarse. */
  async ejecutar(accion: AccionRecurso, item: ItemRecurso): Promise<boolean> {
    switch (accion) {
      case 'detalles':
        await this.verDetalles(item);
        return false;
      case 'renombrar':
        return this.renombrar(item);
      case 'compartir':
        return this.compartir(item);
      case 'papelera':
        return this.enviarAPapelera(item);
      case 'restaurar':
        return this.restaurar(item);
      default:
        return false;
    }
  }

  private async verDetalles(item: ItemRecurso): Promise<void> {
    await firstValueFrom(
      this.dialog
        .open<DialogoDetallesComponent, DatosDetalles>(
          DialogoDetallesComponent,
          {
            data: { item, usuarioActualId: this.usuarioActualId() },
            maxWidth: '95vw',
            autoFocus: false,
          },
        )
        .afterClosed(),
    );
  }

  private async renombrar(item: ItemRecurso): Promise<boolean> {
    const nombre = await firstValueFrom(
      this.dialog
        .open<DialogoRenombrarComponent, DatosRenombrar, string | null>(
          DialogoRenombrarComponent,
          {
            data: { nombreActual: nombreItem(item), tipo: item.tipo },
            autoFocus: 'dialog',
          },
        )
        .afterClosed(),
    );
    if (!nombre) return false;

    try {
      if (esArchivo(item)) {
        await firstValueFrom(
          this.archivoService.renombrar(item.archivo._id, { nombre }),
        );
      } else {
        await firstValueFrom(
          this.carpetaService.renombrar(item.carpeta._id, { nombre }),
        );
      }
      this.avisar(`Se renombró a “${nombre}”`);
      return true;
    } catch (error) {
      this.mostrarError(error);
      return false;
    }
  }

  private async compartir(item: ItemRecurso): Promise<boolean> {
    const resultado = await firstValueFrom(
      this.dialog
        .open<
          DialogoCompartirComponent,
          DatosCompartir,
          ResultadoCompartir | null
        >(DialogoCompartirComponent, {
          data: { item, usuarioActualId: this.usuarioActualId() },
          autoFocus: false,
        })
        .afterClosed(),
    );
    if (!resultado) return false;

    try {
      if (esArchivo(item)) {
        await firstValueFrom(
          this.archivoService.compartir(item.archivo._id, resultado),
        );
      } else {
        await firstValueFrom(
          this.carpetaService.compartir(item.carpeta._id, resultado),
        );
      }
      this.avisar('Se actualizaron los permisos');
      return true;
    } catch (error) {
      this.mostrarError(error);
      return false;
    }
  }

  private async enviarAPapelera(item: ItemRecurso): Promise<boolean> {
    const confirmado = await firstValueFrom(
      this.dialog
        .open<DialogoConfirmarComponent, DatosConfirmar, boolean>(
          DialogoConfirmarComponent,
          {
            data: {
              titulo: 'Mover a la papelera',
              mensaje: `“${nombreItem(item)}” se moverá a la papelera. Podrás restaurarlo más tarde.`,
              textoConfirmar: 'Mover a la papelera',
              peligroso: true,
            },
          },
        )
        .afterClosed(),
    );
    if (!confirmado) return false;

    try {
      if (esArchivo(item)) {
        await firstValueFrom(
          this.archivoService.enviarAPapelera(item.archivo._id),
        );
      } else {
        await firstValueFrom(
          this.carpetaService.enviarAPapelera(item.carpeta._id),
        );
      }
      this.avisar(`“${nombreItem(item)}” se movió a la papelera`);
      return true;
    } catch (error) {
      this.mostrarError(error);
      return false;
    }
  }

  private async restaurar(item: ItemRecurso): Promise<boolean> {
    try {
      if (esArchivo(item)) {
        await firstValueFrom(this.archivoService.restaurar(item.archivo._id));
      } else {
        await firstValueFrom(this.carpetaService.restaurar(item.carpeta._id));
      }
      this.avisar(`“${nombreItem(item)}” se restauró`);
      return true;
    } catch (error) {
      this.mostrarError(error);
      return false;
    }
  }

  private usuarioActualId(): string {
    return this.auth.usuario()?.id ?? '';
  }

  private avisar(mensaje: string): void {
    this.snack.open(mensaje, 'Cerrar', { duration: 3500 });
  }

  private mostrarError(error: unknown): void {
    const mensaje =
      (error as { error?: { error?: string } })?.error?.error ??
      'No se pudo completar la acción.';
    this.snack.open(mensaje, 'Cerrar', { duration: 5000 });
  }
}
