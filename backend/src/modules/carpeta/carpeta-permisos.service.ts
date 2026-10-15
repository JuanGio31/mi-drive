import { HttpError } from '../../shared/errors/http-error';
import { NivelPermiso } from '../../shared/types/enums';
import { ICarpeta } from './carpeta.model';
import { ICarpetaRepository } from './carpeta.repository';

export class CarpetaPermisosService {
    constructor(private readonly carpetaRepository: ICarpetaRepository) {}

    /**
     * Devuelve el permiso sobre la carpeta
     * - El propietario tiene permiso de edición por defecto
     * - Si no tiene acceso, devuelve null
     * @param carpeta - Carpeta
     * @param usuarioId - ID del usuario
     * @returns NivelPermiso
     */
    obtenerPermiso(carpeta: ICarpeta, usuarioId: string): NivelPermiso | null {
        if (carpeta.propietario.toString() === usuarioId) {
            return NivelPermiso.Escritura;
        }

        const compartido = carpeta.compartidoCon.find(
            (c) => c.usuario.toString() === usuarioId,
        );
        return compartido ? compartido.permiso : null;
    }

    /** Carga la carpeta y valida que el usuario tenga acceso de lectura.
     * @param id - ID de la carpeta
     * @param usuarioId - ID del usuario que realiza la acción
     * @returns La carpeta validada
     * @throws NotFound si la carpeta no existe
     * @throws Forbidden si el usuario no tiene acceso
     */
    async obtenerConAcceso(id: string, usuarioId: string): Promise<ICarpeta> {
        const carpeta = await this.carpetaRepository.buscarPorId(id);
        if (!carpeta) throw HttpError.notFound('Carpeta no encontrada');

        const permiso = this.obtenerPermiso(carpeta, usuarioId);
        if (!permiso) {
            throw HttpError.forbidden('No tiene acceso a esta carpeta');
        }
        return carpeta;
    }

    /** Carga la carpeta y valida que el usuario tenga permiso de edición
     * @param id - ID de la carpeta
     * @param usuarioId - ID del usuario que realiza laacción
     * @returns La carpeta validada
     * @throws NotFound si la carpeta no existe
     * @throws Forbidden si el usuario no tiene permisos de edición
     */
    async obtenerConPermisoEdicion(
        id: string,
        usuarioId: string,
    ): Promise<ICarpeta> {
        const carpeta = await this.obtenerConAcceso(id, usuarioId);
        if (!carpeta) throw HttpError.notFound('Carpeta no encontrada');

        const permiso = this.obtenerPermiso(carpeta, usuarioId);
        if (permiso !== NivelPermiso.Escritura) {
            throw HttpError.forbidden(
                'No tiene permisos de edición sobre esta carpeta',
            );
        }
        return carpeta;
    }

    /** Carga la carpeta y valida que el usuario sea el propietario
     * @param id - ID de la carpeta
     * @param usuarioId - ID del usuario que realiza laacción
     * @returns La carpeta validada
     * @throws NotFound si la carpeta no existe
     * @throws Forbidden si el usuario no es el propietario
     */
    async obtenerComoPropietario(
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

    /**
     * Valida que la carpeta padre tenga permiso de edición
     * @param carpetaPadreId - ID de la carpeta padre (null para raíz)
     * @param usuarioId - ID del usuario que realiza la acción
     * @returns La carpeta padre validada o null si es raíz
     * @throws NotFound si la carpeta no existe
     * @throws BadRequest si la carpeta está en papelera
     * @throws Forbidden si el usuario no tiene permisos de edición
     */
    async validarPadreEditable(
        carpetaPadreId: string | null,
        usuarioId: string,
    ): Promise<ICarpeta | null> {
        if (!carpetaPadreId) return null;

        const padre = await this.carpetaRepository.buscarPorId(carpetaPadreId);
        if (!padre) {
            throw HttpError.notFound('Carpeta padre no encontrada');
        }

        if (padre.enPapelera) {
            throw HttpError.badRequest(
                'No se puede crear dentro de una carpeta en papelera',
            );
        }

        const permiso = this.obtenerPermiso(padre, usuarioId);
        if (permiso !== NivelPermiso.Escritura) {
            throw HttpError.forbidden(
                'No tiene permisos de edición sobre la carpeta padre',
            );
        }
        return padre;
    }
}
