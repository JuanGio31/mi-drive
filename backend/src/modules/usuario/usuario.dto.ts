import z from 'zod/v3';
import { Rol } from '../../shared/types/enums';

const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID no válido');

export const CrearUsuarioSchema = z.object({
    nombre: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(150, 'El nombre debe tener máximo 150 caracteres'),
    correo: z
        .string()
        .min(1, 'El correo es obligatorio')
        .regex(/^\S+@\S+\.\S+$/, 'El correo es inválido')
        .toLowerCase(),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    rol: z.enum([Rol.Administrador, Rol.Usuario]).optional(),
});

export const ActualizarUsuarioSchema = z
    .object({
        nombre: z
            .string()
            .min(2, 'El nombre debe tener al menos 2 caracteres')
            .max(150, 'El nombre debe tener máximo 150 caracteres')
            .optional(),
        correo: z
            .string()
            .min(1, 'El correo es obligatorio')
            .regex(/^\S+@\S+\.\S+$/, 'El correo es inválido')
            .toLowerCase()
            .optional(),
        activo: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Debe proporcionar al menos un campo para actualizar',
    });

export const UsuarioIdParamSchema = z.object({
    id: ObjectIdSchema,
});

export const ListarUsuarioQuerySchema = z.object({
    rol: z.enum([Rol.Administrador, Rol.Usuario]).optional(),
    activo: z
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

// Tipos inferidos de zod
export type CrearUsuarioDTO = z.infer<typeof CrearUsuarioSchema>;
export type ActualizarUsuarioDTO = z.infer<typeof ActualizarUsuarioSchema>;
export type ListarUsuarioQueryDTO = z.infer<typeof ListarUsuarioQuerySchema>;
