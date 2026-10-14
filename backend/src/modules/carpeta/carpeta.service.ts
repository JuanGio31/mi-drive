import { ICarpetaRepository } from './carpeta.repository';
import { ICarpeta, ICompartidoCon } from './carpeta.model';
import {
    CrearCarpetaDTO,
    RenombrarCarpetaDTO,
    MoverCarpetaDTO,
    CompartirCarpetaDTO,
    ListarCarpetasQuery,
} from './carpeta.dto';
import { HttpError } from '../../shared/errors/http-error';
import { Types } from 'mongoose';
import { NivelPermiso } from '../../shared/types/enums';

/** Servicio con la lógica de negocio de carpetas (estilo Google Drive). */
export class CarpetaService {
    constructor(private readonly carpetaRepository: ICarpetaRepository) {}

    /** Crea una carpeta en la raíz o dentro de una carpeta padre validada. */
    async crear(dto: CrearCarpetaDTO, usuarioId: string): Promise<ICarpeta> {
        const carpetaPadre = dto.carpetaPadre ?? null;

        // Si se indica carpeta padre, verificar que exista y que el usuario tenga acceso
        if (carpetaPadre) {
            const padre = await this.carpetaRepository.buscarPorIdYUsuario(
                carpetaPadre,
                usuarioId,
            );
            if (!padre) {
                throw HttpError.notFound('Carpeta padre no encontrada');
            }
            if (padre.enPapelera) {
                throw HttpError.badRequest(
                    'No se puede crear dentro de una carpeta en papelera',
                );
            }
        }

        // Evitar duplicados
        const existe = await this.carpetaRepository.existeCarpetaConNombre(
            usuarioId,
            carpetaPadre,
            dto.nombre,
        );
        if (existe) {
            throw HttpError.conflict(
                'Ya existe una carpeta con ese nombre en esta ubicación',
            );
        }

        return this.carpetaRepository.crear({
            nombre: dto.nombre,
            propietario: new Types.ObjectId(usuarioId),
            carpetaPadre: carpetaPadre
                ? new Types.ObjectId(carpetaPadre)
                : null,
            compartidoCon: [],
            enPapelera: false,
        });
    }

    /** Lista las carpetas propias por padre y, si se pide, las compartidas con el usuario. */
    async listar(
        usuarioId: string,
        filtros: ListarCarpetasQuery,
    ): Promise<{ propias: ICarpeta[]; compartidas: ICarpeta[] }> {
        const propias = await this.carpetaRepository.listarPorPropietarioYPadre(
            usuarioId,
            filtros.carpetaPadre ?? null,
        );

        const compartidas = filtros.incluirCompartidas
            ? await this.carpetaRepository.listarCompartidasCon(usuarioId)
            : [];

        return { propias, compartidas };
    }

    /** Busca una carpeta por ID validando que el usuario sea dueño o colaborador. */
    async buscarPorId(id: string, usuarioId: string): Promise<ICarpeta> {
        const carpeta = await this.carpetaRepository.buscarPorIdYUsuario(
            id,
            usuarioId,
        );
        if (!carpeta) {
            throw HttpError.notFound('Carpeta no encontrada');
        }
        return carpeta;
    }

    /** Renombra una carpeta con permiso de edición, evitando duplicados en su ubicación. */
    async renombrar(
        id: string,
        dto: RenombrarCarpetaDTO,
        usuarioId: string,
    ): Promise<ICarpeta> {
        const carpeta = await this.obtenerConPermisoEdicion(id, usuarioId);

        const existe = await this.carpetaRepository.existeCarpetaConNombre(
            carpeta.propietario.toString(),
            carpeta.carpetaPadre?.toString() ?? null,
            dto.nombre,
            id,
        );
        if (existe) {
            throw HttpError.conflict(
                'Ya existe una carpeta con ese nombre en esta ubicación',
            );
        }

        const actualizada = await this.carpetaRepository.actualizar(id, {
            nombre: dto.nombre,
        });
        if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');
        return actualizada;
    }

    /** Mueve una carpeta a otro padre (o a la raíz con null), previniendo ciclos y duplicados. */
    async mover(
        id: string,
        dto: MoverCarpetaDTO,
        usuarioId: string,
    ): Promise<ICarpeta> {
        const carpeta = await this.obtenerConPermisoEdicion(id, usuarioId);
        const nuevoPadreId = dto.carpetaPadre;

        // No puede moverse dentro de sí misma
        if (nuevoPadreId && nuevoPadreId.toLowerCase() === id.toLowerCase()) {
            throw HttpError.badRequest(
                'No se puede mover una carpeta dentro de sí misma',
            );
        }

        // Verificar que el nuevo padre exista y sea accesible
        if (nuevoPadreId) {
            const nuevoPadre = await this.carpetaRepository.buscarPorIdYUsuario(
                nuevoPadreId,
                usuarioId,
            );
            if (!nuevoPadre) {
                throw HttpError.notFound('Carpeta destino no encontrada');
            }
            if (nuevoPadre.enPapelera) {
                throw HttpError.badRequest(
                    'No se puede mover a una carpeta en papelera',
                );
            }

            // PREVENCIÓN DE CICLOS: el nuevo padre no puede ser descendiente de esta carpeta
            const descendientes =
                await this.carpetaRepository.obtenerDescendientesIds(id);
            const descendientesSet = new Set(
                descendientes.map((d) => d.toLowerCase()),
            );
            if (descendientesSet.has(nuevoPadreId.toLowerCase())) {
                throw HttpError.badRequest(
                    'No se puede mover una carpeta dentro de uno de sus descendientes',
                );
            }
        }

        // Evitar duplicados en el destino
        const existe = await this.carpetaRepository.existeCarpetaConNombre(
            carpeta.propietario.toString(),
            nuevoPadreId,
            carpeta.nombre,
            id,
        );
        if (existe) {
            throw HttpError.conflict(
                'Ya existe una carpeta con ese nombre en el destino',
            );
        }

        const actualizada = await this.carpetaRepository.actualizar(id, {
            carpetaPadre: nuevoPadreId
                ? new Types.ObjectId(nuevoPadreId)
                : null,
        });
        if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');
        return actualizada;
    }

    /** Envía una carpeta a la papelera (solo el propietario). */
    async enviarAPapelera(id: string, usuarioId: string): Promise<ICarpeta> {
        const carpeta = await this.obtenerComoPropietario(id, usuarioId);
        const actualizada = await this.carpetaRepository.enviarAPapelera(id);
        if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');
        return actualizada;
    }

    /** Restaura una carpeta de la papelera si su padre sigue disponible. */
    async restaurar(id: string, usuarioId: string): Promise<ICarpeta> {
        const carpeta = await this.obtenerComoPropietario(id, usuarioId);
        if (!carpeta.enPapelera) {
            throw HttpError.badRequest('La carpeta no está en la papelera');
        }

        // Verificar que la carpeta padre siga existiendo y no esté en papelera
        if (carpeta.carpetaPadre) {
            const padre = await this.carpetaRepository.buscarPorId(
                carpeta.carpetaPadre.toString(),
            );
            if (!padre || padre.enPapelera) {
                throw HttpError.badRequest(
                    'No se puede restaurar: la carpeta padre no está disponible',
                );
            }
        }

        const restaurada = await this.carpetaRepository.restaurar(id);
        if (!restaurada) throw HttpError.notFound('Carpeta no encontrada');
        return restaurada;
    }

    // ============ Compartidos ============

    /** Comparte una carpeta con otro usuario o actualiza su permiso si ya la tiene. */
    async compartir(
        id: string,
        dto: CompartirCarpetaDTO,
        usuarioId: string,
    ): Promise<ICarpeta> {
        const carpeta = await this.obtenerComoPropietario(id, usuarioId);

        if (dto.usuarioId === usuarioId) {
            throw HttpError.badRequest('No puedes compartir contigo mismo');
        }

        const yaCompartida = carpeta.compartidoCon.some(
            (c) => c.usuario.toString() === dto.usuarioId,
        );
        if (yaCompartida) {
            // Actualizar permiso existente
            const actualizada = await this.carpetaRepository.actualizarPermiso(
                id,
                dto.usuarioId,
                dto.permiso as NivelPermiso,
            );
            if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');
            return actualizada;
        }

        const nuevoCompartido: ICompartidoCon = {
            usuario: new Types.ObjectId(dto.usuarioId),
            permiso: dto.permiso as NivelPermiso,
            fechaCompartido: new Date(),
        };

        const actualizada = await this.carpetaRepository.agregarCompartido(
            id,
            nuevoCompartido,
        );
        if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');
        return actualizada;
    }

    /** Quita a un usuario de la lista de compartidos de la carpeta. */
    async quitarCompartido(
        id: string,
        usuarioDestinoId: string,
        usuarioId: string,
    ): Promise<ICarpeta> {
        await this.obtenerComoPropietario(id, usuarioId);

        const actualizada = await this.carpetaRepository.quitarCompartido(
            id,
            usuarioDestinoId,
        );
        if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');
        return actualizada;
    }
    

    /** Obtiene la carpeta solo si el usuario es el propietario, si no lanza 403. */
    private async obtenerComoPropietario(
        id: string,
        usuarioId: string,
    ): Promise<ICarpeta> {
        const carpeta = await this.carpetaRepository.buscarPorId(id);
        if (!carpeta) throw HttpError.notFound('Carpeta no encontrada');
        if (carpeta.propietario.toString() !== usuarioId) {
            throw HttpError.forbidden(
                'Solo el propietario puede realizar esta acción',
            );
        }
        return carpeta;
    }

    /** Obtiene la carpeta si el usuario es dueño o tiene permiso de edición, si no lanza 403. */
    private async obtenerConPermisoEdicion(
        id: string,
        usuarioId: string,
    ): Promise<ICarpeta> {
        const carpeta = await this.carpetaRepository.buscarPorId(id);
        if (!carpeta) throw HttpError.notFound('Carpeta no encontrada');

        const esPropietario = carpeta.propietario.toString() === usuarioId;
        if (esPropietario) return carpeta;

        const compartido = carpeta.compartidoCon.find(
            (c) => c.usuario.toString() === usuarioId,
        );

        if (
            !compartido ||
            compartido.permiso === 'lectura' ||
            compartido.permiso === 'comentar'
        ) {
            throw HttpError.forbidden(
                'No tiene permisos de edición sobre esta carpeta',
            );
        }

        return carpeta;
    }
}
