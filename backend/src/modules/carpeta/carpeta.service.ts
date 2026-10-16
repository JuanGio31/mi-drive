import { Types } from 'mongoose';
import { ICarpetaRepository } from './carpeta.repository';
import { CarpetaPermisosService } from './carpeta-permisos.service';
import { CarpetaValidator } from './carpeta.validator';
import { ICarpeta } from './carpeta.model';
import {
    CrearCarpetaDTO,
    RenombrarCarpetaDTO,
    MoverCarpetaDTO,
    ListarCarpetasQuery,
} from './carpeta.dto';
import { HttpError } from '../../shared/errors/http-error';
import { ActividadService } from '../actividad/actividad.service';
import { AccionActividad, TipoRecurso } from '../../shared/types/enums';

export class CarpetaService {
    constructor(
        private readonly carpetaRepository: ICarpetaRepository,
        private readonly permisosService: CarpetaPermisosService,
        private readonly validator: CarpetaValidator,
        private readonly actividadService: ActividadService,
    ) {}

    async crear(dto: CrearCarpetaDTO, usuarioId: string): Promise<ICarpeta> {
        const carpetaPadre = dto.carpetaPadre ?? null;

        // 1. Validaciones
        if (carpetaPadre) {
            await this.validator.validarPadreDisponible(carpetaPadre);
            await this.permisosService.validarPadreEditable(
                carpetaPadre,
                usuarioId,
            );
        }
        await this.validator.validarNombreUnico(
            usuarioId,
            carpetaPadre,
            dto.nombre,
        );

        // 2. Operación
        const carpeta = await this.carpetaRepository.crear({
            nombre: dto.nombre,
            propietario: new Types.ObjectId(usuarioId),
            carpetaPadre: carpetaPadre
                ? new Types.ObjectId(carpetaPadre)
                : null,
            compartidoCon: [],
            enPapelera: false,
        });

        // 3. Efectos secundarios
        await this.registrarActividad(
            usuarioId,
            AccionActividad.Crear,
            carpeta,
        );

        return carpeta;
    }

    async listar(usuarioId: string, filtros: ListarCarpetasQuery) {
        const propias = await this.carpetaRepository.listarPorPropietarioYPadre(
            usuarioId,
            filtros.carpetaPadre ?? null,
        );

        const compartidas = filtros.incluirCompartidas
            ? await this.carpetaRepository.listarCompartidasCon(usuarioId)
            : [];

        return { propias, compartidas };
    }

    async buscarPorId(id: string, usuarioId: string): Promise<ICarpeta> {
        return this.permisosService.obtenerConAcceso(id, usuarioId);
    }

    async renombrar(
        id: string,
        dto: RenombrarCarpetaDTO,
        usuarioId: string,
    ): Promise<ICarpeta> {
        // 1. Validaciones
        const carpeta = await this.permisosService.obtenerConPermisoEdicion(
            id,
            usuarioId,
        );

        await this.validator.validarNombreUnico(
            carpeta.propietario.toString(),
            carpeta.carpetaPadre?.toString() ?? null,
            dto.nombre,
            id,
        );

        // 2. Operación
        const actualizada = await this.carpetaRepository.actualizar(id, {
            nombre: dto.nombre,
        });
        if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');

        // 3. Efectos secundarios
        await this.registrarActividad(
            usuarioId,
            AccionActividad.Renombrar,
            actualizada,
            {
                nombreAnterior: carpeta.nombre,
            },
        );

        return actualizada;
    }

    async mover(
        id: string,
        dto: MoverCarpetaDTO,
        usuarioId: string,
    ): Promise<ICarpeta> {
        const nuevoPadreId = dto.carpetaPadre;

        // 1. Validaciones
        const carpeta = await this.permisosService.obtenerConPermisoEdicion(
            id,
            usuarioId,
        );
        await this.validator.validarSinCiclos(id, nuevoPadreId);
        if (nuevoPadreId) {
            await this.validator.validarPadreDisponible(nuevoPadreId);
            await this.permisosService.validarPadreEditable(
                nuevoPadreId,
                usuarioId,
            );
        }
        await this.validator.validarNombreUnico(
            carpeta.propietario.toString(),
            nuevoPadreId,
            carpeta.nombre,
            id,
        );

        // 2. Operación
        const actualizada = await this.carpetaRepository.actualizar(id, {
            carpetaPadre: nuevoPadreId
                ? new Types.ObjectId(nuevoPadreId)
                : null,
        });
        if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');

        // 3. Efectos secundarios
        await this.registrarActividad(
            usuarioId,
            AccionActividad.Mover,
            actualizada,
            {
                carpetaOrigen: carpeta.carpetaPadre?.toString() ?? null,
                carpetaDestino: nuevoPadreId,
            },
        );

        return actualizada;
    }

    // Métodos privados
    private async registrarActividad(
        usuarioId: string,
        accion: AccionActividad,
        carpeta: ICarpeta,
        metadata: Record<string, unknown> = {},
    ): Promise<void> {
        await this.actividadService.registrar({
            usuarioId,
            accion,
            recursoTipo: TipoRecurso.Carpeta,
            recursoId: carpeta._id.toString(),
            recursoNombre: carpeta.nombre,
            metadata,
        });
    }
}
