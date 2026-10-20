import { Request, Response, NextFunction } from 'express';
import { ReporteService } from './reporte.service';
import { HttpError } from '../../shared/errors/http-error';
import { Rol } from '../../shared/types/enums';

export class ReporteController {
    constructor(private readonly reporteService: ReporteService) {}

    private getUsuarioId(req: Request): string {
        if (!req.user) throw HttpError.unauthorized();
        return req.user.id;
    }

    /** Reporte personal: solo el propio usuario o un administrador. */
    private validarPropioOAdmin(req: Request, usuarioId: string): void {
        if (!req.user) throw HttpError.unauthorized();
        if (
            req.user.id !== usuarioId &&
            req.user.rol !== Rol.Administrador
        ) {
            throw HttpError.forbidden(
                'No tiene permisos para ver este reporte',
            );
        }
    }

    // ============ Dashboard ============

    /** Totales globales de archivos, carpetas, usuarios y comparticiones. */
    resumen = async (
        _req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            res.json(await this.reporteService.resumen());
        } catch (error) {
            next(error);
        }
    };

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
            const usuarioId = req.params.usuarioId as string;
            this.validarPropioOAdmin(req, usuarioId);
            res.json(
                await this.reporteService.recursosCompartidosPorUsuario(
                    usuarioId,
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
            const usuarioId = req.params.usuarioId as string;
            this.validarPropioOAdmin(req, usuarioId);
            res.json(
                await this.reporteService.recursosRecibidosPorUsuario(
                    usuarioId,
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

    /** Conteo global por acción para el panel de reportes (solo admin). */
    operacionesPorTipoGlobal = async (
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
                    undefined,
                    desde,
                    hasta,
                ),
            );
        } catch (error) {
            next(error);
        }
    };

    /** Conteo global por período para el panel de reportes (solo admin). */
    operacionesPorPeriodoGlobal = async (
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
                    undefined,
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
