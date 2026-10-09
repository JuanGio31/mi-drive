import { NextFunction, Request, Response } from 'express';
import { UsuarioService } from './usuario.service';

export class UsuarioController {
    constructor(private readonly usuarioService: UsuarioService) {}

    crear = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const usuario = await this.usuarioService.crear(req.body);
            res.status(201).json(usuario);
        } catch (error) {
            next(error);
        }
    };

    listar = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const usuarios = await this.usuarioService.listar(req.query);
            res.json(usuarios);
        } catch (error) {
            next(error);
        }
    };

    buscarPorId = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const usuario = await this.usuarioService.buscarPorId(
                req.params.id,
            );
            res.json(usuario);
        } catch (error) {
            next(error);
        }
    };

    actualizar = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const usuario = await this.usuarioService.actualizar(
                req.params.id,
                req.body,
            );
            res.json(usuario);
        } catch (error) {
            next(error);
        }
    };

    desactivar = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const usuario = await this.usuarioService.desactivar(req.params.id);
            res.status(204).json(usuario);
        } catch (error) {
            next(error);
        }
    };

    reactivar = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const usuario = await this.usuarioService.reactivar(req.params.id);
            res.status(204).json(usuario);
        } catch (error) {
            next(error);
        }
    };
}
