import { Component, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import {
  Carpeta,
  ItemRecurso,
  NivelPermiso,
  carpetaPadreItem,
  esArchivo,
  idItem,
  nombreItem,
} from '../../core/models';
import { CarpetaService } from '../../core/services/carpeta-service';

export interface DatosMover {
  item: ItemRecurso;
}

export interface ResultadoMover {
  carpetaPadre: string | null;
}

interface OpcionDestino {
  id: string | null;
  nombre: string;
  ruta: string;
  profundidad: number;
  bloqueada: boolean;
  motivo: string | null;
}

/** Diálogo para elegir la carpeta destino de un archivo o carpeta. */
@Component({
  selector: 'app-dialogo-mover',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatRadioModule,
  ],
  templateUrl: './dialogo-mover.html',
  styleUrl: './dialogo-mover.scss',
})
export class DialogoMoverComponent implements OnInit {
  readonly datos = inject<DatosMover>(MAT_DIALOG_DATA);
  private readonly carpetaService = inject(CarpetaService);
  private readonly ref =
    inject<MatDialogRef<DialogoMoverComponent, ResultadoMover | null>>(MatDialogRef);

  readonly nombre = nombreItem(this.datos.item);
  readonly esCarpeta = !esArchivo(this.datos.item);
  readonly opciones = signal<OpcionDestino[]>([]);
  readonly seleccion = signal<string>(carpetaPadreItem(this.datos.item) ?? '');
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  /** Carga el árbol accesible y arma las opciones con su jerarquía. */
  async ngOnInit(): Promise<void> {
    try {
      const carpetas = await this.carpetaService.listarTodasAccesibles();
      const opciones = this.construirOpciones(carpetas);

      if (!opciones.some((opcion) => (opcion.id ?? '') === this.seleccion())) {
        this.seleccion.set('');
      }
      this.opciones.set(opciones);
    } catch {
      this.error.set('No se pudieron cargar las carpetas disponibles.');
    } finally {
      this.cargando.set(false);
    }
  }

  get seleccionValida(): boolean {
    const opcion = this.opciones().find((candidata) => (candidata.id ?? '') === this.seleccion());
    return !!opcion && !opcion.bloqueada;
  }

  confirmar(): void {
    if (!this.seleccionValida || this.cargando() || this.error()) return;
    this.ref.close({ carpetaPadre: this.seleccion() || null });
  }

  cancelar(): void {
    this.ref.close(null);
  }

  private construirOpciones(carpetas: Carpeta[]): OpcionDestino[] {
    const porId = new Map(carpetas.map((carpeta) => [carpeta._id, carpeta]));
    const hijos = new Map<string | null, Carpeta[]>();

    for (const carpeta of carpetas) {
      const padre =
        carpeta.carpetaPadre && porId.has(carpeta.carpetaPadre) ? carpeta.carpetaPadre : null;
      const lista = hijos.get(padre) ?? [];
      lista.push(carpeta);
      hijos.set(padre, lista);
    }

    for (const lista of hijos.values()) {
      lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    }

    const bloqueadas = this.carpetasBloqueadas(hijos);
    const opciones: OpcionDestino[] = [
      {
        id: null,
        nombre: 'Mi Unidad',
        ruta: 'Mi Unidad',
        profundidad: 0,
        bloqueada: false,
        motivo: null,
      },
    ];

    const recorrer = (padre: string | null, profundidad: number, rutaPadre: string): void => {
      if (profundidad > 22) return;

      for (const carpeta of hijos.get(padre) ?? []) {
        const ruta = `${rutaPadre} / ${carpeta.nombre}`;
        const esOrigen = !esArchivo(this.datos.item) && carpeta._id === this.datos.item.carpeta._id;
        const esDescendiente = bloqueadas.has(carpeta._id);
        const soloLectura =
          !esOrigen && carpeta.miPermiso != null && carpeta.miPermiso !== NivelPermiso.Escritura;

        opciones.push({
          id: carpeta._id,
          nombre: carpeta.nombre,
          ruta,
          profundidad,
          bloqueada: esOrigen || esDescendiente || soloLectura,
          motivo: esOrigen
            ? 'Es el recurso que estás moviendo'
            : esDescendiente
              ? 'Está dentro del recurso que estás moviendo'
              : soloLectura
                ? 'Solo lectura'
                : null,
        });

        recorrer(carpeta._id, profundidad + 1, ruta);
      }
    };

    recorrer(null, 1, 'Mi Unidad');
    return opciones;
  }

  /** Incluye la carpeta de origen y todos sus descendientes. */
  private carpetasBloqueadas(hijos: Map<string | null, Carpeta[]>): Set<string> {
    const bloqueadas = new Set<string>();
    if (esArchivo(this.datos.item)) return bloqueadas;

    const pendientes = [idItem(this.datos.item)];
    while (pendientes.length > 0) {
      const id = pendientes.pop() as string;
      if (bloqueadas.has(id)) continue;
      bloqueadas.add(id);
      for (const hija of hijos.get(id) ?? []) {
        pendientes.push(hija._id);
      }
    }

    return bloqueadas;
  }
}
