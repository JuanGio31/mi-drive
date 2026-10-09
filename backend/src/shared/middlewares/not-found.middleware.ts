import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/http-error';

export const notFoundHandler = (
    req: Request,
    _res: Response,
    next: NextFunction,
): void => {
    next(HttpError.notFound(`Ruta no encontrada: ${req.method} ${req.url}`));
};
