import { Request, Response } from 'express';
import { ReporteService } from './reporte.service';
import { HttpError } from '../../shared/errors/http-error';
import { Rol } from '../../shared/types/enums';
import { PaginacionDTO, RangoPaginadoDTO, TopLimiteDTO } from './reporte.dto';

/** Controlador HTTP de reportes personales y administrativos. */
export class ReporteController {
    constructor(private readonly reporteService: ReporteService) {}

    /** Devuelve el ID del usuario autenticado o lanza `401`. */
    private getUsuarioId(req: Request): string {
        if (!req.user) throw HttpError.unauthorized();
        return req.user.id;
    }

    /**
     * Recupera el query ya validado. `validateQuery` reemplaza `req.query`
     * con los valores convertidos por Zod, pero Express lo tipa como `ParsedQs`.
     */
    private query<T>(req: Request): T {
        return req.query as unknown as T;
    }

    /** Reporte personal: solo el propio usuario o un administrador. */
    private validarPropioOAdmin(req: Request, usuarioId: string): void {
        if (!req.user) throw HttpError.unauthorized();
        if (req.user.id !== usuarioId && req.user.rol !== Rol.Administrador) {
            throw HttpError.forbidden(
                'No tiene permisos para ver este reporte',
            );
        }
    }

    // Dashboard

    /** Totales globales de archivos, carpetas, usuarios y comparticiones.
     * solo administradores
     */
    resumen = async (_req: Request, res: Response): Promise<void> => {
        res.json(await this.reporteService.resumen());
    };

    // Archivos

    /** Devuelve la distribución global de archivos por tipo.
     * solo administradores
     */
    archivosPorTipo = async (_req: Request, res: Response): Promise<void> => {
        res.json(await this.reporteService.archivosPorTipo());
    };

    /** Cuenta archivos creados en un rango de fechas.
     * solo administradores
     */
    archivosPorRango = async (req: Request, res: Response): Promise<void> => {
        res.json(
            await this.reporteService.archivosPorRango(
                this.query<RangoPaginadoDTO>(req),
            ),
        );
    };

    /** Lista archivos sin compartición directa ni heredada.
     * solo administradores
     */
    archivosNuncaCompartidos = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        res.json(
            await this.reporteService.archivosNuncaCompartidos(
                this.query<PaginacionDTO>(req),
            ),
        );
    };

    /** Lista los archivos con más operaciones de actividad.
     * solo administradores
     */
    archivosConMasOperaciones = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        res.json(
            await this.reporteService.archivosConMasOperaciones(
                this.query<TopLimiteDTO>(req),
            ),
        );
    };

    // Usuarios

    /** Lista los usuarios con más archivos.
     * solo administradores
     */
    topUsuarios = async (req: Request, res: Response): Promise<void> => {
        res.json(
            await this.reporteService.topUsuariosConMasArchivos(
                this.query<TopLimiteDTO>(req),
            ),
        );
    };

    /** Lista los usuarios con más recursos compartidos.
     * solo administradores
     */
    usuariosMasCompartidos = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        res.json(
            await this.reporteService.usuariosConMasCompartidos(
                this.query<TopLimiteDTO>(req),
            ),
        );
    };

    // Compartidos

    /** Lista los archivos más compartidos.
     * solo administradores
     */
    archivosMasCompartidos = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        res.json(
            await this.reporteService.archivosMasCompartidos(
                this.query<TopLimiteDTO>(req),
            ),
        );
    };

    /** Carpetas con más archivos directos y totales del subárbol.
     * solo administradores
     */
    carpetasMasArchivos = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        res.json(
            await this.reporteService.carpetasConMasArchivos(
                this.query<TopLimiteDTO>(req),
            ),
        );
    };

    /**
     * Recursos que el usuario compartió; permite consultar lo propio o
     * cualquier usuario si es administrador.
     */
    recursosCompartidosPorUsuario = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const usuarioId = req.params.usuarioId as string;
        this.validarPropioOAdmin(req, usuarioId);
        res.json(
            await this.reporteService.recursosCompartidosPorUsuario(usuarioId),
        );
    };

    /**
     * Recursos que el usuario recibió; permite consultar lo propio o
     * cualquier usuario si es administrador.
     */
    recursosRecibidosPorUsuario = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const usuarioId = req.params.usuarioId as string;
        this.validarPropioOAdmin(req, usuarioId);
        res.json(
            await this.reporteService.recursosRecibidosPorUsuario(usuarioId),
        );
    };

    // Actividad

    /** Actividad del usuario autenticado en un rango de fechas. */
    miActividadPorRango = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
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
    };

    /** Conteo de operaciones del usuario autenticado por tipo y rango. */
    operacionesPorTipo = async (req: Request, res: Response): Promise<void> => {
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
    };

    /** Conteo global por acción para el panel de reportes.
     * solo administradores
     */
    operacionesPorTipoGlobal = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
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
    };

    /** Conteo global por período para el panel de reportes.
     * solo administradores
     */
    operacionesPorPeriodoGlobal = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
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
    };

    /** Conteo de operaciones del usuario autenticado agrupadas por día, mes o año. */
    operacionesPorPeriodo = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
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
    };
}
