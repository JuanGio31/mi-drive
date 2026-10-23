export const esRecursoDestacado = (
  recurso: { destacadoPor?: string[] },
  usuarioId?: string | null,
): boolean => Boolean(usuarioId && recurso.destacadoPor?.includes(usuarioId));
