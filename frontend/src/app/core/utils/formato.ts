/** Formatea un tamaño en bytes a B / KB / MB. */
export function formatearTamanio(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Formatea una fecha ISO como dd/mm/aaaa en horario local. */
export function formatearFecha(iso: string): string {
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Formatea una fecha ISO con hora local (dd/mm/aaaa hh:mm). */
export function formatearFechaHora(iso: string): string {
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
