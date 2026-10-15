import z from 'zod';

/**
 * Validacion de variables de entorno con zod, si falta una variable de entorno se detiene la app
 */
const EnvSchema = z.object({
    PORT: z.string().default('3000').transform(Number),
    NODE_ENV: z.enum(['dev', 'test', 'production']).default('dev'),
    MONGO_URI: z.string().min(1, 'MONGO_URI es requerido'),
    JWT_SECRET: z
        .string()
        .min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    BCRYPT_ROUNDS: z.string().default('10').transform(Number),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('[Error] Variables de entorno no validas');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
