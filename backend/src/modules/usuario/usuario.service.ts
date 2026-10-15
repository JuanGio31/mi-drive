import bcrypt from 'bcrypt';
import { IUsuarioRepository } from './usuario.repository';
import { ActividadService } from '../actividad/actividad.service';
import { IUsuario } from './usuario.model';
import { HttpError } from '../../shared/errors/http-error';
import { env } from '../../shared/config/env';
import { UsuarioPermisosService } from './usuario-permisos.services';
import {
    ActualizarUsuarioDTO,
    CrearUsuarioDTO,
    ListarUsuarioQueryDTO,
} from './usuario.dto';
import { AccionActividad, Rol, TipoRecurso } from '../../shared/types/enums';

export class UsuarioService {
    constructor(
        private readonly usuarioRepository: IUsuarioRepository,
        private readonly permisosService: UsuarioPermisosService,
        private readonly actividadService: ActividadService,
    ) {}

    async crear(
        dto: CrearUsuarioDTO,
        usuarioEjecutorId: string,
    ): Promise<IUsuario> {
        // Verificar que el ejecutor sea admin
        await this.permisosService.obtenerComoAdmin(usuarioEjecutorId);

        const existente = await this.usuarioRepository.buscarPorCorreo(
            dto.correo,
        );
        if (existente) throw HttpError.conflict('El email ya está registrado');

        const passwordHash = await bcrypt.hash(dto.password, env.BCRYPT_ROUNDS);

        const usuario = await this.usuarioRepository.crear({
            nombre: dto.nombre,
            correo: dto.correo,
            passwordHash,
            rol: (dto.rol as Rol) ?? Rol.Usuario,
            activo: true,
        });

        await this.actividadService.registrar({
            usuarioId: usuarioEjecutorId,
            accion: AccionActividad.Crear,
            recursoTipo: TipoRecurso.Usuario,
            recursoId: usuario._id.toString(),
            recursoNombre: usuario.nombre,
            metadata: { rol: usuario.rol },
        });

        return usuario;
    }

    async listar(
        filtros: ListarUsuarioQueryDTO,
        usuarioEjecutorId: string,
    ): Promise<IUsuario[]> {
        await this.permisosService.obtenerComoAdmin(usuarioEjecutorId);
        return this.usuarioRepository.listar(filtros);
    }

    async buscarPorId(
        id: string,
        usuarioId: string,
        rolUsuario: string,
    ): Promise<IUsuario> {
        return this.permisosService.obtenerConAccesoPropioOAdmin(
            id,
            usuarioId,
            rolUsuario,
        );
    }

    async actualizar(
        id: string,
        dto: ActualizarUsuarioDTO,
        usuarioId: string,
        rolUsuario: string,
    ): Promise<IUsuario> {
        await this.permisosService.obtenerConAccesoPropioOAdmin(
            id,
            usuarioId,
            rolUsuario,
        );

        if (dto.correo) {
            const existente = await this.usuarioRepository.buscarPorCorreo(
                dto.correo,
            );
            if (existente && existente._id.toString() !== id) {
                throw HttpError.conflict(
                    'El email ya está en uso por otro usuario',
                );
            }
        }

        const actualizado = await this.usuarioRepository.actualizar(id, dto);
        if (!actualizado) throw HttpError.notFound('Usuario no encontrado');

        await this.actividadService.registrar({
            usuarioId,
            accion: AccionActividad.Actualizar,
            recursoTipo: TipoRecurso.Usuario,
            recursoId: id,
            recursoNombre: actualizado.nombre,
        });

        return actualizado;
    }

    async desactivar(id: string, usuarioEjecutorId: string): Promise<IUsuario> {
        await this.permisosService.obtenerComoAdmin(usuarioEjecutorId);

        if (id === usuarioEjecutorId) {
            throw HttpError.badRequest('No puedes desactivar tu propia cuenta');
        }

        const desactivado = await this.usuarioRepository.desactivar(id);
        if (!desactivado) throw HttpError.notFound('Usuario no encontrado');

        await this.actividadService.registrar({
            usuarioId: usuarioEjecutorId,
            accion: AccionActividad.Desactivar,
            recursoTipo: TipoRecurso.Usuario,
            recursoId: id,
            recursoNombre: desactivado.nombre,
        });

        return desactivado;
    }
}
