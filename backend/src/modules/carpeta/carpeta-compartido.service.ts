import { Types } from 'mongoose';
import { ICarpetaRepository } from './carpeta.repository';
import { CarpetaPermisosService } from './carpeta-permisos.service';
// import { ActividadService } from '../actividad/actividad.service';
import { ICarpeta, ICompartidoCon } from './carpeta.model';
import { CompartirCarpetaDTO } from './carpeta.dto';
import { HttpError } from '../../shared/errors/http-error';
import {
    AccionActividad,
    NivelPermiso,
    TipoRecurso,
} from '../../shared/types/enums';
import { ActividadService } from '../actividad/actividad.service';

export class CarpetaCompartidosService {
    constructor(
        private readonly carpetaRepository: ICarpetaRepository,
        private readonly permisosService: CarpetaPermisosService,
        private readonly actividadService: ActividadService,
    ) {}

    async compartir(
        id: string,
        dto: CompartirCarpetaDTO,
        usuarioId: string,
    ): Promise<ICarpeta> {
        const carpeta = await this.permisosService.obtenerComoPropietario(
            id,
            usuarioId,
        );

        if (dto.usuarioId === usuarioId) {
            throw HttpError.badRequest('No puedes compartir contigo mismo');
        }

        const yaCompartida = carpeta.compartidoCon.some(
            (c) => c.usuario.toString() === dto.usuarioId,
        );

        const actualizada = yaCompartida
            ? await this.carpetaRepository.actualizarPermiso(
                  id,
                  dto.usuarioId,
                  dto.permiso as NivelPermiso,
              )
            : await this.carpetaRepository.agregarCompartido(
                  id,
                  this.construirCompartido(dto),
              );

        if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');

        await this.actividadService.registrar({
            usuarioId,
            accion: AccionActividad.Compartir,
            recursoTipo: TipoRecurso.Carpeta,
            recursoId: id,
            recursoNombre: carpeta.nombre,
            metadata: { usuarioDestino: dto.usuarioId, permiso: dto.permiso },
        });

        return actualizada;
    }

    async quitar(
        id: string,
        usuarioDestinoId: string,
        usuarioId: string,
    ): Promise<ICarpeta> {
        const carpeta = await this.permisosService.obtenerComoPropietario(
            id,
            usuarioId,
        );

        const actualizada = await this.carpetaRepository.quitarCompartido(
            id,
            usuarioDestinoId,
        );
        if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');

        await this.actividadService.registrar({
            usuarioId,
            accion: AccionActividad.QuitarCompartido,
            recursoTipo: TipoRecurso.Carpeta,
            recursoId: id,
            recursoNombre: carpeta.nombre,
            metadata: { usuarioDestino: usuarioDestinoId },
        });

        return actualizada;
    }

    private construirCompartido(dto: CompartirCarpetaDTO): ICompartidoCon {
        return {
            usuario: new Types.ObjectId(dto.usuarioId),
            permiso: dto.permiso as NivelPermiso,
            fechaCompartido: new Date(),
        };
    }
}
