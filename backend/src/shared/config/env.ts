import z from 'zod/v3';

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

    // CORS: lista de origenes permitidos separados por comas
    CORS_ORIGIN: z
        .string()
        .default('http://localhost:4200')
        .transform((value) =>
            value
                .split(',')
                .map((origin) => origin.trim())
                .filter((origin) => origin.length > 0),
        ),

    // Logs tecnicos: nivel, carpeta, retencion y persistencia en archivo
    LOG_LEVEL: z
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
        .default('info'),
    LOG_DIR: z.string().min(1).default('logs'),
    LOG_MAX_DAYS: z
        .string()
        .default('14')
        .transform(Number)
        .refine(
            (dias) => Number.isInteger(dias) && dias > 0,
            'LOG_MAX_DAYS debe ser un entero positivo',
        ),
    LOG_TO_FILE: z
        .enum(['true', 'false'])
        .default('true')
        .transform((valor) => valor === 'true'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('[Error] Variables de entorno no validas');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
