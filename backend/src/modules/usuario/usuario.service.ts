import { env } from '../../shared/config/env';
import { HttpError } from '../../shared/errors/http-error';
import { Rol } from '../../shared/types/enums';
import {
    ActualizarUsuarioDTO,
    CrearUsuarioDTO,
    ListarUsuarioQueryDTO,
} from './usuario.dto';
import { IUsuario } from './usuario.model';
import { IUsuarioRepository } from './usuario.repository';
import bcrypt from 'bcrypt';

export class UsuarioService {
    constructor(private readonly usuarioRepository: IUsuarioRepository) {}

    async crear(dto: CrearUsuarioDTO): Promise<IUsuario> {
        const existente = await this.usuarioRepository.buscarPorCorreo(
            dto.correo,
        );

        if (existente) {
            throw HttpError.conflict('El correo ya está en uso');
        }

        const passwordHash = await bcrypt.hash(
            dto.password,
            env.BYCRYPT_ROUNDS,
        );

        return this.usuarioRepository.crear({
            ...dto,
            passwordHash,
            rol: (dto.rol as Rol) ?? Rol.Usuario,
            activo: true,
        });
    }

    async listar(filtros: ListarUsuarioQueryDTO): Promise<IUsuario[]> {
        return this.usuarioRepository.listar(filtros);
    }

    async buscarPorId(id: string): Promise<IUsuario | null> {
        const usuario = await this.usuarioRepository.buscarPorId(id);

        if (!usuario) {
            throw HttpError.notFound('El usuario no encontrado');
        }

        return usuario;
    }

    async actualizar(
        id: string,
        dto: ActualizarUsuarioDTO,
    ): Promise<IUsuario | null> {
        // Si se cambia el correo, verificar que no esté en uso
        if (dto.correo) {
            const existente = await this.usuarioRepository.buscarPorCorreo(
                dto.correo,
            );

            if (existente && existente._id.toString() !== id) {
                throw HttpError.conflict('El correo ya está en uso');
            }
        }

        const actualizado = await this.usuarioRepository.actualizar(id, dto);

        if (!actualizado) {
            throw HttpError.notFound('El usuario no encontrado');
        }

        return actualizado;
    }

    async desactivar(id: string): Promise<IUsuario | null> {
        const desactivado = await this.usuarioRepository.desactivar(id);

        if (!desactivado) {
            throw HttpError.notFound('El usuario no encontrado');
        }

        return desactivado;
    }

    async reactivar(id: string): Promise<IUsuario | null> {
        const reactivado = await this.usuarioRepository.reactivar(id);

        if (!reactivado) {
            throw HttpError.notFound('El usuario no encontrado');
        }

        return reactivado;
    }
}
