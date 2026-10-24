import { IUsuarioRepository } from './usuario.repository';
import { IUsuario } from './usuario.model';
import { HttpError } from '../../shared/errors/http-error';

/** Resuelve reglas de acceso sobre usuarios y devuelve los 403/404. */
export class UsuarioPermisosService {
    constructor(private readonly usuarioRepository: IUsuarioRepository) {}

    /**
     * Devuelve el usuario si existe y es administrador; en caso contrario
     * lanza 404 (no encontrado) o 403 (sin permisos).
     */
    async obtenerComoAdmin(usuarioId: string): Promise<IUsuario> {
        const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
        if (!usuario) throw HttpError.notFound('Usuario no encontrado');
        if (usuario.rol !== 'administrador') {
            throw HttpError.forbidden(
                'Solo administradores pueden realizar esta acción',
            );
        }
        return usuario;
    }

    /**
     * Permite acceder al propio usuario o, si el solicitante es admin, a
     * cualquier otro. Lanza 404 si el usuario no existe y 403 si no aplica.
     */
    async obtenerConAccesoPropioOAdmin(
        id: string,
        usuarioId: string,
        rolUsuario: string,
    ): Promise<IUsuario> {
        const usuario = await this.usuarioRepository.buscarPorId(id);
        if (!usuario) throw HttpError.notFound('Usuario no encontrado');

        const esPropio = id === usuarioId;
        const esAdmin = rolUsuario === 'administrador';

        if (!esPropio && !esAdmin) {
            throw HttpError.forbidden(
                'No tiene permisos para ver o modificar este usuario',
            );
        }

        return usuario;
    }
}
