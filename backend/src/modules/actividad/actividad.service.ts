import { Types } from 'mongoose';
import { IActividadRepository } from './actividad.repository';
import { FiltrosActividad } from './actividad.dto';
import { AccionActividad, Rol, TipoRecurso } from '../../shared/types/enums';
import { IUsuarioRepository } from '../usuario/usuario.repository';
import { IActividad } from './actividad.model';
import { HttpError } from '../../shared/errors/http-error';
import { logger } from '../../shared/logger/logger';
import { ArchivoPermisosService } from '../archivo/archivo-permisos.service';
import { CarpetaPermisosService } from '../carpeta/carpeta-permisos.service';

export interface RegistrarActividadParams {
    usuarioId: string;
    usuarioNombre?: string;
    usuarioCorreo?: string;
    accion: AccionActividad;
    recursoTipo: TipoRecurso;
    recursoId?: string | null;
    recursoNombre?: string | null;
    metadata?: Record<string, unknown>;
}

/**
 * Servicio de auditoría de negocio. Registra operaciones de forma best-effort
 * y expone consultas con control de acceso sobre el historial.
 */
export class ActividadService {
    constructor(
        private readonly actividadRepository: IActividadRepository,
        private readonly usuarioRepository: IUsuarioRepository,
        private readonly archivoPermisosService: ArchivoPermisosService,
        private readonly carpetaPermisosService: CarpetaPermisosService,
    ) {}

    /**
     * Registra una actividad en el historial. Best-effort: si falla,
     * se loguea el error pero no se propaga, para no romper la operación principal.
     */
    async registrar(params: RegistrarActividadParams): Promise<void> {
        try {
            let nombre = params.usuarioNombre;
            let correo = params.usuarioCorreo;

            if (!nombre || !correo) {
                const usuario = await this.usuarioRepository.buscarPorId(
                    params.usuarioId,
                );
                if (!usuario) {
                    logger.warn(
                        {
                            usuarioId: params.usuarioId,
                            accion: params.accion,
                            recursoTipo: params.recursoTipo,
                        },
                        'No se pudo registrar actividad: usuario no encontrado',
                    );
                    return;
                }
                nombre = usuario.nombre;
                correo = usuario.correo;
            }

            await this.actividadRepository.crear({
                usuario: new Types.ObjectId(params.usuarioId),
                usuarioNombre: nombre,
                usuarioCorreo: correo,
                accion: params.accion,
                recursoTipo: params.recursoTipo,
                recursoId: params.recursoId
                    ? new Types.ObjectId(params.recursoId)
                    : null,
                recursoNombre: params.recursoNombre ?? null,
                metadata: params.metadata ?? {},
            });
        } catch (error) {
            // La auditoría no debe romper la operación principal
            logger.error(
                {
                    err: error,
                    usuarioId: params.usuarioId,
                    accion: params.accion,
                    recursoTipo: params.recursoTipo,
                    recursoId: params.recursoId,
                },
                'Error al registrar actividad',
            );
        }
    }

    /** Lista actividades filtradas sin paginación explícita (usa la del filtro). */
    async listar(filtros: FiltrosActividad): Promise<IActividad[]> {
        return this.actividadRepository.listar(filtros);
    }

    /** Lista actividades con total para la tabla paginada del administrador. */
    async listarPaginado(filtros: FiltrosActividad): Promise<{
        actividades: IActividad[];
        total: number;
        page: number;
        limit: number;
    }> {
        const page = filtros.page ?? 1;
        const limit = filtros.limit ?? 50;
        const [actividades, total] = await Promise.all([
            this.actividadRepository.listar(filtros),
            this.actividadRepository.contar(filtros),
        ]);

        return { actividades, total, page, limit };
    }

    /**
     * Historial de un recurso. Valida el acceso al recurso antes de devolver
     * nada: archivos/carpetas usan los permisos efectivos; los usuarios solo
     * son visibles para sí mismos o un administrador.
     */
    async listarPorRecurso(
        recursoTipo: TipoRecurso,
        recursoId: string,
        usuarioId: string,
        rolUsuario: Rol,
    ): Promise<IActividad[]> {
        await this.validarAccesoRecurso(
            recursoTipo,
            recursoId,
            usuarioId,
            rolUsuario,
        );
        return this.actividadRepository.listarPorRecurso(
            recursoTipo,
            recursoId,
        );
    }

    /** Lanza 404 cuando el recurso no existe o el usuario no puede verlo. */
    private async validarAccesoRecurso(
        recursoTipo: TipoRecurso,
        recursoId: string,
        usuarioId: string,
        rolUsuario: Rol,
    ): Promise<void> {
        switch (recursoTipo) {
            case TipoRecurso.Archivo:
                await this.archivoPermisosService.obtenerConAcceso(
                    recursoId,
                    usuarioId,
                );
                return;
            case TipoRecurso.Carpeta:
                await this.carpetaPermisosService.obtenerConAcceso(
                    recursoId,
                    usuarioId,
                );
                return;
            case TipoRecurso.Usuario:
                if (
                    recursoId !== usuarioId &&
                    rolUsuario !== Rol.Administrador
                ) {
                    throw HttpError.notFound('Recurso no encontrado');
                }
                return;
            case TipoRecurso.Sistema:
                if (rolUsuario !== Rol.Administrador) {
                    throw HttpError.notFound('Recurso no encontrado');
                }
                return;
            default:
                throw HttpError.badRequest('Tipo de recurso no válido');
        }
    }

    /** Cuenta actividades por acción según los filtros recibidos. */
    async contarPorAccion(filtros: FiltrosActividad) {
        return this.actividadRepository.contarPorAccion(filtros);
    }

    /** Cuenta actividades por día, mes o año según los filtros recibidos. */
    async contarPorPeriodo(
        filtros: FiltrosActividad,
        unidad: 'dia' | 'mes' | 'año',
    ) {
        return this.actividadRepository.contarPorPeriodo(filtros, unidad);
    }
}
