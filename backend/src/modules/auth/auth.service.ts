import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../shared/config/env';
import { HttpError } from '../../shared/errors/http-error';
import { IUsuario } from '../usuario/usuario.model';
import { IUsuarioRepository } from '../usuario/usuario.repository';
import { LoginDTO, RegistroDTO } from './auth.dto';
import { Rol } from '../../shared/types/enums';

export interface LoginResult {
    token: string;
    usuario: {
        id: string;
        nombre: string;
        correo: string;
        rol: string;
    };
}

export class AuthService {
    constructor(private readonly usuarioService: IUsuarioRepository) {}

    /**
     * Metodo para iniciar sesion en el sistema.
     *
     * <p>
     * se busca el usuario por correo y se valida que exista, que este activo
     * y que la contraseña sea correcta, y se genera el token
     * </p>
     *
     * @param dto LoginDTO (correo y contraseña)
     * @returns interface LoginResult (token + usuario)
     */
    async signIn(dto: LoginDTO): Promise<LoginResult> {
        const usuario = await this.usuarioService.buscarPorCorreoConPassword(
            dto.correo,
        );

        if (!usuario) throw HttpError.unauthorized('Credenciales inválidas');
        if (!usuario.activo) {
            throw HttpError.forbidden(
                'El usuario se encuentra desactivado, contactar con el administrador',
            );
        }

        const passwordValido = await bcrypt.compare(
            dto.password,
            usuario.passwordHash,
        );

        if (!passwordValido) {
            throw HttpError.unauthorized('Credenciales inválidas');
        }

        const tokenGenerado = this.generarToken(usuario);

        return {
            token: tokenGenerado,
            usuario: {
                id: usuario._id.toString(),
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol,
            },
        };
    }

    /**
     * Metodo para registrar un nuevo usuario.
     *
     * <p>
     * se busca el usuario por correo y se valida que no exista,
     * se encripta la contraseña, se crea el usuario y se genera
     * el token
     * </p>
     *
     * @param dto RegistroDTO (informacion del usuario)
     * @returns interface LoginResult (token + usuario)
     */
    async signUp(dto: RegistroDTO): Promise<LoginResult> {
        const existente = await this.usuarioService.buscarPorCorreo(dto.correo);

        if (existente) throw HttpError.conflict('El correo ya está en uso');

        const passwordHash = await bcrypt.hash(
            dto.password,
            env.BYCRYPT_ROUNDS,
        );

        const usuario = await this.usuarioService.crear({
            ...dto,
            passwordHash,
            rol: Rol.Usuario,
            activo: true,
        });

        const tokenGenerado = this.generarToken(usuario);

        return {
            token: tokenGenerado,
            usuario: {
                id: usuario._id.toString(),
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol,
            },
        };
    }

    private generarToken(usuario: IUsuario): string {
        const payload = {
            id: usuario._id.toString(),
            correo: usuario.correo,
            rol: usuario.rol,
        };

        return jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: env.JWT_EXPIRES_IN,
        } as SignOptions);
    }
}
