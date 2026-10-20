import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  MatAutocompleteModule,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
} from 'rxjs';
import { AuthService } from '../../../core/services/auth-service';
import { BusquedaService } from '../../../core/services/busqueda-service';
import { Archivo, Carpeta, ExtensionArchivo } from '../../../core/models';
import { formatearTamanio } from '../../../core/utils/formato';

@Component({
  selector: 'app-topbar',
  imports: [
    FormsModule,
    MatAutocompleteModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  private readonly authService = inject(AuthService);
  private readonly busquedaService = inject(BusquedaService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Usuario autenticado actual (modelo UsuarioSesion). */
  readonly user = this.authService.usuario;

  /** Iniciales del usuario para el avatar (ej. "Carlos Gómez" → "CG"). */
  readonly initials = computed(() => {
    const nombre = this.user()?.nombre ?? '';
    const letras = nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
    return letras || 'U';
  });

  private readonly trigger = viewChild(MatAutocompleteTrigger);
  private readonly consultas = new Subject<string>();

  /** Texto del campo de búsqueda. */
  readonly texto = signal('');

  /** Consulta que se está mostrando (para el mensaje de "sin resultados"). */
  readonly consulta = signal('');

  readonly carpetas = signal<Carpeta[]>([]);
  readonly archivos = signal<Archivo[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly buscando = signal(false);

  readonly sinResultados = computed(
    () =>
      this.buscando() &&
      !this.cargando() &&
      !this.error() &&
      this.carpetas().length === 0 &&
      this.archivos().length === 0,
  );

  readonly formatearTamanio = formatearTamanio;

  /** La selección de una opción no debe escribirla en el input. */
  readonly mostrarResultado = (): string => '';

  constructor() {
    this.consultas
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) => {
          if (!q) return of(null);

          this.cargando.set(true);
          this.error.set(null);
          return this.busquedaService.buscar(q).pipe(
            catchError(() => {
              this.error.set('No se pudo buscar. Intenta de nuevo.');
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resultados) => {
        this.cargando.set(false);
        if (!resultados) return;

        this.carpetas.set(resultados.carpetas);
        this.archivos.set(resultados.archivos);
      });
  }

  /** Abre la vista de perfil del usuario. */
  abrirPerfil(): void {
    this.router.navigate(['/perfil']);
  }

  /** Al escribir se lanza la búsqueda (con retardo) o se limpia. */
  alEscribir(valor: unknown): void {
    // Al elegir una sugerencia, el autocompletado escribe el valor del
    // control (un string "tipo:id"); no es texto que el usuario haya escrito.
    if (typeof valor !== 'string') {
      this.texto.set('');
      return;
    }

    this.texto.set(valor);
    const q = valor.trim();
    this.consulta.set(q);

    if (!q) {
      this.buscando.set(false);
      this.error.set(null);
      this.carpetas.set([]);
      this.archivos.set([]);
      return;
    }

    this.buscando.set(true);
    this.consultas.next(q);
  }

  /** Navega al resultado elegido (carpeta o archivo). */
  abrir(valor: unknown): void {
    if (typeof valor !== 'string') return;

    const [tipo, id] = valor.split(':');
    this.limpiar();
    if (!id) return;

    if (tipo === 'carpeta') {
      void this.router.navigate(['/mi-unidad', id]);
    } else {
      void this.router.navigate(['/archivo', id]);
    }
  }

  /** Vacía el buscador y sus resultados. */
  limpiar(): void {
    this.texto.set('');
    this.consulta.set('');
    this.buscando.set(false);
    this.cargando.set(false);
    this.error.set(null);
    this.carpetas.set([]);
    this.archivos.set([]);
    this.trigger()?.closePanel();
  }

  valorCarpeta(carpeta: Carpeta): string {
    return `carpeta:${carpeta._id}`;
  }

  valorArchivo(archivo: Archivo): string {
    return `archivo:${archivo._id}`;
  }

  /** Ícono según el tipo de archivo (texto plano / markdown). */
  iconoArchivo(tipo: ExtensionArchivo): string {
    return tipo === ExtensionArchivo.Md ? 'code' : 'description';
  }

  logout(): void {
    this.authService.logout();
  }
}
