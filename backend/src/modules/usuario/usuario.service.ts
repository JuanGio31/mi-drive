import bcrypt from 'bcrypt';
import { IUsuarioRepository } from './usuario.repository';
import { ActividadService } from '../actividad/actividad.service';
import { IUsuario } from './usuario.model';
import { HttpError } from '../../shared/errors/http-error';
import { env } from '../../shared/config/env';
import { UsuarioPermisosService } from './usuario-permisos.services';
import {
    ActualizarUsuarioDTO,
    CambiarPasswordDTO,
    CrearUsuarioDTO,
    ListarUsuarioQueryDTO,
} from './usuario.dto';
import { AccionActividad, Rol, TipoRecurso } from '../../shared/types/enums';

/**
 * Servicio de usuarios. Aplica las reglas de rol y autoservicio, protege
 * contraseñas con bcrypt y audita altas, cambios y cambios de estado.
 */
export class UsuarioService {
    constructor(
        private readonly usuarioRepository: IUsuarioRepository,
        private readonly permisosService: UsuarioPermisosService,
        private readonly actividadService: ActividadService,
    ) {}

    /**
     * Crea un usuario desde el panel de administración. Exige rol admin,
     * rechaza correos duplicados y guarda el hash de la contraseña.
     */
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

    /** Lista usuarios con paginación y total para el panel de administración. */
    async listar(
        filtros: ListarUsuarioQueryDTO,
        usuarioEjecutorId: string,
    ): Promise<{
        usuarios: IUsuario[];
        total: number;
        page: number;
        limit: number;
    }> {
        await this.permisosService.obtenerComoAdmin(usuarioEjecutorId);

        const page = filtros.page ?? 1;
        const limit = filtros.limit ?? 50;
        const [usuarios, total] = await Promise.all([
            this.usuarioRepository.listar(filtros),
            this.usuarioRepository.contar(filtros),
        ]);

        return { usuarios, total, page, limit };
    }

    /** Usuarios activos (id, nombre, correo, rol). Accesible a cualquier usuario autenticado. */
    async directorio(): Promise<
        Pick<IUsuario, '_id' | 'nombre' | 'correo' | 'rol'>[]
    > {
        return this.usuarioRepository.directorio();
    }

    /** Devuelve un usuario propio o cualquiera si el solicitante es admin. */
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

    /**
     * Actualiza nombre/correo del propio usuario o de cualquiera si es admin.
     * Cambiar `activo` y `rol` queda reservado a administradores; un admin no
     * puede cambiarse el rol a sí mismo.
     */
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

        const cambios: Partial<IUsuario> = {};
        if (dto.nombre !== undefined) cambios.nombre = dto.nombre;
        if (dto.correo !== undefined) cambios.correo = dto.correo;
        if (dto.activo !== undefined) {
            if (rolUsuario !== Rol.Administrador) {
                throw HttpError.forbidden(
                    'Solo un administrador puede cambiar el estado del usuario',
                );
            }
            if (id === usuarioId) {
                throw HttpError.badRequest(
                    'No puedes desactivar tu propia cuenta',
                );
            }
            cambios.activo = dto.activo;
        }
        if (dto.rol !== undefined) {
            if (rolUsuario !== Rol.Administrador) {
                throw HttpError.forbidden(
                    'Solo un administrador puede cambiar el rol del usuario',
                );
            }
            if (id === usuarioId) {
                throw HttpError.badRequest('No puedes cambiar tu propio rol');
            }
            cambios.rol = dto.rol as Rol;
        }

        const actualizado = await this.usuarioRepository.actualizar(
            id,
            cambios,
        );
        if (!actualizado) throw HttpError.notFound('Usuario no encontrado');

        await this.actividadService.registrar({
            usuarioId,
            accion: AccionActividad.Actualizar,
            recursoTipo: TipoRecurso.Usuario,
            recursoId: id,
            recursoNombre: actualizado.nombre,
            ...(dto.rol ? { metadata: { rol: actualizado.rol } } : {}),
        });

        return actualizado;
    }

    /**
     * Cambia la contraseña del propio usuario. Exige la contraseña actual
     * (se verifica con bcrypt) y registra la acción en la actividad.
     */
    async cambiarPassword(
        id: string,
        dto: CambiarPasswordDTO,
        usuarioId: string,
    ): Promise<void> {
        if (id !== usuarioId) {
            throw HttpError.forbidden(
                'Solo puedes cambiar tu propia contraseña',
            );
        }

        const usuario = await this.usuarioRepository.buscarPorIdConPassword(id);
        if (!usuario) throw HttpError.notFound('Usuario no encontrado');

        const passwordValido = await bcrypt.compare(
            dto.passwordActual,
            usuario.passwordHash,
        );
        if (!passwordValido) {
            throw HttpError.badRequest('La contraseña actual no es correcta');
        }

        const passwordHash = await bcrypt.hash(
            dto.passwordNueva,
            env.BCRYPT_ROUNDS,
        );
        await this.usuarioRepository.actualizarPassword(id, passwordHash);

        await this.actividadService.registrar({
            usuarioId,
            accion: AccionActividad.Actualizar,
            recursoTipo: TipoRecurso.Usuario,
            recursoId: id,
            recursoNombre: usuario.nombre,
            metadata: { campo: 'password' },
        });
    }

    /** Desactiva una cuenta (soft delete). Un admin no puede desactivarse. */
    async desactivar(id: string, usuarioEjecutorId: string): Promise<IUsuario> {
        await this.permisosService.obtenerComoAdmin(usuarioEjecutorId);

        if (id === usuarioEjecutorId) {
            throw HttpError.badRequest('No puedes desactivar tu propia cuenta');
        }

        const usuario = await this.usuarioRepository.buscarPorId(id);
        if (!usuario) throw HttpError.notFound('Usuario no encontrado');
        if (!usuario.activo) {
            throw HttpError.badRequest('El usuario ya está desactivado');
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

    /** Reactiva un usuario desactivado (solo administradores). */
    async reactivar(id: string, usuarioEjecutorId: string): Promise<IUsuario> {
        await this.permisosService.obtenerComoAdmin(usuarioEjecutorId);

        const usuario = await this.usuarioRepository.buscarPorId(id);
        if (!usuario) throw HttpError.notFound('Usuario no encontrado');
        if (usuario.activo) {
            throw HttpError.badRequest('El usuario ya está activo');
        }

        const reactivado = await this.usuarioRepository.reactivar(id);
        if (!reactivado) throw HttpError.notFound('Usuario no encontrado');

        await this.actividadService.registrar({
            usuarioId: usuarioEjecutorId,
            accion: AccionActividad.Reactivar,
            recursoTipo: TipoRecurso.Usuario,
            recursoId: id,
            recursoNombre: reactivado.nombre,
        });

        return reactivado;
    }
}
