import { Types } from 'mongoose';
import { CarpetaModel, ICarpeta, ICompartidoCon } from './carpeta.model';

/** Contrato de persistencia de carpetas en MongoDB. */
export interface ICarpetaRepository {
    crear(data: Partial<ICarpeta>): Promise<ICarpeta>;
    buscarPorId(id: string): Promise<ICarpeta | null>;
    listarPorPropietarioYPadre(
        propietarioId: string,
        carpetaPadre: string | null,
    ): Promise<ICarpeta[]>;
    listarCompartidasCon(usuarioId: string): Promise<ICarpeta[]>;
    actualizar(id: string, data: Partial<ICarpeta>): Promise<ICarpeta | null>;
    existeCarpetaConNombre(
        propietarioId: string,
        carpetaPadre: string | null,
        nombre: string,
        excluirId?: string,
    ): Promise<boolean>;
    // Para prevenir ciclos
    obtenerDescendientesIds(carpetaId: string): Promise<string[]>;
    // Compartidos
    agregarCompartido(
        carpetaId: string,
        compartido: ICompartidoCon,
    ): Promise<ICarpeta | null>;
    quitarCompartido(
        carpetaId: string,
        usuarioId: string,
    ): Promise<ICarpeta | null>;
    actualizarPermiso(
        carpetaId: string,
        usuarioId: string,
        permiso: ICompartidoCon['permiso'],
    ): Promise<ICarpeta | null>;
    // Papelera
    enviarAPapelera(id: string): Promise<ICarpeta | null>;
    restaurar(id: string): Promise<ICarpeta | null>;
    eliminarPermanente(id: string): Promise<void>;
    // Búsqueda en el árbol para validar acceso
    buscarPorIdYUsuario(
        carpetaId: string,
        usuarioId: string,
    ): Promise<ICarpeta | null>;
}

/** Implementación en MongoDB del repositorio de carpetas. */
export class MongoCarpetaRepository implements ICarpetaRepository {
    /** Inserta una nueva carpeta en la colección. */
    async crear(data: Partial<ICarpeta>): Promise<ICarpeta> {
        return CarpetaModel.create(data);
    }

    /** Busca una carpeta por su ID sin validar permisos. */
    async buscarPorId(id: string): Promise<ICarpeta | null> {
        return CarpetaModel.findById(id).exec();
    }

    /** Lista las carpetas activas de un propietario dentro de un padre, ordenadas por nombre. */
    async listarPorPropietarioYPadre(
        propietarioId: string,
        carpetaPadre: string | null,
    ): Promise<ICarpeta[]> {
        return CarpetaModel.find({
            propietario: new Types.ObjectId(propietarioId),
            carpetaPadre: carpetaPadre
                ? new Types.ObjectId(carpetaPadre)
                : null,
            enPapelera: false,
        })
            .sort({ nombre: 1 })
            .exec();
    }

    /** Lista las carpetas activas compartidas con un usuario, ordenadas por actualización. */
    async listarCompartidasCon(usuarioId: string): Promise<ICarpeta[]> {
        return CarpetaModel.find({
            'compartidoCon.usuario': new Types.ObjectId(usuarioId),
            enPapelera: false,
        })
            .sort({ updatedAt: -1 })
            .exec();
    }

    /** Actualiza parcialmente una carpeta y devuelve el documento resultante. */
    async actualizar(
        id: string,
        data: Partial<ICarpeta>,
    ): Promise<ICarpeta | null> {
        return CarpetaModel.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        }).exec();
    }

    /** Revisa si ya existe una carpeta activa con el mismo nombre en la ubicación (para evitar duplicados). */
    async existeCarpetaConNombre(
        propietarioId: string,
        carpetaPadre: string | null,
        nombre: string,
        excluirId?: string,
    ): Promise<boolean> {
        const query: Record<string, unknown> = {
            propietario: new Types.ObjectId(propietarioId),
            carpetaPadre: carpetaPadre
                ? new Types.ObjectId(carpetaPadre)
                : null,
            nombre,
            enPapelera: false,
        };

        if (excluirId) {
            query._id = { $ne: new Types.ObjectId(excluirId) };
        }

        const existe = await CarpetaModel.exists(query);
        return existe !== null;
    }

    /**
     * Devuelve todos los IDs de los descendientes de una carpeta.
     * Se usa para prevenir ciclos al mover.
     */
    async obtenerDescendientesIds(carpetaId: string): Promise<string[]> {
        const resultado: string[] = [];
        const cola: Types.ObjectId[] = [new Types.ObjectId(carpetaId)];

        while (cola.length > 0) {
            const padreId = cola.shift()!;
            const hijos = await CarpetaModel.find({ carpetaPadre: padreId })
                .select('_id')
                .exec();

            for (const hijo of hijos) {
                resultado.push(hijo._id.toString());
                cola.push(hijo._id);
            }
        }

        return resultado;
    }

    /** Agrega un usuario a la lista de compartidos de la carpeta. */
    async agregarCompartido(
        carpetaId: string,
        compartido: ICompartidoCon,
    ): Promise<ICarpeta | null> {
        return CarpetaModel.findByIdAndUpdate(
            carpetaId,
            { $push: { compartidoCon: compartido } },
            { returnDocument: 'after' },
        ).exec();
    }

    /** Quita un usuario de la lista de compartidos de la carpeta. */
    async quitarCompartido(
        carpetaId: string,
        usuarioId: string,
    ): Promise<ICarpeta | null> {
        return CarpetaModel.findByIdAndUpdate(
            carpetaId,
            {
                $pull: {
                    compartidoCon: { usuario: new Types.ObjectId(usuarioId) },
                },
            },
            { returnDocument: 'after' },
        ).exec();
    }

    /** Cambia el permiso de un usuario ya compartido en la carpeta. */
    async actualizarPermiso(
        carpetaId: string,
        usuarioId: string,
        permiso: ICompartidoCon['permiso'],
    ): Promise<ICarpeta | null> {
        return CarpetaModel.findOneAndUpdate(
            {
                _id: new Types.ObjectId(carpetaId),
                'compartidoCon.usuario': new Types.ObjectId(usuarioId),
            },
            { $set: { 'compartidoCon.$.permiso': permiso } },
            { returnDocument: 'after' },
        ).exec();
    }

    /** Marca una carpeta como en papelera y registra la fecha de envío. */
    async enviarAPapelera(id: string): Promise<ICarpeta | null> {
        return CarpetaModel.findByIdAndUpdate(
            id,
            { enPapelera: true, fechaEnvioPapelera: new Date() },
            { returnDocument: 'after' },
        ).exec();
    }

    /** Saca una carpeta de la papelera y limpia su fecha de envío. */
    async restaurar(id: string): Promise<ICarpeta | null> {
        return CarpetaModel.findByIdAndUpdate(
            id,
            { enPapelera: false, fechaEnvioPapelera: null },
            { returnDocument: 'after' },
        ).exec();
    }

    /** Elimina definitivamente una carpeta de la base de datos. */
    async eliminarPermanente(id: string): Promise<void> {
        await CarpetaModel.findByIdAndDelete(id).exec();
    }

    /** Busca una carpeta por ID solo si el usuario es dueño o está en compartidos. */
    async buscarPorIdYUsuario(
        carpetaId: string,
        usuarioId: string,
    ): Promise<ICarpeta | null> {
        return CarpetaModel.findOne({
            _id: new Types.ObjectId(carpetaId),
            $or: [
                { propietario: new Types.ObjectId(usuarioId) },
                { 'compartidoCon.usuario': new Types.ObjectId(usuarioId) },
            ],
        }).exec();
    }
}
