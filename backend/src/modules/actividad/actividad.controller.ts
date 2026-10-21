import { Request, Response } from 'express';
import { ActividadService } from './actividad.service';
import { HttpError } from '../../shared/errors/http-error';
import { TipoRecurso } from '../../shared/types/enums';

/** Controlador HTTP de actividad: historial propio, global y por recurso. */
export class ActividadController {
    constructor(private readonly actividadService: ActividadService) {}

    /** Devuelve el ID del usuario autenticado o lanza `401`. */
    private getUsuarioId(req: Request): string {
        if (!req.user) throw HttpError.unauthorized();
        return req.user.id;
    }

    /** Historial del usuario autenticado. */
    miHistorial = async (req: Request, res: Response): Promise<void> => {
        const filtros = { ...req.query, usuarioId: this.getUsuarioId(req) };
        const actividades = await this.actividadService.listar(filtros);
        res.json(actividades);
    };

    /** Historial global paginado (solo admin). */
    listar = async (req: Request, res: Response): Promise<void> => {
        res.json(await this.actividadService.listarPaginado(req.query));
    };

    /** Historial de un recurso; el servicio valida que el usuario pueda verlo. */
    listarPorRecurso = async (req: Request, res: Response): Promise<void> => {
        if (!req.user) throw HttpError.unauthorized();
        const actividades = await this.actividadService.listarPorRecurso(
            req.params.tipo as TipoRecurso,
            req.params.id as string,
            req.user.id,
            req.user.rol,
        );
        res.json(actividades);
    };
}
