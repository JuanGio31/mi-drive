import { Types } from 'mongoose';
import { HttpError } from '../../shared/errors/http-error';
import { ICarpeta } from '../carpeta/carpeta.model';
import { ICarpetaRepository } from '../carpeta/carpeta.repository';
import {
    ActualizarContenidoDTO,
    CompartirArchivoDTO,
    CrearArchivoDTO,
    ListarArchivosQueryDTO,
    MoverArchivoDTO,
    RenombrarArchivoDTO,
} from './archivo.dto';
import { IArchivo, ICompartidoArchivo } from './archivo.model';
import { IArchivoRepository } from './archivo.repository';
import { ExtensionArchivo, NivelPermiso } from '../../shared/types/enums';

export class ArchivoService {
    constructor(
        private readonly archivoRepository: IArchivoRepository,
        private readonly carpetaRepository: ICarpetaRepository,
    ) {}

    async crear(dto: CrearArchivoDTO, usuarioId: string): Promise<IArchivo> {
        const carpetaPadre = dto.carpetaPadre ?? null;
        let propietarioId = usuarioId;

        if (carpetaPadre) {
            const padre =
                await this.carpetaRepository.buscarPorId(carpetaPadre);

            if (!padre) throw HttpError.notFound('Carpeta padre no encontrada');
            if (padre.enPapelera) {
                throw HttpError.badRequest(
                    'No se puede crear dentro de una carpeta en papelera',
                );
            }

            const permiso = this.obtenerPermisoSobreCarpeta(padre, usuarioId);
            if (!permiso || permiso === 'lectura' || permiso === 'comentar') {
                throw HttpError.forbidden(
                    `No tiene permisos de edición sobre la carpeta ${padre.nombre}`,
                );
            }
            // El propietario del archivo es el propietario de la carpeta padre
            propietarioId = padre.propietario.toString();
        }

        const existe = await this.archivoRepository.existeArchivoConNombre(
            propietarioId,
            carpetaPadre,
            dto.nombre,
        );

        if (existe) {
            throw HttpError.conflict(
                'Ya existe un archivo con ese nombre en esta ubicación',
            );
        }

        const tamanio = Buffer.byteLength(dto.contenido, 'utf-8');

        return this.archivoRepository.crear({
            nombre: dto.nombre,
            tipo: dto.tipo as ExtensionArchivo,
            contenido: dto.contenido,
            tamanio: tamanio,
            propietario: new Types.ObjectId(propietarioId),
            carpetaPadre: carpetaPadre
                ? new Types.ObjectId(carpetaPadre)
                : null,
            enPapelera: false,
        });
    }

    async listar(
        usuarioId: string,
        filtros: ListarArchivosQueryDTO,
    ): Promise<IArchivo[]> {
        const carpetasCompartidas = filtros.incluirCompartidas
            ? await this.carpetaRepository.listarCompartidasCon(usuarioId)
            : [];

        const ids = carpetasCompartidas.map((c) => c._id.toString());

        return this.archivoRepository.listar(usuarioId, filtros, ids);
    }

    async listarCompartidos(usuarioId: string): Promise<IArchivo[]> {
        return this.archivoRepository.listarCompartidosCon(usuarioId);
    }

    async buscarPorId(id: string, usuarioId: string): Promise<IArchivo> {
        const archivo = await this.archivoRepository.buscarPorId(id);
        if (!archivo) throw HttpError.notFound('Archivo no encontrado');

        const permiso = await this.obtenerPermisoSobreArchivo(
            archivo,
            usuarioId,
        );

        if (!permiso) {
            throw HttpError.forbidden('No tiene acceso a este archivo');
        }
        return archivo;
    }

    async actualizarContenido(
        id: string,
        dto: ActualizarContenidoDTO,
        usuarioId: string,
    ): Promise<IArchivo> {
        const archivo = await this.obtenerConPermisoEdicion(id, usuarioId);

        const tamanio = Buffer.byteLength(dto.contenido, 'utf-8');

        const actualizado = await this.archivoRepository.actualizar(id, {
            contenido: dto.contenido,
            tamanio: tamanio,
        });

        if (!actualizado) {
            throw HttpError.notFound('Archivo no encontrado');
        }

        return actualizado;
    }

    async renombrar(
        id: string,
        dto: RenombrarArchivoDTO,
        usuarioId: string,
    ): Promise<IArchivo> {
        const archivo = await this.obtenerConPermisoEdicion(id, usuarioId);

        const existe = await this.archivoRepository.existeArchivoConNombre(
            archivo.propietario.toString(),
            archivo.carpetaPadre?.toString() ?? null,
            dto.nombre,
            id,
        );

        if (existe) {
            throw HttpError.conflict(
                'Ya existe un archivo con ese nombre en esta ubicación',
            );
        }

        const actualizado = await this.archivoRepository.actualizar(id, {
            nombre: dto.nombre,
        });
        if (!actualizado) throw HttpError.notFound('Archivo no encontrado');
        return actualizado;
    }

    async mover(
        id: string,
        dto: MoverArchivoDTO,
        usuarioId: string,
    ): Promise<IArchivo> {
        const archivo = await this.obtenerConPermisoEdicion(id, usuarioId);

        const nuevoPadreId = dto.carpetaPadre;

        if (nuevoPadreId) {
            const nuevoPadre =
                await this.carpetaRepository.buscarPorId(nuevoPadreId);
            if (!nuevoPadre) {
                throw HttpError.notFound('Carpeta destino no encontrada');
            }
            if (nuevoPadre.enPapelera) {
                throw HttpError.badRequest(
                    'No se puede mover a una carpeta en papelera',
                );
            }

            const permiso = this.obtenerPermisoSobreCarpeta(
                nuevoPadre,
                usuarioId,
            );

            if (!permiso || permiso === 'lectura' || permiso === 'comentar') {
                throw HttpError.forbidden(
                    'No tiene permisos de edición sobre la carpeta destino',
                );
            }
        }

        const existe = await this.archivoRepository.existeArchivoConNombre(
            archivo.propietario.toString(),
            nuevoPadreId,
            archivo.nombre,
            id,
        );

        if (existe) {
            throw HttpError.conflict(
                'Ya existe un archivo con ese nombre en esta ubicación',
            );
        }

        const actualizado = await this.archivoRepository.actualizar(id, {
            carpetaPadre: nuevoPadreId
                ? new Types.ObjectId(nuevoPadreId)
                : null,
        });
        if (!actualizado) throw HttpError.notFound('Archivo no encontrado');
        return actualizado;
    }

    async enviarAPapelera(id: string, usuarioId: string): Promise<IArchivo> {
        const archivo = await this.obtenerConPermisoEdicion(id, usuarioId);
        const actualizado = await this.archivoRepository.enviarAPapelera(id);
        if (!actualizado) throw HttpError.notFound('Archivo no encontrado');
        return actualizado;
    }

    async restaurar(id: string, usuarioId: string): Promise<IArchivo> {
        const archivo = await this.archivoRepository.buscarPorId(id);
        if (!archivo) throw HttpError.notFound('Archivo no encontrado');

        if (!archivo.enPapelera) {
            throw HttpError.badRequest(
                'El archivo no se encuentra en papelera',
            );
        }

        const permiso = await this.obtenerPermisoSobreArchivo(
            archivo,
            usuarioId,
        );

        if (!permiso || permiso === 'lectura' || permiso === 'comentar') {
            throw HttpError.forbidden(
                'No tiene permisos de edición sobre el archivo',
            );
        }

        if (archivo.carpetaPadre) {
            const padre = await this.carpetaRepository.buscarPorId(
                archivo.carpetaPadre.toString(),
            );
            if (!padre || padre.enPapelera) {
                throw HttpError.badRequest(
                    'No se puede restaurar: la carpeta padre no está disponible',
                );
            }
        }

        const restaurado = await this.archivoRepository.restaurar(id);
        if (!restaurado) throw HttpError.notFound('Archivo no encontrado');
        return restaurado;
    }

    async compartir(
        id: string,
        dto: CompartirArchivoDTO,
        usuarioId: string,
    ): Promise<IArchivo> {
        const archivo = await this.obtenerComoPropietario(id, usuarioId);
        if (dto.usuarioId === usuarioId) {
            throw HttpError.badRequest(
                'No puede compartir el archivo con uno mismo',
            );
        }

        const yaCompartido = archivo.compartidoCon.some(
            (c) => c.usuario.toString() === dto.usuarioId,
        );

        if (yaCompartido) {
            // Actualizar permiso existente
            const actualizado = await this.archivoRepository.actualizarPermiso(
                id,
                dto.usuarioId,
                dto.permiso as NivelPermiso,
            );
            if (!actualizado) throw HttpError.notFound('Archivo no encontrado');
            return actualizado;
        }

        const nuevo: ICompartidoArchivo = {
            usuario: new Types.ObjectId(dto.usuarioId),
            permiso: dto.permiso as NivelPermiso,
            fechaCompartido: new Date(),
        };

        const actualizado = await this.archivoRepository.agregarCompartido(
            id,
            nuevo,
        );
        if (!actualizado) throw HttpError.notFound('Archivo no encontrado');
        return actualizado;
    }

    async quitarCompartido(
        id: string,
        usuarioDestinoId: string,
        usuarioId: string,
    ): Promise<IArchivo> {
        await this.obtenerComoPropietario(id, usuarioId);

        const actualizado = await this.archivoRepository.quitarCompartido(
            id,
            usuarioDestinoId,
        );

        if (!actualizado) throw HttpError.notFound('Archivo no encontrado');
        return actualizado;
    }

    async eliminarPermanente(id: string, usuarioId: string): Promise<void> {
        const archivo = await this.archivoRepository.buscarPorId(id);
        if (!archivo) throw HttpError.notFound('Archivo no encontrado');

        if (!archivo.enPapelera) {
            throw HttpError.badRequest(
                'Solo se pueden eliminar permanentemente archivos en papelera',
            );
        }

        const permiso = await this.obtenerPermisoSobreArchivo(
            archivo,
            usuarioId,
        );

        if (!permiso || permiso === 'lectura' || permiso === 'comentar') {
            throw HttpError.forbidden(
                'No tiene permisos de edición sobre el archivo',
            );
        }

        await this.archivoRepository.eliminarPermanente(id);
    }

    //** funciones auxiliares */

    /**
     * Devuelve el permiso sobre la carpeta
     * - El propietario tiene permiso de edicion por defecto
     * - Si no tiene acceso, devuelve null
     */
    private obtenerPermisoSobreCarpeta(
        carpeta: ICarpeta,
        usuarioId: string,
    ): NivelPermiso | null {
        if (carpeta.propietario.toString() === usuarioId)
            return NivelPermiso.Escritura;

        const compartido = carpeta.compartidoCon.find(
            (c) => c.usuario.toString() === usuarioId,
        );

        return compartido ? (compartido.permiso as NivelPermiso) : null;
    }

    /**
     * Devuelve el permiso del usuario sobre el archivo
     */
    private async obtenerPermisoSobreArchivo(
        archivo: IArchivo,
        usuarioId: string,
    ): Promise<NivelPermiso | null> {
        if (archivo.propietario.toString() === usuarioId)
            return NivelPermiso.Escritura;

        const compartido = archivo.compartidoCon.find(
            (c) => c.usuario.toString() === usuarioId,
        );

        if (compartido) return compartido.permiso as NivelPermiso;

        if (archivo.carpetaPadre) {
            const padre = await this.carpetaRepository.buscarPorId(
                archivo.carpetaPadre.toString(),
            );
            if (padre) {
                return this.obtenerPermisoSobreCarpeta(padre, usuarioId);
            }
        }
        return null;
    }

    private async obtenerComoPropietario(
        id: string,
        usuarioId: string,
    ): Promise<IArchivo> {
        const archivo = await this.archivoRepository.buscarPorId(id);
        if (!archivo) throw HttpError.notFound('Archivo no encontrado');
        if (archivo.propietario.toString() !== usuarioId)
            throw HttpError.forbidden(
                'Solo el propietario puede realizar esta acción',
            );
        return archivo;
    }

    private async obtenerConPermisoEdicion(
        id: string,
        usuarioId: string,
    ): Promise<IArchivo> {
        const archivo = await this.archivoRepository.buscarPorId(id);
        if (!archivo) throw HttpError.notFound('Archivo no encontrado');

        const permiso = await this.obtenerPermisoSobreArchivo(
            archivo,
            usuarioId,
        );
        if (!permiso || permiso === 'lectura' || permiso === 'comentar') {
            throw HttpError.forbidden(
                'No tiene permisos de edición sobre el archivo',
            );
        }
        return archivo;
    }
}
