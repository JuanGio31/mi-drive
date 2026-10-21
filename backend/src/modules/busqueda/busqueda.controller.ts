import { Request, Response } from 'express';
import { BusquedaService } from './busqueda.service';
import { HttpError } from '../../shared/errors/http-error';

/** Controlador HTTP de búsqueda global de archivos y carpetas. */
export class BusquedaController {
    constructor(private readonly busquedaService: BusquedaService) {}

    /** GET /api/buscar?q=texto → archivos y carpetas que coinciden. */
    buscar = async (req: Request, res: Response): Promise<void> => {
        if (!req.user) throw HttpError.unauthorized();

        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        if (!q) throw HttpError.badRequest('Falta el término de búsqueda');

        const limite = Number(req.query.limite) || undefined;

        res.json(
            await this.busquedaService.buscar(req.user.id, q, limite),
        );
    };
}
