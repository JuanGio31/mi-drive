import { Types } from 'mongoose';
import { escaparRegex } from '../../shared/utils/regex';
import { CarpetaModel, ICarpeta, ICompartidoCon } from './carpeta.model';

/** Contrato de persistencia de carpetas en MongoDB. */
export interface ICarpetaRepository {
    crear(data: Partial<ICarpeta>): Promise<ICarpeta>;
    buscarPorId(id: string): Promise<ICarpeta | null>;
    listarPorPropietarioYPadre(
        propietarioId: string,
        carpetaPadre: string | null,
    ): Promise<ICarpeta[]>;
    listarPorPadre(carpetaPadre: string | null): Promise<ICarpeta[]>;
    listarCompartidasCon(
        usuarioId: string,
        carpetaPadre: string | null,
        incluirTodas?: boolean,
    ): Promise<ICarpeta[]>;
    listarDestacadas(usuarioId: string): Promise<ICarpeta[]>;
    /** Busca carpetas accesibles por nombre (coincidencia parcial, sin distinguir mayúsculas). */
    buscarPorNombre(
        usuarioId: string,
        texto: string,
        limite: number,
        carpetasCompartidasIds: string[],
    ): Promise<ICarpeta[]>;
    obtenerAncestros(ids: string[]): Promise<ICarpeta[]>;
    obtenerDescendientesDeVarias(ids: string[]): Promise<string[]>;
    listarPapelera(propietarioId: string): Promise<ICarpeta[]>;
    actualizar(id: string, data: Partial<ICarpeta>): Promise<ICarpeta | null>;
    actualizarDestacado(
        id: string,
        usuarioId: string,
        destacado: boolean,
    ): Promise<ICarpeta | null>;
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
    enviarAPapeleraCascada(ids: string[], raizId: string): Promise<number>;
    restaurar(id: string): Promise<ICarpeta | null>;
    restaurarCascada(raizId: string): Promise<number>;
    actualizarPropietarioArbol(
        ids: string[],
        propietarioId: string,
    ): Promise<void>;
    eliminarPermanente(id: string): Promise<void>;
    /** Elimina definitivamente un conjunto de carpetas del mismo subárbol. */
    eliminarPermanenteCascada(ids: string[]): Promise<number>;
    // Búsqueda en el árbol para validar acceso
    buscarPorIdYUsuario(
        carpetaId: string,
        usuarioId: string,
    ): Promise<ICarpeta | null>;
    buscarVariasPorIds(ids: string[]): Promise<ICarpeta[]>;
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

    /**
     * Lista todas las carpetas activas dentro de un padre, sin filtrar por
     * propietario. Se usa cuando el usuario tiene acceso heredado a la carpeta.
     */
    async listarPorPadre(carpetaPadre: string | null): Promise<ICarpeta[]> {
        return CarpetaModel.find({
            carpetaPadre: carpetaPadre
                ? new Types.ObjectId(carpetaPadre)
                : null,
            enPapelera: false,
        })
            .sort({ nombre: 1 })
            .exec();
    }

    /** Lista las carpetas activas compartidas con un usuario, ordenadas por actualización. */
    async listarCompartidasCon(
        usuarioId: string,
        carpetaPadre: string | null,
        incluirTodas = false,
    ): Promise<ICarpeta[]> {
        const filtro: Record<string, unknown> = {
            'compartidoCon.usuario': new Types.ObjectId(usuarioId),
            enPapelera: false,
        };

        if (!incluirTodas) {
            filtro.carpetaPadre = carpetaPadre
                ? new Types.ObjectId(carpetaPadre)
                : null;
        }

        return CarpetaModel.find(filtro).sort({ nombre: 1 }).exec();
    }

    /** Lista las carpetas marcadas por el usuario, ordenadas por nombre. */
    async listarDestacadas(usuarioId: string): Promise<ICarpeta[]> {
        return CarpetaModel.find({
            destacadoPor: new Types.ObjectId(usuarioId),
            enPapelera: false,
        })
            .sort({ nombre: 1 })
            .exec();
    }

    /**
     * Busca por nombre entre las carpetas del usuario, las compartidas con él
     * y las que están dentro de subárboles compartidos.
     */
    async buscarPorNombre(
        usuarioId: string,
        texto: string,
        limite: number,
        carpetasCompartidasIds: string[],
    ): Promise<ICarpeta[]> {
        const usuarioObjId = new Types.ObjectId(usuarioId);
        const condiciones: Record<string, unknown>[] = [
            { propietario: usuarioObjId },
            { 'compartidoCon.usuario': usuarioObjId },
        ];

        if (carpetasCompartidasIds.length > 0) {
            condiciones.push({
                carpetaPadre: {
                    $in: carpetasCompartidasIds.map(
                        (id) => new Types.ObjectId(id),
                    ),
                },
            });
        }

        return CarpetaModel.find({
            enPapelera: false,
            nombre: { $regex: escaparRegex(texto), $options: 'i' },
            $or: condiciones,
        })
            .limit(limite)
            .sort({ updatedAt: -1 })
            .exec();
    }

    /**
     * Devuelve las carpetas ancestro de los IDs indicados en una sola
     * agregación ($graphLookup), evitando una consulta por nivel.
     */
    async obtenerAncestros(ids: string[]): Promise<ICarpeta[]> {
        if (ids.length === 0) return [];

        return CarpetaModel.aggregate<ICarpeta>([
            {
                $match: {
                    _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
                },
            },
            {
                $graphLookup: {
                    from: 'carpetas',
                    startWith: '$carpetaPadre',
                    connectFromField: 'carpetaPadre',
                    connectToField: '_id',
                    as: 'ancestros',
                    depthField: 'profundidad',
                    maxDepth: 20,
                },
            },
            { $unwind: '$ancestros' },
            { $replaceRoot: { newRoot: '$ancestros' } },
            { $group: { _id: '$_id', doc: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$doc' } },
        ]).exec();
    }

    /**
     * Devuelve los descendientes de varias carpetas en una sola agregación.
     * Se usa para ampliar la búsqueda a los subárboles compartidos.
     */
    async obtenerDescendientesDeVarias(ids: string[]): Promise<string[]> {
        if (ids.length === 0) return [];

        const resultado = await CarpetaModel.aggregate<{
            ids: Types.ObjectId[];
        }>([
            {
                $match: {
                    _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
                },
            },
            {
                $graphLookup: {
                    from: 'carpetas',
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'carpetaPadre',
                    as: 'descendientes',
                    maxDepth: 20,
                },
            },
            { $unwind: '$descendientes' },
            {
                $group: {
                    _id: null,
                    ids: { $addToSet: '$descendientes._id' },
                },
            },
        ]).exec();

        return (resultado[0]?.ids ?? []).map((id) => id.toString());
    }

    /**
     * Lista solo las raíces de la papelera del usuario (la carpeta enviada
     * explícitamente), no cada descendiente de la cascada.
     */
    async listarPapelera(propietarioId: string): Promise<ICarpeta[]> {
        return CarpetaModel.find({
            propietario: new Types.ObjectId(propietarioId),
            enPapelera: true,
            $expr: {
                $eq: [{ $ifNull: ['$papeleraRaiz', '$_id'] }, '$_id'],
            },
        })
            .sort({ fechaEnvioPapelera: -1 })
            .exec();
    }

    /** Actualiza parcialmente una carpeta y devuelve el documento resultante. */
    async actualizar(
        id: string,
        data: Partial<ICarpeta>,
    ): Promise<ICarpeta | null> {
        return CarpetaModel.findByIdAndUpdate(id, data, {
            returnDocument: 'after',
            runValidators: true,
        }).exec();
    }

    async actualizarDestacado(
        id: string,
        usuarioId: string,
        destacado: boolean,
    ): Promise<ICarpeta | null> {
        const usuario = new Types.ObjectId(usuarioId);
        const update = destacado
            ? { $addToSet: { destacadoPor: usuario } }
            : { $pull: { destacadoPor: usuario } };

        return CarpetaModel.findByIdAndUpdate(id, update, {
            returnDocument: 'after',
            timestamps: false,
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
        const resultado = await CarpetaModel.aggregate([
            { $match: { _id: new Types.ObjectId(carpetaId) } },
            {
                $graphLookup: {
                    from: 'carpetas',
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'carpetaPadre',
                    as: 'descendientes',
                    maxDepth: 20, // limite de seguridad para prevenir ciclos
                },
            },
            {
                $project: {
                    _id: 0,
                    descendientesIds: '$descendientes._id',
                },
            },
        ]).exec();

        const ids: Types.ObjectId[] = resultado[0]?.descendientesIds ?? [];
        return ids.map((id) => id.toString());
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

    /** Marca una carpeta como en papelera y registra su raíz de papelera. */
    async enviarAPapelera(id: string): Promise<ICarpeta | null> {
        return CarpetaModel.findByIdAndUpdate(
            id,
            {
                enPapelera: true,
                fechaEnvioPapelera: new Date(),
                papeleraRaiz: new Types.ObjectId(id),
            },
            { returnDocument: 'after' },
        ).exec();
    }

    /**
     * Envía a la papelera varias carpetas con la misma raíz. Solo toca las que
     * estaban activas para no pisar envíos individuales previos.
     */
    async enviarAPapeleraCascada(
        ids: string[],
        raizId: string,
    ): Promise<number> {
        const resultado = await CarpetaModel.updateMany(
            {
                _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
                enPapelera: false,
            },
            {
                enPapelera: true,
                fechaEnvioPapelera: new Date(),
                papeleraRaiz: new Types.ObjectId(raizId),
            },
        ).exec();
        return resultado.modifiedCount;
    }

    /** Saca una carpeta de la papelera y limpia su fecha y raíz. */
    async restaurar(id: string): Promise<ICarpeta | null> {
        return CarpetaModel.findByIdAndUpdate(
            id,
            {
                enPapelera: false,
                fechaEnvioPapelera: null,
                papeleraRaiz: null,
            },
            { returnDocument: 'after' },
        ).exec();
    }

    /** Restaura todas las carpetas enviadas junto con la raíz indicada. */
    async restaurarCascada(raizId: string): Promise<number> {
        const resultado = await CarpetaModel.updateMany(
            { papeleraRaiz: new Types.ObjectId(raizId) },
            {
                enPapelera: false,
                fechaEnvioPapelera: null,
                papeleraRaiz: null,
            },
        ).exec();
        return resultado.modifiedCount;
    }

    /** Cambia el propietario de un subárbol completo al moverlo entre unidades. */
    async actualizarPropietarioArbol(
        ids: string[],
        propietarioId: string,
    ): Promise<void> {
        await CarpetaModel.updateMany(
            { _id: { $in: ids.map((id) => new Types.ObjectId(id)) } },
            { propietario: new Types.ObjectId(propietarioId) },
        ).exec();
    }

    /** Elimina definitivamente una carpeta de la base de datos. */
    async eliminarPermanente(id: string): Promise<void> {
        await CarpetaModel.findByIdAndDelete(id).exec();
    }

    /** Elimina definitivamente todas las carpetas del subárbol indicado. */
    async eliminarPermanenteCascada(ids: string[]): Promise<number> {
        if (ids.length === 0) return 0;

        const resultado = await CarpetaModel.deleteMany({
            _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
        }).exec();
        return resultado.deletedCount ?? 0;
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

    /** Busca varias carpetas por sus IDs. */
    async buscarVariasPorIds(ids: string[]): Promise<ICarpeta[]> {
        return CarpetaModel.find({
            _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
        }).exec();
    }
}
