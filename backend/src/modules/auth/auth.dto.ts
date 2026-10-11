import z from 'zod/v3';

export const LoginSchema = z.object({
    correo: z
        .string()
        .trim()
        .min(1, 'El correo es obligatorio')
        .email('El correo es inválido')
        .toLowerCase(),
    password: z.string().trim().min(1, 'La contraseña es obligatoria'),
});

export const RegistroSchema = z.object({
    nombre: z
        .string()
        .trim()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(150, 'El nombre debe tener máximo 150 caracteres'),
    correo: z
        .string()
        .trim()
        .min(1, 'El correo es obligatorio')
        .email('El correo es inválido')
        .toLowerCase(),
    password: z
        .string()
        .trim()
        .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginDTO = z.infer<typeof LoginSchema>;
export type RegistroDTO = z.infer<typeof RegistroSchema>;
