import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * Asigna un identificador único a cada petición.
 *
 * Se genera siempre en el servidor para evitar valores inyectados por el
 * cliente. El id se devuelve en `X-Request-Id` y se incluye en los errores
 * para poder correlacionarlos con el log técnico.
 */
export const assignRequestId = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    const requestId = randomUUID();

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
};
