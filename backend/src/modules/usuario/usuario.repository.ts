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
    buscarPorIdConPassword(id: string): Promise<IUsuario | null>;
    listar(filtros: ListarUsuarioQueryDTO): Promise<IUsuario[]>;
    contar(filtros: ListarUsuarioQueryDTO): Promise<number>;
    directorio(): Promise<
        Pick<IUsuario, '_id' | 'nombre' | 'correo' | 'rol'>[]
    >;
    actualizar(id: string, data: Partial<IUsuario>): Promise<IUsuario | null>;
    actualizarPassword(
        id: string,
        passwordHash: string,
    ): Promise<IUsuario | null>;
    desactivar(id: string): Promise<IUsuario | null>;
    reactivar(id: string): Promise<IUsuario | null>;
}

/**
 * Implementacion del repositorio de usuarios
 */
export class MongoUsuarioRepository implements IUsuarioRepository {
    /** Inserta un nuevo usuario en la colección. */
    async crear(data: Partial<IUsuario>): Promise<IUsuario> {
        return UsuarioModel.create(data);
    }

    /** Busca un usuario por ID sin cargar el hash de contraseña. */
    async buscarPorId(id: string): Promise<IUsuario | null> {
        return UsuarioModel.findById(id).exec();
    }

    /** Busca un usuario por correo exacto (sin contraseña). */
    async buscarPorCorreo(correo: string): Promise<IUsuario | null> {
        return UsuarioModel.findOne({ correo }).exec();
    }

    /**
     * Busca por correo normalizado a minúsculas e incluye `passwordHash` para
     * validar credenciales en el login.
     */
    async buscarPorCorreoConPassword(correo: string): Promise<IUsuario | null> {
        return UsuarioModel.findOne({ correo: correo.toLowerCase() })
            .select('+passwordHash')
            .exec();
    }

    /** Busca por id incluyendo el hash para verificar la contraseña actual. */
    async buscarPorIdConPassword(id: string): Promise<IUsuario | null> {
        return UsuarioModel.findById(id).select('+passwordHash').exec();
    }

    /** Lista usuarios con filtros opcionales de rol, estado y paginación. */
    async listar(filtros: ListarUsuarioQueryDTO): Promise<IUsuario[]> {
        const limit = filtros.limit ?? 50;
        const page = filtros.page ?? 1;

        return UsuarioModel.find(this.construirQuery(filtros))
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 })
            .exec();
    }

    /** Cuenta usuarios con los mismos filtros que `listar` (para paginación). */
    async contar(filtros: ListarUsuarioQueryDTO): Promise<number> {
        return UsuarioModel.countDocuments(this.construirQuery(filtros)).exec();
    }

    /** Usuarios activos (id, nombre, correo, rol): para compartir y resolver nombres. */
    async directorio(): Promise<
        Pick<IUsuario, '_id' | 'nombre' | 'correo' | 'rol'>[]
    > {
        return UsuarioModel.find({ activo: true })
            .select('nombre correo rol')
            .sort({ nombre: 1 })
            .exec();
    }

    /** Actualiza parcialmente un usuario y devuelve el documento resultante. */
    async actualizar(
        id: string,
        data: Partial<IUsuario>,
    ): Promise<IUsuario | null> {
        return UsuarioModel.findByIdAndUpdate(id, data, {
            returnDocument: 'after',
            runValidators: true,
        }).exec();
    }

    /** Persiste el nuevo hash de contraseña. */
    async actualizarPassword(
        id: string,
        passwordHash: string,
    ): Promise<IUsuario | null> {
        return UsuarioModel.findByIdAndUpdate(
            id,
            { passwordHash },
            { returnDocument: 'after' },
        ).exec();
    }

    /** Desactiva una cuenta (soft delete) manteniendo el documento. */
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

    /** Reactiva una cuenta previamente desactivada. */
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

    /** Construye el filtro de Mongo a partir de los filtros de la API. */
    private construirQuery(
        filtros: ListarUsuarioQueryDTO,
    ): Record<string, unknown> {
        const query: Record<string, unknown> = {};

        if (filtros.rol) query.rol = filtros.rol;
        if (filtros.activo !== undefined) query.activo = filtros.activo;

        return query;
    }
}
