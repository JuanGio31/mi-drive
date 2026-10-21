import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/http-error';

/**
 * Middleware para rutas no registradas.
 *
 * Genera un `404` con el método y la URL solicitados.
 */
export const notFoundHandler = (
    req: Request,
    _res: Response,
    next: NextFunction,
): void => {
    const ruta = (req.originalUrl || req.url).split('?')[0];
    next(HttpError.notFound(`Ruta no encontrada: ${req.method} ${ruta}`));
};
