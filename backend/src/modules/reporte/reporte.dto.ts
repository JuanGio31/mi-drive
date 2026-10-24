import { z } from 'zod/v3';

const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID inválido');

const PaginaSchema = z
    .string()
    .trim()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().positive());

const LimitePaginaSchema = z
    .string()
    .trim()
    .default('20')
    .transform(Number)
    .pipe(z.number().int().positive().max(100));

export const RangoFechasSchema = z.object({
    desde: z.string().datetime().optional(),
    hasta: z.string().datetime().optional(),
});

export const PaginacionSchema = z.object({
    page: PaginaSchema,
    limit: LimitePaginaSchema,
});

export const RangoPaginadoSchema = RangoFechasSchema.extend({
    page: PaginaSchema,
    limit: LimitePaginaSchema,
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
export type RangoPaginadoDTO = z.infer<typeof RangoPaginadoSchema>;
export type PaginacionDTO = z.infer<typeof PaginacionSchema>;
export type TopLimiteDTO = z.infer<typeof TopLimiteSchema>;
