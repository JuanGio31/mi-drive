import { Types } from 'mongoose';
import { IActividadRepository } from './actividad.repository';
import { FiltrosActividad } from './actividad.dto';
import { AccionActividad, TipoRecurso } from '../../shared/types/enums';
import { IUsuarioRepository } from '../usuario/usuario.repository';
import { IActividad } from './actividad.model';

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

export class ActividadService {
    constructor(
        private readonly actividadRepository: IActividadRepository,
        private readonly usuarioRepository: IUsuarioRepository,
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
                    console.warn(
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
            console.error('[Error] Error al registrar actividad:', error);
        }
    }

    async listar(filtros: FiltrosActividad): Promise<IActividad[]> {
        return this.actividadRepository.listar(filtros);
    }

    async listarPorRecurso(
        recursoTipo: string,
        recursoId: string,
    ): Promise<IActividad[]> {
        return this.actividadRepository.listarPorRecurso(
            recursoTipo,
            recursoId,
        );
    }

    async contarPorAccion(filtros: FiltrosActividad) {
        return this.actividadRepository.contarPorAccion(filtros);
    }

    async contarPorPeriodo(
        filtros: FiltrosActividad,
        unidad: 'dia' | 'mes' | 'año',
    ) {
        return this.actividadRepository.contarPorPeriodo(filtros, unidad);
    }

    async archivosConMasOperaciones(limite = 10) {
        return this.actividadRepository.archivosConMasOperaciones(limite);
    }
}
