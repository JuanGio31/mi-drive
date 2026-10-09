import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/http-error';
import { env } from '../config/env';
import { ZodError } from 'zod/v3';

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    // Manejo de errores
    // Errores de Zod
    if (err instanceof ZodError) {
        res.status(400).json({
            error: 'Datos inválidos',
            detalles: err.errors.map((e) => ({
                campo: e.path.join('.'),
                mensaje: e.message,
            })),
        });
        return;
    }

    // Errores HTTP controlados
    if (err instanceof HttpError) {
        res.status(err.codigoEstado).json({
            error: err.message,
            ...(err.detalles ? { detalles: err.detalles } : {}),
        });
    }

    // Errores de duplicado de MongoDB
    if ((err as any).code === 11000) {
        const campo = Object.keys((err as any).keyPattern || {})[0] || 'campo';
        res.status(409).json({
            error: `El campo ${campo} ya está en uso`,
        });
        return;
    }

    // Errores desconocidos
    console.error('[Error] error desconocido', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        ...(env.NODE_ENV === 'dev' ? { stack: err.stack } : {}),
    });
};
