import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Rol, Usuario } from '../../../core/models';
import { AuthService } from '../../../core/services/auth-service';
import { UsuarioService } from '../../../core/services/usuario-service';
import { formatearFecha } from '../../../core/utils/formato';
import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog';
import {
  UsuarioFormDialog,
  UsuarioFormData,
} from './usuario-form-dialog/usuario-form-dialog';

/** Listado y CRUD de usuarios para administradores. Ruta: /admin/usuarios. */
@Component({
  selector: 'app-admin-usuarios',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class AdminUsuariosComponent {
  private readonly usuarioService = inject(UsuarioService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly columnas = ['usuario', 'rol', 'estado', 'registro', 'acciones'];
  readonly roles = [Rol.Usuario, Rol.Administrador];
  readonly formatearFecha = formatearFecha;

  readonly usuarios = signal<Usuario[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly rolFiltro = signal<Rol | ''>('');
  readonly soloActivos = signal(false);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly usuarioActualId = computed(() => this.authService.usuario()?.id);

  constructor() {
    this.cargar();
  }

  /** Carga la página actual aplicando los filtros seleccionados. */
  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.usuarioService
      .listar({
        page: this.page(),
        limit: this.limit(),
        ...(this.rolFiltro() ? { rol: this.rolFiltro() as Rol } : {}),
        ...(this.soloActivos() ? { activo: true } : {}),
      })
      .subscribe({
        next: (res) => {
          this.usuarios.set(res.usuarios);
          this.total.set(res.total);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.cargando.set(false);
          this.error.set(this.mensajeError(err));
        },
      });
  }

  /** Cambia el filtro de rol y vuelve a la primera página. */
  cambiarRol(rol: Rol | ''): void {
    this.rolFiltro.set(rol);
    this.page.set(1);
    this.cargar();
  }

  /** Filtra por usuarios activos o muestra todos. */
  cambiarSoloActivos(activo: boolean): void {
    this.soloActivos.set(activo);
    this.page.set(1);
    this.cargar();
  }

  /** Actualiza la página al cambiar el paginador. */
  cambiarPagina(evento: PageEvent): void {
    this.page.set(evento.pageIndex + 1);
    this.limit.set(evento.pageSize);
    this.cargar();
  }

  /** Abre el formulario para crear un usuario. */
  abrirCrear(): void {
    const ref = this.dialog.open<UsuarioFormDialog, UsuarioFormData, boolean>(
      UsuarioFormDialog,
      {
        width: '520px',
        maxWidth: '95vw',
        data: { esPropio: false },
      },
    );

    ref.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.page.set(1);
        this.cargar();
        this.avisar('Usuario creado');
      }
    });
  }

  /** Abre el formulario de edición del usuario seleccionado. */
  abrirEditar(usuario: Usuario): void {
    const ref = this.dialog.open<UsuarioFormDialog, UsuarioFormData, boolean>(
      UsuarioFormDialog,
      {
        width: '520px',
        maxWidth: '95vw',
        data: {
          usuario,
          esPropio: usuario._id === this.usuarioActualId(),
        },
      },
    );

    ref.afterClosed().subscribe((guardado) => {
      if (guardado) {
        this.cargar();
        this.avisar('Usuario actualizado');
      }
    });
  }

  /** Pide confirmación y desactiva (soft delete) al usuario. */
  desactivar(usuario: Usuario): void {
    const ref = this.dialog.open<ConfirmDialog, unknown, boolean>(
      ConfirmDialog,
      {
        width: '440px',
        data: {
          titulo: 'Desactivar usuario',
          mensaje: `¿Desactivar a ${usuario.nombre}? No podrá iniciar sesión hasta que lo reactives.`,
          confirmar: 'Desactivar',
          peligro: true,
        },
      },
    );

    ref.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.usuarioService.desactivar(usuario._id).subscribe({
        next: () => {
          if (this.usuarios().length === 1 && this.page() > 1) {
            this.page.update((p) => p - 1);
          }
          this.cargar();
          this.avisar('Usuario desactivado');
        },
        error: (err: HttpErrorResponse) => this.error.set(this.mensajeError(err)),
      });
    });
  }

  /** Reactiva a un usuario desactivado. */
  reactivar(usuario: Usuario): void {
    this.usuarioService.reactivar(usuario._id).subscribe({
      next: () => {
        this.cargar();
        this.avisar('Usuario reactivado');
      },
      error: (err: HttpErrorResponse) => this.error.set(this.mensajeError(err)),
    });
  }

  /** Iniciales del usuario para el avatar de la fila. */
  iniciales(nombre: string): string {
    return (
      nombre
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join('') || 'U'
    );
  }

  /** Etiqueta legible del rol. */
  etiquetaRol(rol: Rol): string {
    return rol === Rol.Administrador ? 'Administrador' : 'Usuario';
  }

  /** Indica si el usuario de la fila es el administrador autenticado. */
  esPropio(usuario: Usuario): boolean {
    return usuario._id === this.usuarioActualId();
  }

  /** Muestra un aviso breve de éxito. */
  private avisar(mensaje: string): void {
    this.snack.open(mensaje, 'Cerrar', { duration: 2500 });
  }

  /** Traduce los errores del backend a un mensaje legible. */
  private mensajeError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    const detalle = (err.error as { error?: string })?.error;
    return detalle ?? 'No se pudo completar la operación.';
  }
}
