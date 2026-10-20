/**
 * Convierte el valor de un <input type="date"> (aaaa-mm-dd) a ISO con la hora
 * local. Si `finDelDia` es true usa 23:59:59.999 para incluir todo el día.
 */
export function fechaLocalAIso(
  valor: string,
  finDelDia = false,
): string | undefined {
  if (!valor) return undefined;

  const [anio, mes, dia] = valor.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);

  if (finDelDia) {
    fecha.setHours(23, 59, 59, 999);
  }

  return fecha.toISOString();
}

/** Valor aaaa-mm-dd de hoy, para precargar filtros de fecha. */
export function hoyLocal(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}
