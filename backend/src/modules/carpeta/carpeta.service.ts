import { Types } from 'mongoose';
import { ICarpetaRepository } from './carpeta.repository';
import { CarpetaPermisosService } from './carpeta-permisos.service';
// import { ActividadService } from '../actividad/actividad.service';
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
        private readonly actividadService: ActividadService,
    ) {}

    async crear(dto: CrearCarpetaDTO, usuarioId: string): Promise<ICarpeta> {
        const carpetaPadre = dto.carpetaPadre ?? null;

        if (carpetaPadre) {
            await this.permisosService.validarPadreEditable(
                carpetaPadre,
                usuarioId,
            );
        }

        await this.validarNombreUnico(usuarioId, carpetaPadre, dto.nombre);

        const carpeta = await this.carpetaRepository.crear({
            nombre: dto.nombre,
            propietario: new Types.ObjectId(usuarioId),
            carpetaPadre: carpetaPadre
                ? new Types.ObjectId(carpetaPadre)
                : null,
            compartidoCon: [],
            enPapelera: false,
        });

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
        const carpeta = await this.permisosService.obtenerConPermisoEdicion(
            id,
            usuarioId,
        );

        await this.validarNombreUnico(
            carpeta.propietario.toString(),
            carpeta.carpetaPadre?.toString() ?? null,
            dto.nombre,
            id,
        );

        const actualizada = await this.carpetaRepository.actualizar(id, {
            nombre: dto.nombre,
        });
        if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');

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
        const carpeta = await this.permisosService.obtenerConPermisoEdicion(
            id,
            usuarioId,
        );
        const nuevoPadreId = dto.carpetaPadre;

        if (nuevoPadreId === id) {
            throw HttpError.badRequest(
                'No se puede mover una carpeta dentro de sí misma',
            );
        }

        await this.permisosService.validarPadreEditable(
            nuevoPadreId,
            usuarioId,
        );
        await this.validarSinCiclos(id, nuevoPadreId);
        await this.validarNombreUnico(
            carpeta.propietario.toString(),
            nuevoPadreId,
            carpeta.nombre,
            id,
        );

        const actualizada = await this.carpetaRepository.actualizar(id, {
            carpetaPadre: nuevoPadreId
                ? new Types.ObjectId(nuevoPadreId)
                : null,
        });
        if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');

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

    // metodos privados

    private async validarNombreUnico(
        propietarioId: string,
        carpetaPadre: string | null,
        nombre: string,
        excluirId?: string,
    ): Promise<void> {
        const existe = await this.carpetaRepository.existeCarpetaConNombre(
            propietarioId,
            carpetaPadre,
            nombre,
            excluirId,
        );
        if (existe) {
            throw HttpError.conflict(
                'Ya existe una carpeta con ese nombre en esta ubicación',
            );
        }
    }

    private async validarSinCiclos(
        id: string,
        nuevoPadreId: string | null,
    ): Promise<void> {
        if (!nuevoPadreId) return;

        const descendientes =
            await this.carpetaRepository.obtenerDescendientesIds(id);
        if (descendientes.includes(nuevoPadreId)) {
            throw HttpError.badRequest(
                'No se puede mover una carpeta dentro de uno de sus descendientes',
            );
        }
    }

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
