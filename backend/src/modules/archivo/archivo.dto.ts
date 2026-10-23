import { z } from 'zod/v3';
import { ExtensionArchivo, NivelPermiso } from '../../shared/types/enums';

const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID no válido');

export const TipoArchivoSchema = z.enum(
    Object.values(ExtensionArchivo) as [string, ...string[]],
);

export const PermisoArchivoSchema = z.enum(
    Object.values(NivelPermiso) as [string, ...string[]],
);

export const CrearArchivoSchema = z.object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(300),
    tipo: TipoArchivoSchema,
    contenido: z
        .string()
        .max(10_000_000, 'El archivo es demasiado grande')
        .default(''),
    carpetaPadre: ObjectIdSchema.nullable().optional(),
});

export const ActualizarContenidoSchema = z.object({
    contenido: z
        .string()
        .max(10_000_000, 'El archivo es demasiado grande')
        .default(''),
});

export const RenombrarArchivoSchema = z.object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(300),
});

export const MoverArchivoSchema = z.object({
    carpetaPadre: ObjectIdSchema.nullable(),
});

export const CompartirArchivoSchema = z.object({
    usuarioId: ObjectIdSchema,
    permiso: PermisoArchivoSchema,
});

export const DestacarArchivoSchema = z.object({
    destacado: z.boolean(),
});

export const ArchivoIdParamSchema = z.object({ id: ObjectIdSchema });

export const ArchivoUsuarioParamSchema = z.object({
    id: ObjectIdSchema,
    usuarioId: ObjectIdSchema,
});

export const ListarArchivosQuerySchema = z.object({
    carpetaPadre: z
        .union([ObjectIdSchema, z.literal('null')])
        .optional()
        .transform((v) => (v === 'null' ? null : v)),
    tipo: TipoArchivoSchema.optional(),
    busqueda: z.string().trim().min(1).max(100).optional(),
    incluirCompartidas: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    incluirContenido: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    page: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive())
        .optional(),
    limit: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive().max(100))
        .optional(),
});

export type CrearArchivoDTO = z.infer<typeof CrearArchivoSchema>;
export type ActualizarContenidoDTO = z.infer<typeof ActualizarContenidoSchema>;
export type RenombrarArchivoDTO = z.infer<typeof RenombrarArchivoSchema>;
export type MoverArchivoDTO = z.infer<typeof MoverArchivoSchema>;
export type CompartirArchivoDTO = z.infer<typeof CompartirArchivoSchema>;
export type DestacarArchivoDTO = z.infer<typeof DestacarArchivoSchema>;
export type ArchivoIdParamDTO = z.infer<typeof ArchivoIdParamSchema>;
export type ArchivoUsuarioParamDTO = z.infer<typeof ArchivoUsuarioParamSchema>;
export type ListarArchivosQueryDTO = z.infer<typeof ListarArchivosQuerySchema>;
