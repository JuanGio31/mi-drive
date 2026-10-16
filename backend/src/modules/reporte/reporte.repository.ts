import { Types } from 'mongoose';
import { ArchivoModel } from '../archivo/archivo.model';
import { CarpetaModel } from '../carpeta/carpeta.model';
import { UsuarioModel } from '../usuario/usuario.model';
import { ActividadModel } from '../actividad/actividad.model';

export interface IReporteRepository {
    archivosPorTipo(): Promise<
        { tipo: string; total: number; tamañoTotal: number }[]
    >;
    archivosPorRango(desde?: Date, hasta?: Date): Promise<unknown[]>;
    archivosConMasOperaciones(limite: number): Promise<unknown[]>;
    topUsuariosConMasArchivos(limite: number): Promise<unknown[]>;
    usuariosConMasCompartidos(limite: number): Promise<unknown[]>;
    archivosMasCompartidos(limite: number): Promise<unknown[]>;
    recursosCompartidosPorUsuario(usuarioId: string): Promise<unknown>;
    recursosRecibidosPorUsuario(usuarioId: string): Promise<unknown>;
}

export class MongoReporteRepository implements IReporteRepository {
    // ============ Reportes de archivos ============

    async archivosPorTipo() {
        return ArchivoModel.aggregate([
            { $match: { enPapelera: false } },
            {
                $group: {
                    _id: '$tipo',
                    total: { $sum: 1 },
                    tamañoTotal: { $sum: '$tamaño' },
                },
            },
            {
                $project: {
                    _id: 0,
                    tipo: '$_id',
                    total: 1,
                    tamañoTotal: 1,
                },
            },
            { $sort: { total: -1 } },
        ]).exec();
    }

    async archivosPorRango(desde?: Date, hasta?: Date) {
        const match: Record<string, unknown> = { enPapelera: false };

        if (desde || hasta) {
            const rango: Record<string, Date> = {};
            if (desde) rango.$gte = desde;
            if (hasta) rango.$lte = hasta;
            match.createdAt = rango;
        }

        return ArchivoModel.aggregate([
            { $match: match },
            { $sort: { createdAt: -1 } },
            { $limit: 200 },
            {
                $lookup: {
                    from: 'usuarios',
                    localField: 'propietario',
                    foreignField: '_id',
                    as: 'propietarioInfo',
                },
            },
            { $unwind: '$propietarioInfo' },
            {
                $project: {
                    _id: 0,
                    id: { $toString: '$_id' },
                    nombre: 1,
                    tipo: 1,
                    tamaño: 1,
                    createdAt: 1,
                    propietario: {
                        id: { $toString: '$propietarioInfo._id' },
                        nombre: '$propietarioInfo.nombre',
                        correo: '$propietarioInfo.correo',
                    },
                },
            },
        ]).exec();
    }

    async archivosConMasOperaciones(limite: number) {
        return ActividadModel.aggregate([
            { $match: { recursoTipo: 'archivo', recursoId: { $ne: null } } },
            {
                $group: {
                    _id: '$recursoId',
                    recursoNombre: { $last: '$recursoNombre' },
                    totalOperaciones: { $sum: 1 },
                    ultimaOperacion: { $max: '$createdAt' },
                    acciones: { $addToSet: '$accion' },
                },
            },
            { $sort: { totalOperaciones: -1 } },
            { $limit: limite },
            {
                $project: {
                    _id: 0,
                    recursoId: { $toString: '$_id' },
                    recursoNombre: 1,
                    totalOperaciones: 1,
                    ultimaOperacion: 1,
                    acciones: 1,
                },
            },
        ]).exec();
    }

    // ============ Reportes de usuarios ============

    async topUsuariosConMasArchivos(limite: number) {
        return ArchivoModel.aggregate([
            { $match: { enPapelera: false } },
            {
                $group: {
                    _id: '$propietario',
                    totalArchivos: { $sum: 1 },
                    tamañoTotal: { $sum: '$tamaño' },
                },
            },
            { $sort: { totalArchivos: -1 } },
            { $limit: limite },
            {
                $lookup: {
                    from: 'usuarios',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'usuario',
                },
            },
            { $unwind: '$usuario' },
            {
                $project: {
                    _id: 0,
                    usuarioId: { $toString: '$usuario._id' },
                    nombre: '$usuario.nombre',
                    correo: '$usuario.correo',
                    rol: '$usuario.rol',
                    totalArchivos: 1,
                    tamañoTotal: 1,
                },
            },
        ]).exec();
    }

    async usuariosConMasCompartidos(limite: number) {
        return ArchivoModel.aggregate([
            { $match: { 'compartidoCon.0': { $exists: true } } },
            {
                $project: {
                    propietario: 1,
                    esArchivo: { $literal: 1 },
                    esCarpeta: { $literal: 0 },
                    numCompartidos: { $size: '$compartidoCon' },
                },
            },
            {
                $unionWith: {
                    coll: 'carpetas',
                    pipeline: [
                        { $match: { 'compartidoCon.0': { $exists: true } } },
                        {
                            $project: {
                                propietario: 1,
                                esArchivo: { $literal: 0 },
                                esCarpeta: { $literal: 1 },
                                numCompartidos: { $size: '$compartidoCon' },
                            },
                        },
                    ],
                },
            },
            {
                $group: {
                    _id: '$propietario',
                    archivosCompartidos: { $sum: '$esArchivo' },
                    carpetasCompartidas: { $sum: '$esCarpeta' },
                    personasAlcanzadas: { $sum: '$numCompartidos' },
                },
            },
            {
                $addFields: {
                    totalCompartidos: {
                        $add: ['$archivosCompartidos', '$carpetasCompartidas'],
                    },
                },
            },
            { $sort: { totalCompartidos: -1 } },
            { $limit: limite },
            {
                $lookup: {
                    from: 'usuarios',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'usuario',
                },
            },
            { $unwind: '$usuario' },
            {
                $project: {
                    _id: 0,
                    usuarioId: { $toString: '$usuario._id' },
                    nombre: '$usuario.nombre',
                    correo: '$usuario.correo',
                    rol: '$usuario.rol',
                    archivosCompartidos: 1,
                    carpetasCompartidas: 1,
                    personasAlcanzadas: 1,
                    totalCompartidos: 1,
                },
            },
        ]).exec();
    }

    // ============ Reportes de compartición ============

    async archivosMasCompartidos(limite: number) {
        return ArchivoModel.aggregate([
            {
                $match: {
                    'compartidoCon.0': { $exists: true },
                    enPapelera: false,
                },
            },
            {
                $project: {
                    nombre: 1,
                    tipo: 1,
                    propietario: 1,
                    numUsuarios: { $size: '$compartidoCon' },
                    compartidoCon: 1,
                },
            },
            { $sort: { numUsuarios: -1 } },
            { $limit: limite },
            {
                $lookup: {
                    from: 'usuarios',
                    localField: 'propietario',
                    foreignField: '_id',
                    as: 'propietarioInfo',
                },
            },
            { $unwind: '$propietarioInfo' },
            {
                $project: {
                    _id: 0,
                    archivoId: { $toString: '$_id' },
                    nombre: 1,
                    tipo: 1,
                    numUsuarios: 1,
                    propietario: {
                        id: { $toString: '$propietarioInfo._id' },
                        nombre: '$propietarioInfo.nombre',
                    },
                },
            },
        ]).exec();
    }

    async recursosCompartidosPorUsuario(usuarioId: string) {
        const objId = new Types.ObjectId(usuarioId);

        const [archivos, carpetas] = await Promise.all([
            ArchivoModel.aggregate([
                {
                    $match: {
                        propietario: objId,
                        'compartidoCon.0': { $exists: true },
                    },
                },
                {
                    $project: {
                        nombre: 1,
                        tipo: 1,
                        numUsuarios: { $size: '$compartidoCon' },
                        compartidoCon: 1,
                    },
                },
                { $sort: { numUsuarios: -1 } },
            ]).exec(),
            CarpetaModel.aggregate([
                {
                    $match: {
                        propietario: objId,
                        'compartidoCon.0': { $exists: true },
                    },
                },
                {
                    $project: {
                        nombre: 1,
                        numUsuarios: { $size: '$compartidoCon' },
                        compartidoCon: 1,
                    },
                },
                { $sort: { numUsuarios: -1 } },
            ]).exec(),
        ]);

        return {
            archivos: archivos.map((a) => ({
                id: a._id.toString(),
                nombre: a.nombre,
                tipo: a.tipo,
                numUsuarios: a.numUsuarios,
            })),
            carpetas: carpetas.map((c) => ({
                id: c._id.toString(),
                nombre: c.nombre,
                numUsuarios: c.numUsuarios,
            })),
        };
    }

    async recursosRecibidosPorUsuario(usuarioId: string) {
        const objId = new Types.ObjectId(usuarioId);

        const lookupYProyeccion = [
            {
                $lookup: {
                    from: 'usuarios',
                    localField: 'propietario',
                    foreignField: '_id',
                    as: 'propietarioInfo',
                },
            },
            { $unwind: '$propietarioInfo' },
            {
                $project: {
                    _id: 0,
                    id: { $toString: '$_id' },
                    nombre: 1,
                    tipo: 1,
                    miPermiso: {
                        $let: {
                            vars: {
                                matchUser: {
                                    $first: {
                                        $filter: {
                                            input: '$compartidoCon',
                                            as: 'c',
                                            cond: {
                                                $eq: ['$$c.usuario', objId],
                                            },
                                        },
                                    },
                                },
                            },
                            in: '$$matchUser.permiso',
                        },
                    },
                    propietario: {
                        id: { $toString: '$propietarioInfo._id' },
                        nombre: '$propietarioInfo.nombre',
                    },
                },
            },
        ];

        const [archivos, carpetas] = await Promise.all([
            ArchivoModel.aggregate([
                {
                    $match: {
                        'compartidoCon.usuario': objId,
                        enPapelera: false,
                    },
                },
                ...lookupYProyeccion,
            ]).exec(),
            CarpetaModel.aggregate([
                {
                    $match: {
                        'compartidoCon.usuario': objId,
                        enPapelera: false,
                    },
                },
                ...lookupYProyeccion,
            ]).exec(),
        ]);

        return {
            archivos,
            carpetas,
        };
    }
}
