import { Injectable, signal } from '@angular/core';

/**
 * Señal global para pedir a la vista actual que recargue su contenido sin
 * navegar. La usa el botón "Nuevo" de la barra lateral: al crear una carpeta
 * desde otra vista distinta al explorador, este servicio avisa para refrescar
 * la lista. Cada vista decide si le afecta (por ejemplo, el explorador de
 * carpetas lo escucha para volver a pedir sus recursos).
 */
@Injectable({ providedIn: 'root' })
export class RecargaService {
  private readonly contador = signal(0);

  /** Cambia de valor cada vez que se pide una recarga. */
  readonly version = this.contador.asReadonly();

  pedir(): void {
    this.contador.update((valor) => valor + 1);
  }
}
