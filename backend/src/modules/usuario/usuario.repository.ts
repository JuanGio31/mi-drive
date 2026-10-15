import { ListarUsuarioQueryDTO } from './usuario.dto';
import { IUsuario, UsuarioModel } from './usuario.model';

/**
 * Interfaz para el repositorio de usuarios
 */
export interface IUsuarioRepository {
    crear(data: Partial<IUsuario>): Promise<IUsuario>;
    buscarPorId(id: string): Promise<IUsuario | null>;
    buscarPorCorreo(correo: string): Promise<IUsuario | null>;
    buscarPorCorreoConPassword(correo: string): Promise<IUsuario | null>;
    listar(filtros: ListarUsuarioQueryDTO): Promise<IUsuario[]>;
    actualizar(id: string, data: Partial<IUsuario>): Promise<IUsuario | null>;
    desactivar(id: string): Promise<IUsuario | null>;
    reactivar(id: string): Promise<IUsuario | null>;
}

/**
 * Implementacion del repositorio de usuarios
 */
export class MongoUsuarioRepository implements IUsuarioRepository {
    async crear(data: Partial<IUsuario>): Promise<IUsuario> {
        return UsuarioModel.create(data);
    }

    async buscarPorId(id: string): Promise<IUsuario | null> {
        return UsuarioModel.findById(id).exec();
    }

    async buscarPorCorreo(correo: string): Promise<IUsuario | null> {
        return UsuarioModel.findOne({ correo }).exec();
    }

    async buscarPorCorreoConPassword(correo: string): Promise<IUsuario | null> {
        return UsuarioModel.findOne({ correo: correo.toLowerCase() })
            .select('+passwordHash')
            .exec();
    }

    async listar(filtros: ListarUsuarioQueryDTO): Promise<IUsuario[]> {
        const query: Record<string, unknown> = {};

        if (filtros.rol) query.rol = filtros.rol;
        if (filtros.activo) query.activo = filtros.activo;

        const limit = filtros.limit ?? 50;
        const page = filtros.page ?? 1;

        return UsuarioModel.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 })
            .exec();
    }

    async actualizar(
        id: string,
        data: Partial<IUsuario>,
    ): Promise<IUsuario | null> {
        return UsuarioModel.findByIdAndUpdate(id, data, {
            returnDocument: 'after',
            runValidators: true,
        }).exec();
    }

    async desactivar(id: string): Promise<IUsuario | null> {
        return UsuarioModel.findByIdAndUpdate(
            id,
            {
                activo: false,
            },
            {
                returnDocument: 'after',
            },
        ).exec();
    }

    async reactivar(id: string): Promise<IUsuario | null> {
        return UsuarioModel.findByIdAndUpdate(
            id,
            {
                activo: true,
            },
            {
                returnDocument: 'after',
            },
        ).exec();
    }
}
