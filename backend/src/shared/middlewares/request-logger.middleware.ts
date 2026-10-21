import { randomUUID } from 'node:crypto';
import { Request } from 'express';
import pinoHttp from 'pino-http';
import { logger } from '../logger/logger';

/** Datos de correlación que se agregan a cada log de petición. */
const contextoPeticion = (req: unknown): Record<string, string> => {
    const solicitud = req as Request;
    return {
        requestId: solicitud.requestId ?? 'sin-request-id',
        ...(solicitud.user?.id ? { userId: solicitud.user.id } : {}),
    };
};

/** Ruta original sin query, incluso después de montar el router. */
const rutaPeticion = (req: unknown): string => {
    const solicitud = req as Request;
    return (solicitud.originalUrl || solicitud.url || '').split('?')[0] ?? '';
};

/**
 * Registra cada petición HTTP al finalizar la respuesta.
 *
 * Solo guarda metadatos: método, ruta sin query, estado, duración, IP,
 * user-agent, usuario autenticado y request id. Nunca registra body,
 * cabeceras de autenticación, tokens ni contenido de archivos.
 */
export const requestLogger = pinoHttp({
    logger,
    genReqId: (req) => (req as Request).requestId ?? randomUUID(),
    customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },
    customSuccessObject: (req, _res, val) => ({
        ...val,
        ...contextoPeticion(req),
    }),
    customErrorObject: (req, _res, _err, val) => ({
        ...val,
        ...contextoPeticion(req),
    }),
    customSuccessMessage: (req) => `${req.method} ${rutaPeticion(req)}`,
    customErrorMessage: (req, res) =>
        `${req.method} ${rutaPeticion(req)} → ${res.statusCode}`,
    serializers: {
        req: (req) => ({
            method: req.method,
            url: req.url?.split('?')[0],
            remoteAddress: req.remoteAddress,
            userAgent: req.headers?.['user-agent'],
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
    },
});
