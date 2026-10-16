import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/http-error';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Rol } from '../types/enums';

interface JwtPayload {
    id: string;
    nombre: string;
    correo: string;
    rol: Rol;
}

export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction,
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw HttpError.unauthorized('Token no encontrado');
        }

        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(
            token as string,
            env.JWT_SECRET,
        ) as JwtPayload;

        req.user = {
            id: payload.id,
            nombre: payload.nombre,
            correo: payload.correo,
            rol: payload.rol,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            next(HttpError.unauthorized('Token expirado'));
            return;
        }
        if (error instanceof jwt.JsonWebTokenError) {
            next(HttpError.unauthorized('Token inválido'));
            return;
        }
        next(error);
    }
};
