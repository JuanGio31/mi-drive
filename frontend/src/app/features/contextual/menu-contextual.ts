import {
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

/** Una opción del menú contextual. */
export interface ItemMenuContextual {
  /** Id que se emite al elegir la opción. */
  id: string;
  etiqueta: string;
  icono: string;
  /** Marca la opción destructiva en rojo. */
  peligroso?: boolean;
}

/**
 * Menú contextual reutilizable.
 *
 * Uso: el padre lo usa como fila (le pasa el contenido por proyección y las
 * opciones con `items`). El menú se abre justo donde se hace clic: con el
 * botón derecho en cualquier punto de la fila, o desde el botón "⋮".
 *
 * El disparador es el contenedor `.contexto`, que usa `display: contents`
 * para que el contenido proyectado y el botón sigan participando del layout
 * flex de la fila padre.
 */
@Component({
  selector: 'app-menu-contextual',
  imports: [MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './menu-contextual.html',
  styleUrl: './menu-contextual.scss',
})
export class MenuContextualComponent {
  /** Opciones a mostrar, en el orden dado. */
  readonly items = input<ItemMenuContextual[]>([]);

  /** Emite el id de la opción elegida. */
  readonly seleccionar = output<string>();

  private readonly disparador =
    viewChild.required<ElementRef<HTMLElement>>('contexto');

  /** Abre el menú bajo el botón "⋮" de la fila. */
  abrirDesdeBoton(evento: MouseEvent): void {
    evento.preventDefault();
    evento.stopPropagation();
    const rect = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    this.abrirEnPunto(rect.left, rect.bottom);
  }

  /**
   * Lanza un `contextmenu` sintético en el punto indicado para que
   * `MatContextMenuTrigger` abra el menú ahí.
   */
  private abrirEnPunto(x: number, y: number): void {
    if (this.items().length === 0) return;

    this.disparador().nativeElement.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        button: 2,
        buttons: 2,
        clientX: x,
        clientY: y,
      }),
    );
  }

  /** Evita que el clic/tecla del botón active la fila. */
  detenerPropagacion(evento: Event): void {
    evento.stopPropagation();
  }
}
