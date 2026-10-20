import { Types } from 'mongoose';
import { IArchivoRepository } from './archivo.repository';
import { ArchivoPermisosService } from './archivo-permisos.service';
import { ActividadService } from '../actividad/actividad.service';
import { IUsuarioRepository } from '../usuario/usuario.repository';
import { IArchivo, ICompartidoArchivo } from './archivo.model';
import { CompartirArchivoDTO } from './archivo.dto';
import { HttpError } from '../../shared/errors/http-error';
import {
    AccionActividad,
    NivelPermiso,
    TipoRecurso,
} from '../../shared/types/enums';

export class ArchivoCompartidosService {
    constructor(
        private readonly archivoRepository: IArchivoRepository,
        private readonly permisosService: ArchivoPermisosService,
        private readonly actividadService: ActividadService,
        private readonly usuarioRepository: IUsuarioRepository,
    ) {}

    /**
     * Comparte un archivo con un usuario activo existente. Solo el propietario
     * puede hacerlo; si ya estaba compartido, actualiza el permiso.
     */
    async compartir(
        id: string,
        dto: CompartirArchivoDTO,
        usuarioId: string,
    ): Promise<IArchivo> {
        const archivo = await this.permisosService.obtenerComoPropietario(
            id,
            usuarioId,
        );

        if (dto.usuarioId === usuarioId) {
            throw HttpError.badRequest('No puedes compartir contigo mismo');
        }

        const destino = await this.usuarioRepository.buscarPorId(dto.usuarioId);
        if (!destino || !destino.activo) {
            throw HttpError.notFound('Usuario destino no encontrado');
        }

        const yaCompartido = archivo.compartidoCon.some(
            (c) => c.usuario.toString() === dto.usuarioId,
        );

        const actualizado = yaCompartido
            ? await this.archivoRepository.actualizarPermiso(
                  id,
                  dto.usuarioId,
                  dto.permiso as NivelPermiso,
              )
            : await this.archivoRepository.agregarCompartido(
                  id,
                  this.construirCompartido(dto),
              );

        if (!actualizado) throw HttpError.notFound('Archivo no encontrado');

        await this.actividadService.registrar({
            usuarioId,
            accion: AccionActividad.Compartir,
            recursoTipo: TipoRecurso.Archivo,
            recursoId: id,
            recursoNombre: archivo.nombre,
            metadata: {
                usuarioDestino: dto.usuarioId,
                permiso: dto.permiso,
            },
        });

        return actualizado;
    }

    async quitar(
        id: string,
        usuarioDestinoId: string,
        usuarioId: string,
    ): Promise<IArchivo> {
        const archivo = await this.permisosService.obtenerComoPropietario(
            id,
            usuarioId,
        );

        const actualizado = await this.archivoRepository.quitarCompartido(
            id,
            usuarioDestinoId,
        );
        if (!actualizado) throw HttpError.notFound('Archivo no encontrado');

        await this.actividadService.registrar({
            usuarioId,
            accion: AccionActividad.QuitarCompartido,
            recursoTipo: TipoRecurso.Archivo,
            recursoId: id,
            recursoNombre: archivo.nombre,
            metadata: { usuarioDestino: usuarioDestinoId },
        });

        return actualizado;
    }

    private construirCompartido(dto: CompartirArchivoDTO): ICompartidoArchivo {
        return {
            usuario: new Types.ObjectId(dto.usuarioId),
            permiso: dto.permiso as NivelPermiso,
            fechaCompartido: new Date(),
        };
    }
}
