import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ExtensionArchivo } from '../../core/models';
import { ArchivoService } from '../../core/services/archivo-service';
import { RecargaService } from '../../core/services/recarga-service';
import { DatosNuevo, DialogoNuevoComponent, ResultadoNuevo, TipoNuevo } from './dialogo-nuevo';

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
  private readonly archivos = inject(ArchivoService);

  async crear(tipo: TipoNuevo): Promise<void> {
    const carpetaPadre = this.carpetaActual();
    const datos: DatosNuevo = {
      tipo,
      carpetaPadre,
      destino: carpetaPadre ? 'esta carpeta' : 'Mi Unidad',
    };

    const resultado = await firstValueFrom(
      this.dialog
        .open<DialogoNuevoComponent, DatosNuevo, ResultadoNuevo | null>(DialogoNuevoComponent, {
          data: datos,
          width: '420px',
          autoFocus: 'dialog',
        })
        .afterClosed(),
    );
    if (!resultado) return;

    if (resultado.tipo === 'archivo') {
      this.snack.open('Archivo creado', 'Cerrar', { duration: 2500 });
      await this.router.navigate(['/archivo', resultado.archivo._id, 'editar']);
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

  /** Abre el selector nativo para subir un archivo .txt o .md. */
  abrirSelectorArchivo(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,text/plain,text/markdown';
    input.style.display = 'none';

    input.addEventListener(
      'change',
      () => {
        const archivo = input.files?.[0];
        input.remove();
        if (archivo) void this.subirArchivo(archivo);
      },
      { once: true },
    );

    document.body.appendChild(input);
    input.click();
  }

  /** Lee el archivo como texto y lo crea en la carpeta actual. */
  async subirArchivo(archivo: File): Promise<void> {
    const tipo = this.tipoDeArchivo(archivo.name);
    if (!tipo) {
      this.snack.open('Solo se permiten archivos .txt o .md', 'Cerrar', {
        duration: 4000,
      });
      return;
    }
    if (archivo.size > 10_000_000) {
      this.snack.open('El archivo supera el límite de 10 MB', 'Cerrar', {
        duration: 4000,
      });
      return;
    }

    try {
      const contenido = await archivo.text();
      const carpetaPadre = this.carpetaActual();

      await firstValueFrom(
        this.archivos.crear({
          nombre: archivo.name,
          tipo,
          contenido,
          carpetaPadre,
        }),
      );

      this.snack.open('Archivo subido', 'Cerrar', { duration: 2500 });

      if (this.enMiUnidad()) {
        this.recarga.pedir();
      } else {
        await this.router.navigate(carpetaPadre ? ['/mi-unidad', carpetaPadre] : ['/mi-unidad']);
      }
    } catch (error) {
      this.snack.open(this.mensajeError(error), 'Cerrar', { duration: 5000 });
    }
  }

  private tipoDeArchivo(nombre: string): ExtensionArchivo | null {
    const extension = nombre.toLowerCase().split('.').pop();
    if (extension === ExtensionArchivo.Txt) return ExtensionArchivo.Txt;
    if (extension === ExtensionArchivo.Md) return ExtensionArchivo.Md;
    return null;
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const mensaje = (error.error as { error?: unknown } | null)?.error;
      if (typeof mensaje === 'string') return mensaje;
    }
    return 'No se pudo subir el archivo.';
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
