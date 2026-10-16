// src/shared/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod/v3';
import { env } from '../config/env';

// Comprobación estructural
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

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    // Si ya se enviaron headers, se delega a el siguiente middleware
    if (res.headersSent) {
        return;
    }

    // Errores de Zod
    if (err instanceof ZodError) {
        res.status(400).json({
            error: 'Datos inválidos',
            detalles: err.errors.map((e) => ({
                campo: e.path.join('.'),
                mensaje: e.message,
            })),
        });
        return;
    }

    // HttpError (comprobación estructural)
    if (esHttpError(err)) {
        res.status(err.codigoEstado).json({
            error: err.message,
            ...(err.detalles ? { detalles: err.detalles } : {}),
        });
        return;
    }

    // Duplicado de Mongo
    if ((err as any).code === 11000) {
        const campo = Object.keys((err as any).keyPattern || {})[0] || 'campo';
        res.status(409).json({ error: `El ${campo} ya está registrado` });
        return;
    }

    // Desconocido
    console.error('[Error] Error no manejado:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        ...(env.NODE_ENV === 'dev' ? { stack: err.stack } : {}),
    });
};
