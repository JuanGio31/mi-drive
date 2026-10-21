import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod/v3';
import { env } from '../config/env';
import { logger } from '../logger/logger';

/**
 * Comprueba la forma de un `HttpError` sin depender de `instanceof`.
 */
const esHttpError = (
    err: unknown,
): err is {
    name: string;
    message: string;
    codigoEstado: number;
    detalles?: unknown;
} => {
    return (
        typeof err === 'object' &&
        err !== null &&
        (err as any).name === 'HttpError' &&
        typeof (err as any).codigoEstado === 'number'
    );
};

/**
 * Middleware central de errores.
 *
 * Traduce errores de CORS, Zod, `HttpError` y duplicados de MongoDB a
 * respuestas JSON consistentes. Los errores desconocidos responden `500`.
 * En desarrollo, también se incluye el stack del error. Debe registrarse
 * después de las rutas y del resto de middlewares.
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    const requestId = req.requestId ?? 'sin-request-id';
    const contexto = {
        requestId,
        metodo: req.method,
        ruta: (req.originalUrl || req.url)?.split('?')[0],
        userId: req.user?.id,
    };

    // La respuesta ya inició: no se puede enviar otra, pero sí registrar.
    if (res.headersSent) {
        logger.error(
            { ...contexto, err },
            'Error después de enviar la respuesta',
        );
        return;
    }

    // El middleware de CORS reporta el origen no permitido como un Error.
    if (err.message?.startsWith('Origen no permitido por CORS')) {
        logger.warn({ ...contexto, statusCode: 403 }, err.message);
        res.status(403).json({ error: err.message, requestId });
        return;
    }

    // Body-parser reporta JSON mal formado con `type` y `status` 400.
    if ((err as any).type === 'entity.parse.failed') {
        logger.warn(
            { ...contexto, statusCode: 400 },
            'Solicitud con JSON inválido',
        );
        res.status(400).json({
            error: 'Solicitud JSON inválida',
            requestId,
        });
        return;
    }

    // Validaciones que no pasaron por los middlewares de validación.
    if (err instanceof ZodError) {
        const detalles = err.errors.map((e) => ({
            campo: e.path.join('.'),
            mensaje: e.message,
        }));
        logger.warn(
            { ...contexto, statusCode: 400, detalles },
            'Datos inválidos',
        );
        res.status(400).json({
            error: 'Datos inválidos',
            detalles,
            requestId,
        });
        return;
    }

    // Error controlado por la aplicación.
    if (esHttpError(err)) {
        if (err.codigoEstado >= 500) {
            logger.error(
                { ...contexto, statusCode: err.codigoEstado, err },
                err.message,
            );
        } else {
            logger.warn(
                {
                    ...contexto,
                    statusCode: err.codigoEstado,
                    ...(err.detalles ? { detalles: err.detalles } : {}),
                },
                err.message,
            );
        }

        res.status(err.codigoEstado).json({
            error: err.message,
            ...(err.detalles ? { detalles: err.detalles } : {}),
            requestId,
        });
        return;
    }

    // Índice único de MongoDB, por ejemplo un correo duplicado.
    if ((err as any).code === 11000) {
        const campo = Object.keys((err as any).keyPattern || {})[0] || 'campo';
        const mensaje = `El ${campo} ya está registrado`;
        logger.warn({ ...contexto, statusCode: 409, campo }, mensaje);
        res.status(409).json({ error: mensaje, requestId });
        return;
    }

    // Error no controlado: se registra y se oculta el detalle en producción.
    logger.error({ ...contexto, statusCode: 500, err }, 'Error no manejado');
    res.status(500).json({
        error: 'Error interno del servidor',
        requestId,
        ...(env.NODE_ENV === 'dev' ? { stack: err.stack } : {}),
    });
};
