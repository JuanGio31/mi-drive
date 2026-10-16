import { Request, Response, NextFunction } from 'express';
import { ReporteService } from './reporte.service';
import { HttpError } from '../../shared/errors/http-error';

export class ReporteController {
    constructor(private readonly reporteService: ReporteService) {}

    private getUsuarioId(req: Request): string {
        if (!req.user) throw HttpError.unauthorized();
        return req.user.id;
    }

    // ============ Archivos ============

    archivosPorTipo = async (
        _req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            res.json(await this.reporteService.archivosPorTipo());
        } catch (error) {
            next(error);
        }
    };

    archivosPorRango = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            res.json(await this.reporteService.archivosPorRango(req.query));
        } catch (error) {
            next(error);
        }
    };

    archivosConMasOperaciones = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { limite } = req.query;
            res.json(
                await this.reporteService.archivosConMasOperaciones({
                    limite: parseInt(limite as string, 10),
                }),
            );
        } catch (error) {
            next(error);
        }
    };

    // ============ Usuarios ============

    topUsuarios = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { limite } = req.query;
            res.json(
                await this.reporteService.topUsuariosConMasArchivos({
                    limite: parseInt(limite as string, 10),
                }),
            );
        } catch (error) {
            next(error);
        }
    };

    usuariosMasCompartidos = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { limite } = req.query;
            res.json(
                await this.reporteService.usuariosConMasCompartidos({
                    limite: parseInt(limite as string, 10),
                }),
            );
        } catch (error) {
            next(error);
        }
    };

    // ============ Compartición ============

    archivosMasCompartidos = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { limite } = req.query;
            res.json(
                await this.reporteService.archivosMasCompartidos({
                    limite: parseInt(limite as string, 10),
                }),
            );
        } catch (error) {
            next(error);
        }
    };

    recursosCompartidosPorUsuario = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            res.json(
                await this.reporteService.recursosCompartidosPorUsuario(
                    req.params.usuarioId as string,
                ),
            );
        } catch (error) {
            next(error);
        }
    };

    recursosRecibidosPorUsuario = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            res.json(
                await this.reporteService.recursosRecibidosPorUsuario(
                    req.params.usuarioId as string,
                ),
            );
        } catch (error) {
            next(error);
        }
    };

    // ============ Actividad ============

    miActividadPorRango = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { desde, hasta } = req.query as {
                desde?: string;
                hasta?: string;
            };
            res.json(
                await this.reporteService.actividadPorUsuarioYRango(
                    this.getUsuarioId(req),
                    desde,
                    hasta,
                ),
            );
        } catch (error) {
            next(error);
        }
    };

    operacionesPorTipo = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { desde, hasta } = req.query as {
                desde?: string;
                hasta?: string;
            };
            res.json(
                await this.reporteService.operacionesPorTipo(
                    this.getUsuarioId(req),
                    desde,
                    hasta,
                ),
            );
        } catch (error) {
            next(error);
        }
    };

    operacionesPorPeriodo = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const unidad = (req.query.unidad as 'dia' | 'mes' | 'año') ?? 'dia';
            const { desde, hasta } = req.query as {
                desde?: string;
                hasta?: string;
            };
            res.json(
                await this.reporteService.operacionesPorPeriodo(
                    unidad,
                    this.getUsuarioId(req),
                    desde,
                    hasta,
                ),
            );
        } catch (error) {
            next(error);
        }
    };
}
