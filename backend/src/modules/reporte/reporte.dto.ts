import { z } from 'zod/v3';

const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID inválido');

export const RangoFechasSchema = z.object({
    desde: z.string().datetime().optional(),
    hasta: z.string().datetime().optional(),
});

export const UsuarioReporteSchema = z.object({
    usuarioId: ObjectIdSchema,
});

export const TopLimiteSchema = z.object({
    limite: z
        .string()
        .trim()
        .default('10')
        .transform(Number)
        .pipe(z.number().int().positive().max(50)),
});

export type RangoFechasDTO = z.infer<typeof RangoFechasSchema>;
export type TopLimiteDTO = z.infer<typeof TopLimiteSchema>;
