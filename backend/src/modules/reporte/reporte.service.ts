import { IReporteRepository } from './reporte.repository';
import { HttpError } from '../../shared/errors/http-error';
import { ActividadService } from '../actividad/actividad.service';
import { PaginacionDTO, RangoPaginadoDTO, TopLimiteDTO } from './reporte.dto';

/**
 * Capa de aplicación de los reportes. Valida rangos y delega las consultas de
 * solo lectura al repositorio; los reportes de actividad se resuelven con el
 * servicio de actividad para reutilizar sus filtros.
 */
export class ReporteService {
    constructor(
        private readonly reporteRepository: IReporteRepository,
        private readonly actividadService: ActividadService,
    ) {}

    // Dashboard

    /** Totales globales de archivos, carpetas, usuarios y comparticiones. */
    async resumen() {
        return this.reporteRepository.resumen();
    }

    // Archivos

    /** Distribución de archivos activos por extensión. */
    async archivosPorTipo() {
        return this.reporteRepository.archivosPorTipo();
    }

    /**
     * Convierte el rango ISO a fechas y rechaza rangos invertidos antes de
     * consultar. Devuelve el listado paginado de archivos creados.
     */
    async archivosPorRango(dto: RangoPaginadoDTO) {
        const desde = dto.desde ? new Date(dto.desde) : undefined;
        const hasta = dto.hasta ? new Date(dto.hasta) : undefined;

        if (desde && hasta && desde > hasta) {
            throw HttpError.badRequest(
                'La fecha "desde" no puede ser posterior a "hasta"',
            );
        }

        return this.reporteRepository.archivosPorRango(
            desde,
            hasta,
            dto.page,
            dto.limit,
        );
    }

    /** Archivos activos sin permisos directos ni heredados. */
    async archivosNuncaCompartidos(dto: PaginacionDTO) {
        return this.reporteRepository.archivosNuncaCompartidos(
            dto.page,
            dto.limit,
        );
    }

    /** Carpetas con más archivos directos y totales del subárbol. */
    async carpetasConMasArchivos(dto: TopLimiteDTO) {
        return this.reporteRepository.carpetasConMasArchivos(dto.limite);
    }

    /** Ranking histórico de archivos por cantidad de operaciones registradas. */
    async archivosConMasOperaciones(dto: TopLimiteDTO) {
        return this.reporteRepository.archivosConMasOperaciones(dto.limite);
    }

    // Usuarios

    /** Usuarios con más archivos activos en propiedad. */
    async topUsuariosConMasArchivos(dto: TopLimiteDTO) {
        return this.reporteRepository.topUsuariosConMasArchivos(dto.limite);
    }

    /** Usuarios con más recursos compartidos directamente. */
    async usuariosConMasCompartidos(dto: TopLimiteDTO) {
        return this.reporteRepository.usuariosConMasCompartidos(dto.limite);
    }

    // Compartición

    /** Archivos con más usuarios con acceso efectivo (directo o heredado). */
    async archivosMasCompartidos(dto: TopLimiteDTO) {
        return this.reporteRepository.archivosMasCompartidos(dto.limite);
    }

    /** Recursos compartidos directamente por el usuario indicado. */
    async recursosCompartidosPorUsuario(usuarioId: string) {
        const recursos =
            await this.reporteRepository.recursosCompartidosPorUsuario(
                usuarioId,
            );

        return {
            usuarioId,
            ...recursos,
        };
    }

    /** Recursos recibidos directamente por el usuario, sin herencia. */
    async recursosRecibidosPorUsuario(usuarioId: string) {
        const recursos =
            await this.reporteRepository.recursosRecibidosPorUsuario(usuarioId);

        return {
            usuarioId,
            ...recursos,
        };
    }

    // Actividad (delegado)

    /** Historial del usuario en un rango, limitado a las 200 actividades recientes. */
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

    /** Conteo de operaciones agrupadas por acción para el usuario o rango dado. */
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

    /** Conteo de operaciones agrupadas por día, mes o año. */
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
