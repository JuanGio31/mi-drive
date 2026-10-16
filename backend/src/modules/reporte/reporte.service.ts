import { IReporteRepository } from './reporte.repository';
import { IUsuarioRepository } from '../usuario/usuario.repository';
import { HttpError } from '../../shared/errors/http-error';
import { ActividadService } from '../actividad/actividad.service';
import { RangoFechasDTO, TopLimiteDTO } from './reporte.dto';

export class ReporteService {
    constructor(
        private readonly reporteRepository: IReporteRepository,
        private readonly usuarioRepository: IUsuarioRepository,
        private readonly actividadService: ActividadService,
    ) {}

    // ============ Archivos ============

    async archivosPorTipo() {
        return this.reporteRepository.archivosPorTipo();
    }

    async archivosPorRango(dto: RangoFechasDTO) {
        const desde = dto.desde ? new Date(dto.desde) : undefined;
        const hasta = dto.hasta ? new Date(dto.hasta) : undefined;

        if (desde && hasta && desde > hasta) {
            throw HttpError.badRequest(
                'La fecha "desde" no puede ser posterior a "hasta"',
            );
        }

        return this.reporteRepository.archivosPorRango(desde, hasta);
    }

    async archivosConMasOperaciones(dto: TopLimiteDTO) {
        return this.reporteRepository.archivosConMasOperaciones(dto.limite);
    }

    // ============ Usuarios ============

    async topUsuariosConMasArchivos(dto: TopLimiteDTO) {
        return this.reporteRepository.topUsuariosConMasArchivos(dto.limite);
    }

    async usuariosConMasCompartidos(dto: TopLimiteDTO) {
        return this.reporteRepository.usuariosConMasCompartidos(dto.limite);
    }

    // ============ Compartición ============

    async archivosMasCompartidos(dto: TopLimiteDTO) {
        return this.reporteRepository.archivosMasCompartidos(dto.limite);
    }

    async recursosCompartidosPorUsuario(usuarioId: string) {
        const recursos =
            (await this.reporteRepository.recursosCompartidosPorUsuario(
                usuarioId,
            )) as { archivos: unknown[]; carpetas: unknown[] };

        return {
            usuarioId,
            ...recursos,
        };
    }

    async recursosRecibidosPorUsuario(usuarioId: string) {
        const recursos =
            (await this.reporteRepository.recursosRecibidosPorUsuario(
                usuarioId,
            )) as { archivos: unknown[]; carpetas: unknown[] };

        return {
            usuarioId,
            ...recursos,
        };
    }

    // ============ Actividad (delegado) ============

    async actividadPorUsuarioYRango(
        usuarioId: string,
        desde?: string,
        hasta?: string,
    ) {
        return this.actividadService.listar({
            usuarioId,
            desde,
            hasta,
            limit: 200,
        });
    }

    async operacionesPorTipo(
        usuarioId?: string,
        desde?: string,
        hasta?: string,
    ) {
        return this.actividadService.contarPorAccion({
            usuarioId,
            desde,
            hasta,
        });
    }

    async operacionesPorPeriodo(
        unidad: 'dia' | 'mes' | 'año',
        usuarioId?: string,
        desde?: string,
        hasta?: string,
    ) {
        return this.actividadService.contarPorPeriodo(
            { usuarioId, desde, hasta },
            unidad,
        );
    }
}
