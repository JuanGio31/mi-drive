import { Types } from 'mongoose';
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
        carpetasCompartidasIds: string[],
    ): Promise<IArchivo[]>;
    listarCompartidosCon(usuarioId: string): Promise<IArchivo[]>;
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
    restaurar(archivoId: string): Promise<IArchivo | null>;
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
     * Lista archivos segun los filtros. Icluye:
     * - Los archivos propios dentro de la carpeta padre o la raiz
     * - Los archivos dentro de carpetas compartidas con el usuario
     * - Los archivos compartidos con el usuario
     */
    async listar(
        usuarioId: string,
        filtros: ListarArchivosQueryDTO,
        carpetasCompartidasIds: string[],
    ): Promise<IArchivo[]> {
        const usuarioObjId = new Types.ObjectId(usuarioId);
        const carpetaPadre = filtros.carpetaPadre ?? null;

        const condiciones: Record<string, unknown>[] = [];

        // Archivos propios
        condiciones.push({
            propietario: usuarioObjId,
            carpetaPadre: carpetaPadre
                ? new Types.ObjectId(carpetaPadre)
                : null,
            enPapelera: false,
        });

        // Archivos compartidos con el usuario
        if (filtros.incluirCompartidas && carpetasCompartidasIds.length > 0) {
            condiciones.push({
                carpetaPadre: {
                    $in: carpetasCompartidasIds.map(
                        (id) => new Types.ObjectId(id),
                    ),
                },
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

    async enviarAPapelera(archivoId: string): Promise<IArchivo | null> {
        return ArchivoModel.findByIdAndUpdate(
            archivoId,
            {
                enPapelera: true,
                fechaEnvioPapelera: new Date(),
            },
            {
                returnDocument: 'after',
            },
        ).exec();
    }

    async restaurar(archivoId: string): Promise<IArchivo | null> {
        return ArchivoModel.findByIdAndUpdate(
            archivoId,
            {
                enPapelera: false,
                fechaEnvioPapelera: null,
            },
            {
                returnDocument: 'after',
            },
        ).exec();
    }

    async eliminarPermanente(archivoId: string): Promise<void> {
        await ArchivoModel.findByIdAndDelete(archivoId).exec();
    }
}
