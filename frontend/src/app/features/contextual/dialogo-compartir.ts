import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ItemRecurso,
  NivelPermiso,
  UsuarioDirectorio,
  compartidosItem,
  nombreItem,
} from '../../core/models';
import { UsuarioService } from '../../core/services/usuario-service';
import { etiquetaPermiso } from '../../core/utils/permisos';

export interface DatosCompartir {
  item: ItemRecurso;
  usuarioActualId: string;
}

export interface ResultadoCompartir {
  usuarioId: string;
  permiso: NivelPermiso;
}

/** Diálogo para compartir un archivo o carpeta con otro usuario. */
@Component({
  selector: 'app-dialogo-compartir',
  imports: [
    FormsModule,
    MatDialogModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dialogo-compartir.html',
  styleUrl: './dialogo-compartir.scss',
})
export class DialogoCompartirComponent {
  readonly datos = inject<DatosCompartir>(MAT_DIALOG_DATA);
  private readonly ref =
    inject<MatDialogRef<DialogoCompartirComponent, ResultadoCompartir | null>>(MatDialogRef);
  private readonly usuarioService = inject(UsuarioService);

  readonly usuarios = signal<UsuarioDirectorio[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly nombre = nombreItem(this.datos.item);

  /** Texto escrito en el buscador. */
  readonly busqueda = signal('');

  /** Usuario elegido de las sugerencias (null mientras no haya uno válido). */
  usuarioId: string | null = null;

  /** Permisos actuales del recurso, por id de usuario. */
  private readonly permisosActuales = new Map<string, NivelPermiso>(
    compartidosItem(this.datos.item).map((c) => [c.usuario, c.permiso] as [string, NivelPermiso]),
  );

  /** Usuarios que aún no tienen acceso directo al recurso. */
  readonly opciones = computed<UsuarioDirectorio[]>(() =>
    this.usuarios().filter((u) => !this.permisosActuales.has(u._id)),
  );

  /**
   * Sugerencias que coinciden con lo escrito, buscando por nombre o correo.
   * Ignora mayúsculas y acentos y acepta varios términos en cualquier orden
   * (p. ej. "ana mar" encuentra "Ana Martínez").
   */
  readonly sugerencias = computed<UsuarioDirectorio[]>(() => {
    const terminos = this.normalizar(this.busqueda()).split(' ').filter(Boolean);
    if (terminos.length === 0) return this.opciones();

    return this.opciones().filter((opcion) => {
      const texto = this.normalizar(`${opcion.nombre} ${opcion.correo}`);
      return terminos.every((termino) => texto.includes(termino));
    });
  });

  readonly permisos = [NivelPermiso.Lectura, NivelPermiso.Escritura, NivelPermiso.Comentar];

  permiso: NivelPermiso = NivelPermiso.Lectura;

  constructor() {
    void this.cargar();
  }

  etiqueta(permiso: NivelPermiso | null): string {
    return permiso ? etiquetaPermiso(permiso) : '';
  }

  /** Texto que se muestra al elegir un usuario. */
  etiquetaUsuario(usuario: UsuarioDirectorio): string {
    return `${usuario.nombre} — ${usuario.correo}`;
  }

  /** Al escribir se invalida la elección si ya no coincide con el texto. */
  alEscribir(texto: string): void {
    this.busqueda.set(texto);
    if (this.usuarioId === null) return;

    const elegido = this.usuarios().find((u) => u._id === this.usuarioId);
    const coincide =
      elegido && this.normalizar(this.etiquetaUsuario(elegido)) === this.normalizar(texto);
    if (!coincide) this.usuarioId = null;
  }

  /** Al elegir una sugerencia se fija el usuario con el permiso inicial. */
  alElegir(id: string): void {
    const usuario = this.opciones().find((u) => u._id === id);
    if (!usuario) return;

    this.usuarioId = id;
    this.busqueda.set(this.etiquetaUsuario(usuario));
    this.permiso = NivelPermiso.Lectura;
  }

  confirmar(): void {
    if (!this.usuarioId) return;
    this.ref.close({ usuarioId: this.usuarioId, permiso: this.permiso });
  }

  cancelar(): void {
    this.ref.close(null);
  }

  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private async cargar(): Promise<void> {
    try {
      const usuarios = await firstValueFrom(this.usuarioService.directorio());
      // No tiene sentido compartir con uno mismo.
      this.usuarios.set(usuarios.filter((u) => u._id !== this.datos.usuarioActualId));
    } catch {
      this.error.set('No se pudo cargar la lista de usuarios.');
    } finally {
      this.cargando.set(false);
    }
  }
}
