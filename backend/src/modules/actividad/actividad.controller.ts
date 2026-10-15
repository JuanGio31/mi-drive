import { Request, Response, NextFunction } from 'express';
import { ActividadService } from './actividad.service';
import { HttpError } from '../../shared/errors/http-error';

export class ActividadController {
    constructor(private readonly actividadService: ActividadService) {}

    private getUsuarioId(req: Request): string {
        if (!req.user) throw HttpError.unauthorized();
        return req.user.id;
    }

    /** Historial del usuario autenticado */
    miHistorial = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const filtros = { ...req.query, usuarioId: this.getUsuarioId(req) };
            const actividades = await this.actividadService.listar(filtros);
            res.json(actividades);
        } catch (error) {
            next(error);
        }
    };

    /** Historial global (solo admin) */
    listar = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const actividades = await this.actividadService.listar(req.query);
            res.json(actividades);
        } catch (error) {
            next(error);
        }
    };

    listarPorRecurso = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const actividades = await this.actividadService.listarPorRecurso(
                req.params.tipo as string,
                req.params.id as string,
            );
            res.json(actividades);
        } catch (error) {
            next(error);
        }
    };
}
