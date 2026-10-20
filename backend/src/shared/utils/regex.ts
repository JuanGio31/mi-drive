/**
 * Escapa los caracteres especiales de una expresión regular para poder usarla
 * como búsqueda literal (sin que el texto del usuario altere el patrón).
 */
export function escaparRegex(texto: string): string {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
