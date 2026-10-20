import { z } from 'zod/v3';

/** Query de GET /buscar. `q` es obligatorio; `limite` acota cada grupo. */
export const BuscarQuerySchema = z.object({
    q: z
        .string()
        .trim()
        .min(1, 'La búsqueda no puede estar vacía')
        .max(100, 'La búsqueda es demasiado larga'),
    limite: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive().max(50))
        .optional(),
});

export type BuscarQueryDTO = z.infer<typeof BuscarQuerySchema>;
