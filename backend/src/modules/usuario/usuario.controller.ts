import { NextFunction, Request, Response } from 'express';
import { UsuarioService } from './usuario.service';
import { HttpError } from '../../shared/errors/http-error';

export class UsuarioController {
    constructor(private readonly usuarioService: UsuarioService) {}

    private getSolicitante(req: Request): { id: string; rol: string } {
        if (!req.user) throw HttpError.unauthorized();
        return { id: req.user.id, rol: req.user.rol };
    }

    crear = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id } = this.getSolicitante(req);
            const usuario = await this.usuarioService.crear(req.body, id);
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
            const { id } = this.getSolicitante(req);
            const usuarios = await this.usuarioService.listar(req.query, id);
            res.json(usuarios);
        } catch (error) {
            next(error);
        }
    };

    /** Usuarios activos (id, nombre, correo): para compartir y resolver nombres. */
    listarDirectorio = async (
        _req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const usuarios = await this.usuarioService.directorio();
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
            const solicitante = this.getSolicitante(req);
            const usuario = await this.usuarioService.buscarPorId(
                req.params.id as string,
                solicitante.id,
                solicitante.rol,
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
            const solicitante = this.getSolicitante(req);
            const usuario = await this.usuarioService.actualizar(
                req.params.id as string,
                req.body,
                solicitante.id,
                solicitante.rol,
            );
            res.json(usuario);
        } catch (error) {
            next(error);
        }
    };

    /** Cambia la contraseña del propio usuario autenticado. */
    cambiarPassword = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { id: solicitanteId } = this.getSolicitante(req);
            await this.usuarioService.cambiarPassword(
                req.params.id as string,
                req.body,
                solicitanteId,
            );
            res.json({ mensaje: 'Contraseña actualizada correctamente' });
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
            const { id: ejecutorId } = this.getSolicitante(req);
            const usuario = await this.usuarioService.desactivar(
                req.params.id as string,
                ejecutorId,
            );
            res.json(usuario);
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
            const { id: ejecutorId } = this.getSolicitante(req);
            const usuario = await this.usuarioService.reactivar(
                req.params.id as string,
                ejecutorId,
            );
            res.json(usuario);
        } catch (error) {
            next(error);
        }
    };
}
