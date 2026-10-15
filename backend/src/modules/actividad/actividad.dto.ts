import { z } from 'zod/v3';
import { AccionActividad, TipoRecurso } from '../../shared/types/enums';

const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID inválido');

export const FiltrosActividadSchema = z.object({
    usuarioId: ObjectIdSchema.optional(),
    accion: z
        .enum(Object.values(AccionActividad) as [string, ...string[]])
        .optional(),
    recursoTipo: z
        .enum(Object.values(TipoRecurso) as [string, ...string[]])
        .optional(),
    recursoId: ObjectIdSchema.optional(),
    desde: z.string().datetime().optional(),
    hasta: z.string().datetime().optional(),
    page: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive())
        .optional(),
    limit: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive().max(200))
        .optional(),
});

export const RecursoParamSchema = z.object({
    tipo: z.enum(['archivo', 'carpeta', 'usuario']),
    id: ObjectIdSchema,
});

export type FiltrosActividad = z.infer<typeof FiltrosActividadSchema>;
