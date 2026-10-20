import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/http-error';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Rol } from '../types/enums';
import { MongoUsuarioRepository } from '../../modules/usuario/usuario.repository';

interface JwtPayload {
    id: string;
    nombre: string;
    correo: string;
    rol: Rol;
}

const usuarioRepository = new MongoUsuarioRepository();

/**
 * Verifica el JWT y refresca el usuario desde la base de datos. Así un
 * usuario desactivado pierde el acceso de inmediato y los cambios de rol se
 * aplican sin esperar a que caduque el token.
 */
export const authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction,
): Promise<void> => {
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

        const usuario = await usuarioRepository.buscarPorId(payload.id);
        if (!usuario || !usuario.activo) {
            next(
                HttpError.unauthorized(
                    'Usuario desactivado o no encontrado',
                ),
            );
            return;
        }

        req.user = {
            id: usuario._id.toString(),
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
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
