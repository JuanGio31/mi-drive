import { HttpError } from '../errors/http-error';
import { Rol } from '../types/enums';
import { NextFunction, Request, Response } from 'express';

export const authorize = (...rolesPermitidos: Rol[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            next(HttpError.unauthorized('No autenticado'));
            return;
        }

        if (!rolesPermitidos.includes(req.user.rol)) {
            next(HttpError.forbidden('No autorizado'));
            return;
        }

        next();
    };
};
