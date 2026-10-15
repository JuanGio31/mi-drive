import { IUsuarioRepository } from './usuario.repository';
import { IUsuario } from './usuario.model';
import { HttpError } from '../../shared/errors/http-error';

export class UsuarioPermisosService {
    constructor(private readonly usuarioRepository: IUsuarioRepository) {}

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
