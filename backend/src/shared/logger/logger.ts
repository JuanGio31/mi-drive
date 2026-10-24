import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import pino, { Logger, LoggerOptions } from 'pino';
import { env } from '../config/env';

/**
 * Logger técnico de la API.
 *
 * Se separa de la colección de actividad: la actividad es auditoría de
 * negocio y este logger guarda diagnóstico operativo. En desarrollo también
 * se imprime en consola de forma legible; en producción sale como JSON.
 * Los archivos se rotan diariamente, por tamaño y con retención limitada.
 */
const rutaLogs = resolve(process.cwd(), env.LOG_DIR);

if (env.LOG_TO_FILE) {
    mkdirSync(rutaLogs, { recursive: true, mode: 0o750 });
}

const opcionesBase: LoggerOptions = {
    level: env.LOG_LEVEL,
    base: {
        servicio: 'dms-api',
        entorno: env.NODE_ENV,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: {
        // Evita volcar propiedades arbitrarias del error, como `body` de
        // body-parser, que podría incluir contraseñas o contenido sensible.
        err: (error: Error & { code?: unknown; statusCode?: number }) => ({
            type: error.name,
            message: error.message,
            stack: error.stack,
            ...(error.code ? { code: error.code } : {}),
            ...(error.statusCode ? { statusCode: error.statusCode } : {}),
        }),
    },
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
            'password',
            'passwordActual',
            'passwordNueva',
            'passwordConfirmacion',
            'token',
            'accessToken',
            'refreshToken',
            '*.password',
            '*.passwordActual',
            '*.passwordNueva',
            '*.passwordConfirmacion',
            '*.token',
            '*.accessToken',
            '*.refreshToken',
        ],
        censor: '[Redactado]',
    },
};

const destinos: pino.TransportTargetOptions[] = [];

if (env.LOG_TO_FILE) {
    destinos.push({
        target: 'pino-roll',
        options: {
            file: join(rutaLogs, 'app.log'),
            frequency: 'daily',
            size: '10m',
            dateFormat: 'yyyy-MM-dd',
            limit: { count: env.LOG_MAX_DAYS },
            mkdir: true,
            mode: 0o640,
        },
    });
}

if (env.NODE_ENV === 'dev') {
    destinos.push({
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname,servicio,entorno',
        },
    });
} else {
    destinos.push({
        target: 'pino/file',
        options: { destination: 1 },
    });
}

export const logger: Logger = pino(
    opcionesBase,
    pino.transport({ targets: destinos }),
);

/**
 * Espera a que los transports asíncronos escriban antes de terminar el
 * proceso. Se usa en el apagado graceful y en errores fatales.
 */
export const flushLogger = (): Promise<void> =>
    new Promise((resolveFlush) => {
        let finalizado = false;
        let temporizador: NodeJS.Timeout;
        /** Resuelve la promesa una sola vez y cancela el timeout de respaldo. */
        const finalizar = (): void => {
            if (finalizado) return;
            finalizado = true;
            clearTimeout(temporizador);
            resolveFlush();
        };

        temporizador = setTimeout(finalizar, 1_000);
        logger.flush(finalizar);
    });
