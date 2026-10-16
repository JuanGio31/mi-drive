import z from 'zod/v3';
import { NivelPermiso } from '../../shared/types/enums';

/** Validaciones Zod de entradas del módulo carpeta. */

// Valida que un string tenga formato de ObjectId de Mongo.
const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID inválido');

// Valida que el permiso sea uno de los niveles permitidos.
const PermisoSchema = z.enum(
    Object.values(NivelPermiso) as [string, ...string[]],
);

/** Body para crear una carpeta, con padre opcional (omitido = raíz). */
export const CrearCarpetaSchema = z.object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(200),
    carpetaPadre: ObjectIdSchema.nullable().optional(),
});

/** Body para renombrar una carpeta. */
export const RenombrarCarpetaSchema = z.object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(200),
});

/** Body para mover una carpeta (null = llevar a la raíz). */
export const MoverCarpetaSchema = z.object({
    carpetaPadre: ObjectIdSchema.nullable(),
});

/** Body para compartir una carpeta con un usuario y un permiso. */
export const CompartirCarpetaSchema = z.object({
    usuarioId: ObjectIdSchema,
    permiso: PermisoSchema,
});

/** Param :id de las rutas de carpeta. */
export const CarpetaIdParamSchema = z.object({
    id: ObjectIdSchema,
});

/** Query para listar (filtrar por padre y pedir compartidas). */
export const ListarCarpetasQuerySchema = z.object({
    carpetaPadre: z
        .union([ObjectIdSchema, z.literal('null')])
        .optional()
        .transform((v) => (v === 'null' ? null : v)),
    incluirCompartidas: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
});

export type CrearCarpetaDTO = z.infer<typeof CrearCarpetaSchema>;
export type RenombrarCarpetaDTO = z.infer<typeof RenombrarCarpetaSchema>;
export type MoverCarpetaDTO = z.infer<typeof MoverCarpetaSchema>;
export type CompartirCarpetaDTO = z.infer<typeof CompartirCarpetaSchema>;
export type ListarCarpetasQuery = z.infer<typeof ListarCarpetasQuerySchema>;
