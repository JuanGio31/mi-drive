export type QueryParams = Record<string, string | number | boolean>;

/**
 * Normaliza un objeto de filtros a los query params que espera el backend:
 * omite undefined, null y vacíos. El backend trata la ausencia de `carpetaPadre`
 * como carpeta raíz (enviar la cadena 'null' provocaría un 500 al intentar
 * convertirlo en un ObjectId de Mongo).
 */
export function buildParams(source: object): QueryParams {
  const params: QueryParams = {};

  for (const [key, value] of Object.entries(source)) {
    if (value === undefined || value === null || value === '') continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      params[key] = value;
    }
  }

  return params;
}
