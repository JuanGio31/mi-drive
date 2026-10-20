import { Types } from 'mongoose';
import { escaparRegex } from '../../shared/utils/regex';
import { ListarArchivosQueryDTO } from './archivo.dto';
import { ArchivoModel, IArchivo, ICompartidoArchivo } from './archivo.model';

export interface ICarpetaInfoParaArchivo {
    id: string;
    propietario: string;
    compartidoCon: { usuario: string; permiso: string }[];
    enPapelera: boolean;
}

export interface IArchivoRepository {
    crear(data: Partial<IArchivo>): Promise<IArchivo>;
    buscarPorId(id: string): Promise<IArchivo | null>;
    listar(
        usuarioId: string,
        filtros: ListarArchivosQueryDTO,
        accesoPadre: boolean,
    ): Promise<IArchivo[]>;
    listarCompartidosCon(usuarioId: string): Promise<IArchivo[]>;
    /** Busca archivos accesibles por nombre (coincidencia parcial, sin distinguir mayúsculas). */
    buscarPorNombre(
        usuarioId: string,
        carpetasCompartidasIds: string[],
        texto: string,
        limite: number,
    ): Promise<IArchivo[]>;
    listarPapelera(propietarioId: string): Promise<IArchivo[]>;
    actualizar(id: string, data: Partial<IArchivo>): Promise<IArchivo | null>;
    existeArchivoConNombre(
        propietarioId: string,
        carpetaPadre: string | null,
        nombre: string,
        excluirId?: string,
    ): Promise<boolean>;
    agregarCompartido(
        archivoId: string,
        compartido: ICompartidoArchivo,
    ): Promise<IArchivo | null>;
    quitarCompartido(
        archivoId: string,
        usuarioId: string,
    ): Promise<IArchivo | null>;
    actualizarPermiso(
        archivoId: string,
        usuarioId: string,
        permiso: ICompartidoArchivo['permiso'],
    ): Promise<IArchivo | null>;
    enviarAPapelera(archivoId: string): Promise<IArchivo | null>;
    enviarAPapeleraPorCarpetas(
        carpetaIds: string[],
        raizId: string,
    ): Promise<number>;
    restaurar(archivoId: string): Promise<IArchivo | null>;
    restaurarPorCarpetaRaiz(raizId: string): Promise<number>;
    actualizarPropietarioPorCarpetas(
        carpetaIds: string[],
        propietarioId: string,
    ): Promise<void>;
    eliminarPermanente(archivoId: string): Promise<void>;
}

export class MongoArchivoRepository implements IArchivoRepository {
    async crear(data: Partial<IArchivo>): Promise<IArchivo> {
        return ArchivoModel.create(data);
    }

    async buscarPorId(id: string): Promise<IArchivo | null> {
        return ArchivoModel.findById(id).exec();
    }

    /**
     * Lista archivos según los filtros. Incluye:
     * - Los archivos propios de la carpeta padre o la raíz.
     * - Todos los archivos de la carpeta padre si el usuario tiene acceso
     *   (propio o heredado), evitando listas cruzadas entre carpetas.
     * - Los archivos compartidos directamente con el usuario.
     */
    async listar(
        usuarioId: string,
        filtros: ListarArchivosQueryDTO,
        accesoPadre: boolean,
    ): Promise<IArchivo[]> {
        const usuarioObjId = new Types.ObjectId(usuarioId);
        const carpetaPadre = filtros.carpetaPadre ?? null;

        const condiciones: Record<string, unknown>[] = [
            {
                propietario: usuarioObjId,
                carpetaPadre: carpetaPadre
                    ? new Types.ObjectId(carpetaPadre)
                    : null,
                enPapelera: false,
            },
        ];

        // Todos los archivos de la carpeta actual si el usuario tiene acceso
        if (carpetaPadre && accesoPadre) {
            condiciones.push({
                carpetaPadre: new Types.ObjectId(carpetaPadre),
                enPapelera: false,
            });
        }

        // Archivos compartidos directamente con el usuario
        if (filtros.incluirCompartidas) {
            condiciones.push({
                'compartidoCon.usuario': usuarioObjId,
                enPapelera: false,
            });
        }

        const query: Record<string, unknown> = {
            $or: condiciones,
        };

        if (filtros.tipo) query.tipo = filtros.tipo;
        if (filtros.busqueda) {
            query.$text = { $search: filtros.busqueda };
        }

        const limit = filtros.limit ?? 50;
        const page = filtros.page ?? 1;

        const proyeccion = filtros.incluirContenido ? '' : '-contenido';

        return ArchivoModel.find(query)
            .select(proyeccion)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ updatedAt: -1 })
            .exec();
    }

    async listarCompartidosCon(usuarioId: string): Promise<IArchivo[]> {
        return ArchivoModel.find({
            'compartidoCon.usuario': new Types.ObjectId(usuarioId),
            enPapelera: false,
        })
            .select('-contenido')
            .sort({ updatedAt: -1 })
            .exec();
    }

    /**
     * Busca por nombre entre los archivos a los que el usuario tiene acceso:
     * propios, compartidos directamente o dentro de carpetas compartidas.
     */
    async buscarPorNombre(
        usuarioId: string,
        carpetasCompartidasIds: string[],
        texto: string,
        limite: number,
    ): Promise<IArchivo[]> {
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

        return ArchivoModel.find({
            enPapelera: false,
            nombre: { $regex: escaparRegex(texto), $options: 'i' },
            $or: condiciones,
        })
            .select('-contenido')
            .limit(limite)
            .sort({ updatedAt: -1 })
            .exec();
    }

    /**
     * Lista solo las raíces de la papelera del usuario (el archivo enviado
     * explícitamente), no los hijos que cayeron por la cascada de una carpeta.
     */
    async listarPapelera(propietarioId: string): Promise<IArchivo[]> {
        return ArchivoModel.find({
            propietario: new Types.ObjectId(propietarioId),
            enPapelera: true,
            $expr: {
                $eq: [{ $ifNull: ['$papeleraRaiz', '$_id'] }, '$_id'],
            },
        })
            .select('-contenido')
            .sort({ fechaEnvioPapelera: -1 })
            .exec();
    }

    async actualizar(
        id: string,
        data: Partial<IArchivo>,
    ): Promise<IArchivo | null> {
        return ArchivoModel.findByIdAndUpdate(id, data, {
            returnDocument: 'after',
            runValidators: true,
        }).exec();
    }

    async existeArchivoConNombre(
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

        const existe = await ArchivoModel.exists(query);
        return existe !== null;
    }

    async agregarCompartido(
        archivoId: string,
        compartido: ICompartidoArchivo,
    ): Promise<IArchivo | null> {
        return ArchivoModel.findByIdAndUpdate(
            archivoId,
            {
                $push: { compartidoCon: compartido },
            },
            { returnDocument: 'after' },
        ).exec();
    }

    async quitarCompartido(
        archivoId: string,
        usuarioId: string,
    ): Promise<IArchivo | null> {
        return ArchivoModel.findByIdAndUpdate(
            archivoId,
            {
                $pull: {
                    compartidoCon: { usuario: new Types.ObjectId(usuarioId) },
                },
            },
            { returnDocument: 'after' },
        ).exec();
    }

    async actualizarPermiso(
        archivoId: string,
        usuarioId: string,
        permiso: ICompartidoArchivo['permiso'],
    ): Promise<IArchivo | null> {
        return ArchivoModel.findOneAndUpdate(
            {
                _id: new Types.ObjectId(archivoId),
                'compartidoCon.usuario': new Types.ObjectId(usuarioId),
            },
            {
                $set: {
                    'compartidoCon.$.permiso': permiso,
                },
            },
            { returnDocument: 'after' },
        ).exec();
    }

    /** Envía un archivo a la papelera y lo marca como raíz de su envío. */
    async enviarAPapelera(archivoId: string): Promise<IArchivo | null> {
        return ArchivoModel.findByIdAndUpdate(
            archivoId,
            {
                enPapelera: true,
                fechaEnvioPapelera: new Date(),
                papeleraRaiz: new Types.ObjectId(archivoId),
            },
            {
                returnDocument: 'after',
            },
        ).exec();
    }

    /**
     * Envía a la papelera los archivos de un subárbol con la raíz indicada.
     * Solo toca los activos para conservar envíos individuales previos.
     */
    async enviarAPapeleraPorCarpetas(
        carpetaIds: string[],
        raizId: string,
    ): Promise<number> {
        const resultado = await ArchivoModel.updateMany(
            {
                carpetaPadre: {
                    $in: carpetaIds.map((id) => new Types.ObjectId(id)),
                },
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

    /** Restaura un archivo y limpia su fecha y raíz de papelera. */
    async restaurar(archivoId: string): Promise<IArchivo | null> {
        return ArchivoModel.findByIdAndUpdate(
            archivoId,
            {
                enPapelera: false,
                fechaEnvioPapelera: null,
                papeleraRaiz: null,
            },
            {
                returnDocument: 'after',
            },
        ).exec();
    }

    /** Restaura los archivos que cayeron con la raíz de papelera indicada. */
    async restaurarPorCarpetaRaiz(raizId: string): Promise<number> {
        const resultado = await ArchivoModel.updateMany(
            { papeleraRaiz: new Types.ObjectId(raizId) },
            {
                enPapelera: false,
                fechaEnvioPapelera: null,
                papeleraRaiz: null,
            },
        ).exec();
        return resultado.modifiedCount;
    }

    /** Cambia el propietario de los archivos de un subárbol movido de unidad. */
    async actualizarPropietarioPorCarpetas(
        carpetaIds: string[],
        propietarioId: string,
    ): Promise<void> {
        await ArchivoModel.updateMany(
            {
                carpetaPadre: {
                    $in: carpetaIds.map((id) => new Types.ObjectId(id)),
                },
            },
            { propietario: new Types.ObjectId(propietarioId) },
        ).exec();
    }

    async eliminarPermanente(archivoId: string): Promise<void> {
        await ArchivoModel.findByIdAndDelete(archivoId).exec();
    }
}
