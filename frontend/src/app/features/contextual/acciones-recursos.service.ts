import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { ItemRecurso, esArchivo, nombreItem } from '../../core/models';
import { ArchivoService } from '../../core/services/archivo-service';
import { AuthService } from '../../core/services/auth-service';
import { CarpetaService } from '../../core/services/carpeta-service';
import { esRecursoDestacado } from '../../core/utils/destacados';
import { DialogoConfirmarComponent, DatosConfirmar } from './dialogo-confirmar';
import { DialogoRenombrarComponent, DatosRenombrar } from './dialogo-renombrar';
import { DatosCompartir, DialogoCompartirComponent, ResultadoCompartir } from './dialogo-compartir';
import { DatosDetalles, DialogoDetallesComponent } from './dialogo-detalles';
import { DatosMover, DialogoMoverComponent, ResultadoMover } from './dialogo-mover';

export type AccionRecurso =
  | 'detalles'
  | 'destacar'
  | 'renombrar'
  | 'compartir'
  | 'mover'
  | 'papelera'
  | 'restaurar'
  | 'eliminar';

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
        return this.verDetalles(item);
      case 'destacar':
        return this.destacar(item);
      case 'renombrar':
        return this.renombrar(item);
      case 'compartir':
        return this.compartir(item);
      case 'mover':
        return this.mover(item);
      case 'papelera':
        return this.enviarAPapelera(item);
      case 'restaurar':
        return this.restaurar(item);
      case 'eliminar':
        return this.eliminarPermanente(item);
      default:
        return false;
    }
  }

  private async verDetalles(item: ItemRecurso): Promise<boolean> {
    const cambio = await firstValueFrom(
      this.dialog
        .open<DialogoDetallesComponent, DatosDetalles, boolean>(DialogoDetallesComponent, {
          data: { item, usuarioActualId: this.usuarioActualId() },
          maxWidth: '95vw',
          autoFocus: false,
        })
        .afterClosed(),
    );
    return cambio ?? false;
  }

  private async destacar(item: ItemRecurso): Promise<boolean> {
    const recurso = esArchivo(item) ? item.archivo : item.carpeta;
    const destacado = !esRecursoDestacado(recurso, this.usuarioActualId());

    try {
      if (esArchivo(item)) {
        await firstValueFrom(this.archivoService.destacar(item.archivo._id, { destacado }));
      } else {
        await firstValueFrom(this.carpetaService.destacar(item.carpeta._id, { destacado }));
      }
      this.avisar(
        destacado
          ? `“${nombreItem(item)}” se marcó como destacado`
          : `“${nombreItem(item)}” se quitó de destacados`,
      );
      return true;
    } catch (error) {
      this.mostrarError(error);
      return false;
    }
  }

  private async renombrar(item: ItemRecurso): Promise<boolean> {
    const nombre = await firstValueFrom(
      this.dialog
        .open<DialogoRenombrarComponent, DatosRenombrar, string | null>(DialogoRenombrarComponent, {
          data: { nombreActual: nombreItem(item), tipo: item.tipo },
          autoFocus: 'dialog',
        })
        .afterClosed(),
    );
    if (!nombre) return false;

    try {
      if (esArchivo(item)) {
        await firstValueFrom(this.archivoService.renombrar(item.archivo._id, { nombre }));
      } else {
        await firstValueFrom(this.carpetaService.renombrar(item.carpeta._id, { nombre }));
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
        .open<DialogoCompartirComponent, DatosCompartir, ResultadoCompartir | null>(
          DialogoCompartirComponent,
          {
            data: { item, usuarioActualId: this.usuarioActualId() },
            autoFocus: false,
          },
        )
        .afterClosed(),
    );
    if (!resultado) return false;

    try {
      if (esArchivo(item)) {
        await firstValueFrom(this.archivoService.compartir(item.archivo._id, resultado));
      } else {
        await firstValueFrom(this.carpetaService.compartir(item.carpeta._id, resultado));
      }
      this.avisar('Se actualizaron los permisos');
      return true;
    } catch (error) {
      this.mostrarError(error);
      return false;
    }
  }

  private async mover(item: ItemRecurso): Promise<boolean> {
    const resultado = await firstValueFrom(
      this.dialog
        .open<DialogoMoverComponent, DatosMover, ResultadoMover | null>(DialogoMoverComponent, {
          data: { item },
          maxWidth: '95vw',
          autoFocus: false,
        })
        .afterClosed(),
    );
    if (!resultado) return false;

    try {
      if (esArchivo(item)) {
        await firstValueFrom(
          this.archivoService.mover(item.archivo._id, {
            carpetaPadre: resultado.carpetaPadre,
          }),
        );
      } else {
        await firstValueFrom(
          this.carpetaService.mover(item.carpeta._id, {
            carpetaPadre: resultado.carpetaPadre,
          }),
        );
      }
      this.avisar(`“${nombreItem(item)}” se movió correctamente`);
      return true;
    } catch (error) {
      this.mostrarError(error);
      return false;
    }
  }

  private async enviarAPapelera(item: ItemRecurso): Promise<boolean> {
    const confirmado = await firstValueFrom(
      this.dialog
        .open<DialogoConfirmarComponent, DatosConfirmar, boolean>(DialogoConfirmarComponent, {
          data: {
            titulo: 'Mover a la papelera',
            mensaje: `“${nombreItem(item)}” se moverá a la papelera. Podrás restaurarlo más tarde.`,
            textoConfirmar: 'Mover a la papelera',
            peligroso: true,
          },
        })
        .afterClosed(),
    );
    if (!confirmado) return false;

    try {
      if (esArchivo(item)) {
        await firstValueFrom(this.archivoService.enviarAPapelera(item.archivo._id));
      } else {
        await firstValueFrom(this.carpetaService.enviarAPapelera(item.carpeta._id));
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

  private async eliminarPermanente(item: ItemRecurso): Promise<boolean> {
    const contenido =
      item.tipo === 'carpeta'
        ? `“${nombreItem(item)}” y todo su contenido se eliminarán definitivamente.`
        : `“${nombreItem(item)}” se eliminará definitivamente.`;

    const confirmado = await firstValueFrom(
      this.dialog
        .open<DialogoConfirmarComponent, DatosConfirmar, boolean>(DialogoConfirmarComponent, {
          data: {
            titulo: 'Eliminar permanentemente',
            mensaje: `${contenido} Esta acción no se puede deshacer.`,
            textoConfirmar: 'Eliminar permanentemente',
            peligroso: true,
          },
        })
        .afterClosed(),
    );
    if (!confirmado) return false;

    try {
      if (esArchivo(item)) {
        await firstValueFrom(this.archivoService.eliminarPermanente(item.archivo._id));
      } else {
        await firstValueFrom(this.carpetaService.eliminarPermanente(item.carpeta._id));
      }
      this.avisar(`“${nombreItem(item)}” se eliminó permanentemente`);
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
      (error as { error?: { error?: string } })?.error?.error ?? 'No se pudo completar la acción.';
    this.snack.open(mensaje, 'Cerrar', { duration: 5000 });
  }
}
