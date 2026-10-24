import { Types } from 'mongoose';
import { ArchivoModel } from '../archivo/archivo.model';
import { CarpetaModel } from '../carpeta/carpeta.model';
import { UsuarioModel } from '../usuario/usuario.model';
import { ActividadModel } from '../actividad/actividad.model';
import {
    ArchivoMasCompartidoReporte,
    ArchivoMasOperacionesReporte,
    ArchivoNuncaCompartidoReporte,
    ArchivoPorRangoReporte,
    ArchivoPorTipoReporte,
    CarpetaMasArchivosReporte,
    PaginaArchivos,
    RecursoCompartidoReporte,
    RecursosCompartidosReporte,
    RecursosRecibidosReporte,
    ResumenAdmin,
    TopUsuarioReporte,
    UsuarioMasCompartidosReporte,
} from './reporte.types';

/**
 * Genera una etapa `$lookup` contra la colección `usuarios`.
 *
 * @param localField campo del documento actual que contiene el ID de usuario
 * @param as nombre del arreglo donde se deposita el usuario encontrado
 */
const lookupUsuario = (localField: string, as: string) => ({
    $lookup: {
        from: 'usuarios',
        localField,
        foreignField: '_id',
        as,
    },
});

interface ConteoCarpeta {
    directos: number;
    totales: number;
}

interface CarpetaConPropietario {
    _id: Types.ObjectId;
    nombre: string;
    propietario: {
        id: string;
        nombre: string;
        correo: string;
    };
}

export interface IReporteRepository {
    resumen(): Promise<ResumenAdmin>;
    archivosPorTipo(): Promise<ArchivoPorTipoReporte[]>;
    archivosPorRango(
        desde: Date | undefined,
        hasta: Date | undefined,
        page: number,
        limit: number,
    ): Promise<PaginaArchivos<ArchivoPorRangoReporte>>;
    archivosConMasOperaciones(
        limite: number,
    ): Promise<ArchivoMasOperacionesReporte[]>;
    topUsuariosConMasArchivos(limite: number): Promise<TopUsuarioReporte[]>;
    usuariosConMasCompartidos(
        limite: number,
    ): Promise<UsuarioMasCompartidosReporte[]>;
    archivosMasCompartidos(
        limite: number,
    ): Promise<ArchivoMasCompartidoReporte[]>;
    recursosCompartidosPorUsuario(
        usuarioId: string,
    ): Promise<RecursosCompartidosReporte>;
    recursosRecibidosPorUsuario(
        usuarioId: string,
    ): Promise<RecursosRecibidosReporte>;
    archivosNuncaCompartidos(
        page: number,
        limit: number,
    ): Promise<PaginaArchivos<ArchivoNuncaCompartidoReporte>>;
    carpetasConMasArchivos(
        limite: number,
    ): Promise<CarpetaMasArchivosReporte[]>;
}

/**
 * Repositorio de reportes basado en agregaciones de solo lectura.
 *
 * Trabaja sobre las colecciones `archivos`, `carpetas`, `usuarios` y
 * `actividades`. Los conteos de almacenamiento usan el campo persistido
 * `tamanio` y, salvo el reporte histórico de operaciones, excluyen los
 * documentos en papelera. Los permisos se calculan a partir de
 * `compartidoCon` y de la jerarquía `carpetaPadre`; no se escribe nada.
 */
export class MongoReporteRepository implements IReporteRepository {
    // Resumen del dashboard

    /**
     * Totales globales para las tarjetas KPI del administrador.
     *
     * Cuenta archivos activos y su tamaño, carpetas activas, usuarios totales
     * y activos, y recursos con al menos una compartición directa.
     */
    async resumen(): Promise<ResumenAdmin> {
        const [
            archivos,
            carpetas,
            usuarios,
            archivosCompartidos,
            carpetasCompartidas,
        ] = await Promise.all([
            ArchivoModel.aggregate<{ total: number; tamañoTotal: number }>([
                { $match: { enPapelera: false } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        tamañoTotal: { $sum: '$tamanio' },
                    },
                },
            ]).exec(),
            CarpetaModel.countDocuments({ enPapelera: false }).exec(),
            UsuarioModel.aggregate<{ total: number; activos: number }>([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        activos: { $sum: { $cond: ['$activo', 1, 0] } },
                    },
                },
            ]).exec(),
            ArchivoModel.countDocuments({
                enPapelera: false,
                'compartidoCon.0': { $exists: true },
            }).exec(),
            CarpetaModel.countDocuments({
                enPapelera: false,
                'compartidoCon.0': { $exists: true },
            }).exec(),
        ]);

        const archivosTotales = archivos[0] ?? {
            total: 0,
            tamañoTotal: 0,
        };
        const usuariosTotales = usuarios[0] ?? { total: 0, activos: 0 };

        return {
            archivos: {
                total: archivosTotales.total,
                tamañoTotal: archivosTotales.tamañoTotal,
            },
            carpetas: { total: carpetas },
            usuarios: {
                total: usuariosTotales.total,
                activos: usuariosTotales.activos,
                inactivos: usuariosTotales.total - usuariosTotales.activos,
            },
            compartidos: {
                archivos: archivosCompartidos,
                carpetas: carpetasCompartidas,
                total: archivosCompartidos + carpetasCompartidas,
            },
        };
    }

    // Reportes de archivos

    /**
     * Distribución de archivos activos por extensión.
     *
     * Agrupa por `tipo`, suma cantidad y `tamanio`, y ordena de mayor a menor
     * cantidad. Solo considera archivos fuera de la papelera.
     */
    async archivosPorTipo(): Promise<ArchivoPorTipoReporte[]> {
        return ArchivoModel.aggregate<ArchivoPorTipoReporte>([
            { $match: { enPapelera: false } },
            {
                $group: {
                    _id: '$tipo',
                    total: { $sum: 1 },
                    tamañoTotal: { $sum: '$tamanio' },
                },
            },
            { $sort: { total: -1, _id: 1 } },
            {
                $project: {
                    _id: 0,
                    tipo: '$_id',
                    total: 1,
                    tamañoTotal: 1,
                },
            },
        ]).exec();
    }

    /**
     * Archivos activos creados dentro de un rango, con envelope paginado.
     *
     * Filtra por `createdAt`, ordena del más reciente al más antiguo y resuelve
     * el propietario con `$lookup`. Devuelve `{ archivos, total, page, limit }`.
     */
    async archivosPorRango(
        desde: Date | undefined,
        hasta: Date | undefined,
        page: number,
        limit: number,
    ): Promise<PaginaArchivos<ArchivoPorRangoReporte>> {
        const match = this.construirMatchRango(desde, hasta);

        const [archivos, total] = await Promise.all([
            ArchivoModel.aggregate<ArchivoPorRangoReporte>([
                { $match: match },
                { $sort: { createdAt: -1, _id: -1 } },
                { $skip: (page - 1) * limit },
                { $limit: limit },
                lookupUsuario('propietario', 'propietarioInfo'),
                { $unwind: '$propietarioInfo' },
                {
                    $project: {
                        _id: 0,
                        id: { $toString: '$_id' },
                        nombre: 1,
                        tipo: 1,
                        tamaño: '$tamanio',
                        createdAt: 1,
                        propietario: {
                            id: { $toString: '$propietarioInfo._id' },
                            nombre: '$propietarioInfo.nombre',
                            correo: '$propietarioInfo.correo',
                        },
                    },
                },
            ]).exec(),
            ArchivoModel.countDocuments(match).exec(),
        ]);

        return { archivos, total, page, limit };
    }

    /**
     * Archivos con más operaciones históricas.
     *
     * Se calcula desde `actividades`, por lo que incluye archivos hoy en
     * papelera o eliminados definitivamente. El nombre se toma de la operación
     * más reciente y el estado se resuelve con el documento actual:
     * `activo`, `en_papelera` o `eliminado_definitivamente`.
     */
    async archivosConMasOperaciones(
        limite: number,
    ): Promise<ArchivoMasOperacionesReporte[]> {
        return ActividadModel.aggregate<ArchivoMasOperacionesReporte>([
            // Solo operaciones asociadas a un archivo concreto.
            { $match: { recursoTipo: 'archivo', recursoId: { $ne: null } } },

            // Agrupa por archivo: total, última fecha, acciones y nombre reciente.
            {
                $group: {
                    _id: '$recursoId',
                    recursoNombre: {
                        $top: {
                            sortBy: { createdAt: -1, _id: -1 },
                            output: '$recursoNombre',
                        },
                    },
                    totalOperaciones: { $sum: 1 },
                    ultimaOperacion: { $max: '$createdAt' },
                    acciones: { $addToSet: '$accion' },
                },
            },

            // Orden estable y corte del top solicitado.
            { $sort: { totalOperaciones: -1, _id: 1 } },
            { $limit: limite },

            // Recupera el archivo actual para inferir su estado real.
            {
                $lookup: {
                    from: 'archivos',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'archivoActual',
                },
            },
            {
                $addFields: {
                    archivoActual: {
                        $ifNull: [
                            { $arrayElemAt: ['$archivoActual', 0] },
                            null,
                        ],
                    },
                },
            },

            // Proyecta el reporte y deriva el estado desde el documento actual.
            {
                $project: {
                    _id: 0,
                    recursoId: { $toString: '$_id' },
                    recursoNombre: 1,
                    totalOperaciones: 1,
                    ultimaOperacion: 1,
                    acciones: 1,
                    estado: {
                        $switch: {
                            branches: [
                                {
                                    case: {
                                        $eq: ['$archivoActual', null],
                                    },
                                    then: 'eliminado_definitivamente',
                                },
                                {
                                    case: {
                                        $eq: [
                                            '$archivoActual.enPapelera',
                                            true,
                                        ],
                                    },
                                    then: 'en_papelera',
                                },
                            ],
                            default: 'activo',
                        },
                    },
                },
            },
        ]).exec();
    }

    // Reportes de usuarios

    /**
     * Top de usuarios por cantidad de archivos activos en propiedad.
     *
     * Suma cantidad y `tamanio` por `propietario`, resuelve los datos del
     * usuario y ordena por total de archivos.
     */
    async topUsuariosConMasArchivos(
        limite: number,
    ): Promise<TopUsuarioReporte[]> {
        return ArchivoModel.aggregate<TopUsuarioReporte>([
            { $match: { enPapelera: false } },
            {
                $group: {
                    _id: '$propietario',
                    totalArchivos: { $sum: 1 },
                    tamañoTotal: { $sum: '$tamanio' },
                },
            },
            { $sort: { totalArchivos: -1, _id: 1 } },
            { $limit: limite },
            lookupUsuario('_id', 'usuario'),
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

    /**
     * Ranking por recursos compartidos directamente.
     *
     * Une archivos y carpetas activos con al menos un destinatario, agrupa por
     * propietario y cuenta cada recurso una sola vez. `personasAlcanzadas` es
     * el número de usuarios únicos entre todos sus recursos compartidos; los
     * descendientes de una carpeta no inflan el total.
     */
    async usuariosConMasCompartidos(
        limite: number,
    ): Promise<UsuarioMasCompartidosReporte[]> {
        return ArchivoModel.aggregate<UsuarioMasCompartidosReporte>([
            // Recursos compartidos: archivos...
            {
                $match: {
                    'compartidoCon.0': { $exists: true },
                    enPapelera: false,
                },
            },
            {
                $project: {
                    propietario: 1,
                    esArchivo: { $literal: 1 },
                    esCarpeta: { $literal: 0 },
                    destinatarios: '$compartidoCon.usuario',
                },
            },
            // ...y carpetas, normalizados con los mismos campos.
            {
                $unionWith: {
                    coll: 'carpetas',
                    pipeline: [
                        {
                            $match: {
                                'compartidoCon.0': { $exists: true },
                                enPapelera: false,
                            },
                        },
                        {
                            $project: {
                                propietario: 1,
                                esArchivo: { $literal: 0 },
                                esCarpeta: { $literal: 1 },
                                destinatarios: '$compartidoCon.usuario',
                            },
                        },
                    ],
                },
            },
            // Agrupa por propietario y acumula los destinatarios de cada recurso.
            {
                $group: {
                    _id: '$propietario',
                    archivosCompartidos: { $sum: '$esArchivo' },
                    carpetasCompartidas: { $sum: '$esCarpeta' },
                    destinatarios: { $push: '$destinatarios' },
                },
            },
            // Deduplica destinatarios y calcula el total de recursos compartidos.
            {
                $addFields: {
                    personasAlcanzadas: {
                        $size: {
                            $reduce: {
                                input: '$destinatarios',
                                initialValue: [],
                                in: {
                                    $setUnion: ['$$value', '$$this'],
                                },
                            },
                        },
                    },
                    totalCompartidos: {
                        $add: ['$archivosCompartidos', '$carpetasCompartidas'],
                    },
                },
            },
            { $sort: { totalCompartidos: -1, _id: 1 } },
            { $limit: limite },
            lookupUsuario('_id', 'usuario'),
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

    // Reportes de compartición

    /**
     * Archivos con más usuarios con acceso efectivo.
     *
     * Combina comparticiones directas con las heredadas de todas las carpetas
     * ancestro, deduplica usuarios y excluye al propietario. Ordena por número
     * de usuarios con acceso y corta el top solicitado.
     */
    async archivosMasCompartidos(
        limite: number,
    ): Promise<ArchivoMasCompartidoReporte[]> {
        return ArchivoModel.aggregate<ArchivoMasCompartidoReporte>([
            { $match: { enPapelera: false } },

            // Reúne la cadena completa de carpetas ancestro activas.
            {
                $graphLookup: {
                    from: 'carpetas',
                    startWith: '$carpetaPadre',
                    connectFromField: 'carpetaPadre',
                    connectToField: '_id',
                    as: 'carpetasAncestras',
                    maxDepth: 20,
                    restrictSearchWithMatch: { enPapelera: false },
                },
            },
            // Une los destinatarios directos con los heredados de cada ancestro.
            {
                $project: {
                    nombre: 1,
                    tipo: 1,
                    propietario: 1,
                    usuarios: {
                        $setUnion: [
                            {
                                $map: {
                                    input: '$compartidoCon',
                                    as: 'compartido',
                                    in: '$$compartido.usuario',
                                },
                            },
                            {
                                $reduce: {
                                    input: '$carpetasAncestras',
                                    initialValue: [],
                                    in: {
                                        $concatArrays: [
                                            '$$value',
                                            {
                                                $map: {
                                                    input: '$$this.compartidoCon',
                                                    as: 'compartido',
                                                    in: '$$compartido.usuario',
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            // El propietario no cuenta como usuario con acceso compartido.
            {
                $addFields: {
                    usuarios: {
                        $setDifference: ['$usuarios', ['$propietario']],
                    },
                },
            },
            {
                $addFields: {
                    numUsuarios: { $size: '$usuarios' },
                },
            },
            // Descarta archivos sin destinatarios efectivos.
            { $match: { numUsuarios: { $gt: 0 } } },
            { $sort: { numUsuarios: -1, _id: 1 } },
            { $limit: limite },
            lookupUsuario('propietario', 'propietarioInfo'),
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

    /**
     * Recursos compartidos directamente por un usuario.
     *
     * Consulta en paralelo archivos y carpetas activos cuyo propietario es el
     * usuario y que tienen al menos un destinatario. Devuelve ambos listados
     * con la cantidad de usuarios por recurso.
     */
    async recursosCompartidosPorUsuario(
        usuarioId: string,
    ): Promise<RecursosCompartidosReporte> {
        const objId = new Types.ObjectId(usuarioId);

        const [archivos, carpetas] = await Promise.all([
            ArchivoModel.aggregate<{
                _id: Types.ObjectId;
                nombre: string;
                tipo: string;
                numUsuarios: number;
            }>([
                {
                    $match: {
                        propietario: objId,
                        'compartidoCon.0': { $exists: true },
                        enPapelera: false,
                    },
                },
                {
                    $project: {
                        nombre: 1,
                        tipo: 1,
                        numUsuarios: { $size: '$compartidoCon' },
                    },
                },
                { $sort: { numUsuarios: -1, _id: 1 } },
            ]).exec(),
            CarpetaModel.aggregate<{
                _id: Types.ObjectId;
                nombre: string;
                numUsuarios: number;
            }>([
                {
                    $match: {
                        propietario: objId,
                        'compartidoCon.0': { $exists: true },
                        enPapelera: false,
                    },
                },
                {
                    $project: {
                        nombre: 1,
                        numUsuarios: { $size: '$compartidoCon' },
                    },
                },
                { $sort: { numUsuarios: -1, _id: 1 } },
            ]).exec(),
        ]);

        return {
            archivos: archivos.map((archivo) => ({
                id: archivo._id.toString(),
                nombre: archivo.nombre,
                tipo: archivo.tipo,
                numUsuarios: archivo.numUsuarios,
            })),
            carpetas: carpetas.map((carpeta) => ({
                id: carpeta._id.toString(),
                nombre: carpeta.nombre,
                numUsuarios: carpeta.numUsuarios,
            })),
        };
    }

    /**
     * Recursos recibidos directamente por un usuario, sin herencia.
     *
     * Busca archivos y carpetas activos donde el usuario aparece en
     * `compartidoCon`, resuelve al propietario y extrae el permiso directo.
     * No incluye accesos obtenidos por pertenecer a una carpeta compartida.
     */
    async recursosRecibidosPorUsuario(
        usuarioId: string,
    ): Promise<RecursosRecibidosReporte> {
        const objId = new Types.ObjectId(usuarioId);

        // Etapas comunes: datos del propietario y permiso del usuario receptor.
        const lookupYProyeccion = [
            lookupUsuario('propietario', 'propietarioInfo'),
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
                                            as: 'compartido',
                                            cond: {
                                                $eq: [
                                                    '$$compartido.usuario',
                                                    objId,
                                                ],
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
            // Archivos recibidos directamente.
            ArchivoModel.aggregate<RecursoCompartidoReporte>([
                {
                    $match: {
                        'compartidoCon.usuario': objId,
                        enPapelera: false,
                    },
                },
                { $sort: { nombre: 1, _id: 1 } },
                ...lookupYProyeccion,
            ]).exec(),
            // Carpetas recibidas directamente.
            CarpetaModel.aggregate<RecursoCompartidoReporte>([
                {
                    $match: {
                        'compartidoCon.usuario': objId,
                        enPapelera: false,
                    },
                },
                { $sort: { nombre: 1, _id: 1 } },
                ...lookupYProyeccion,
            ]).exec(),
        ]);

        return {
            archivos:
                archivos as unknown as RecursosRecibidosReporte['archivos'],
            carpetas:
                carpetas as unknown as RecursosRecibidosReporte['carpetas'],
        };
    }

    /**
     * Archivos activos sin compartición directa y fuera de cualquier carpeta
     * compartida o descendiente de una.
     *
     * Primero obtiene las carpetas expuestas por herencia; luego filtra los
     * archivos que no tienen `compartidoCon` y cuya carpeta padre no está en
     * ese conjunto. Devuelve un envelope paginado con propietario y ubicación.
     */
    async archivosNuncaCompartidos(
        page: number,
        limit: number,
    ): Promise<PaginaArchivos<ArchivoNuncaCompartidoReporte>> {
        const carpetasExpuestas = await this.obtenerCarpetasExpuestas();
        const match: Record<string, unknown> = {
            enPapelera: false,
            'compartidoCon.0': { $exists: false },
        };

        // Excluye archivos cuyo padre pertenece a un árbol compartido.
        if (carpetasExpuestas.length > 0) {
            match.carpetaPadre = { $nin: carpetasExpuestas };
        }

        const [archivos, total] = await Promise.all([
            ArchivoModel.aggregate<ArchivoNuncaCompartidoReporte>([
                { $match: match },
                { $sort: { createdAt: -1, _id: -1 } },
                { $skip: (page - 1) * limit },
                { $limit: limit },

                // Datos del propietario y de la carpeta contenedora.
                lookupUsuario('propietario', 'propietarioInfo'),
                { $unwind: '$propietarioInfo' },
                {
                    $lookup: {
                        from: 'carpetas',
                        localField: 'carpetaPadre',
                        foreignField: '_id',
                        as: 'carpetaInfo',
                    },
                },
                {
                    $unwind: {
                        path: '$carpetaInfo',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        id: { $toString: '$_id' },
                        nombre: 1,
                        tipo: 1,
                        tamaño: '$tamanio',
                        createdAt: 1,
                        propietario: {
                            id: { $toString: '$propietarioInfo._id' },
                            nombre: '$propietarioInfo.nombre',
                            correo: '$propietarioInfo.correo',
                        },
                        carpeta: {
                            $cond: [
                                { $ifNull: ['$carpetaInfo', false] },
                                {
                                    id: { $toString: '$carpetaInfo._id' },
                                    nombre: '$carpetaInfo.nombre',
                                },
                                null,
                            ],
                        },
                    },
                },
            ]).exec(),
            ArchivoModel.countDocuments(match).exec(),
        ]);

        return { archivos, total, page, limit };
    }

    /**
     * Carpetas activas con más archivos.
     *
     * Calcula por separado `archivosDirectos` (hijos inmediatos) y
     * `archivosTotales` (todo el subárbol). Los totales usan `$graphLookup`
     * para asignar cada archivo a todas sus carpetas ancestro; luego se
     * combinan ambos conteos, se ordena por totales y se enriquece con los
     * datos del propietario.
     */
    async carpetasConMasArchivos(
        limite: number,
    ): Promise<CarpetaMasArchivosReporte[]> {
        const [directos, totales] = await Promise.all([
            // Conteo de archivos por carpeta padre inmediata.
            ArchivoModel.aggregate<{
                _id: Types.ObjectId;
                archivosDirectos: number;
            }>([
                {
                    $match: {
                        enPapelera: false,
                        carpetaPadre: { $ne: null },
                    },
                },
                {
                    $group: {
                        _id: '$carpetaPadre',
                        archivosDirectos: { $sum: 1 },
                    },
                },
            ]).exec(),
            // Conteo del subárbol: suma cada archivo a todos sus ancestros.
            ArchivoModel.aggregate<{
                _id: Types.ObjectId;
                archivosTotales: number;
            }>([
                {
                    $match: {
                        enPapelera: false,
                        carpetaPadre: { $ne: null },
                    },
                },
                {
                    $graphLookup: {
                        from: 'carpetas',
                        startWith: '$carpetaPadre',
                        connectFromField: 'carpetaPadre',
                        connectToField: '_id',
                        as: 'ancestros',
                        maxDepth: 20,
                        restrictSearchWithMatch: { enPapelera: false },
                    },
                },
                {
                    $project: {
                        carpetas: {
                            $setUnion: [['$carpetaPadre'], '$ancestros._id'],
                        },
                    },
                },
                { $unwind: '$carpetas' },
                {
                    $group: {
                        _id: '$carpetas',
                        archivosTotales: { $sum: 1 },
                    },
                },
            ]).exec(),
        ]);

        // Combina ambas fuentes en un solo mapa por carpeta.
        const conteos = new Map<string, ConteoCarpeta>();
        for (const item of directos) {
            conteos.set(item._id.toString(), {
                directos: item.archivosDirectos,
                totales: 0,
            });
        }
        for (const item of totales) {
            const id = item._id.toString();
            const actual = conteos.get(id) ?? { directos: 0, totales: 0 };
            actual.totales = item.archivosTotales;
            conteos.set(id, actual);
        }

        const ordenados = [...conteos.entries()]
            .sort(
                ([idA, a], [idB, b]) =>
                    b.totales - a.totales ||
                    b.directos - a.directos ||
                    idA.localeCompare(idB),
            )
            .slice(0, limite);

        if (ordenados.length === 0) return [];

        // Trae los datos de las carpetas del top para completar el reporte.
        const carpetas = await CarpetaModel.aggregate<CarpetaConPropietario>([
            {
                $match: {
                    _id: {
                        $in: ordenados.map(([id]) => new Types.ObjectId(id)),
                    },
                    enPapelera: false,
                },
            },
            lookupUsuario('propietario', 'propietarioInfo'),
            { $unwind: '$propietarioInfo' },
            {
                $project: {
                    _id: 1,
                    nombre: 1,
                    propietario: {
                        id: { $toString: '$propietarioInfo._id' },
                        nombre: '$propietarioInfo.nombre',
                        correo: '$propietarioInfo.correo',
                    },
                },
            },
        ]).exec();

        const carpetasPorId = new Map(
            carpetas.map((carpeta) => [carpeta._id.toString(), carpeta]),
        );

        return ordenados.flatMap(([id, conteo]) => {
            const carpeta = carpetasPorId.get(id);
            if (!carpeta) return [];

            return [
                {
                    carpetaId: id,
                    nombre: carpeta.nombre,
                    propietario: carpeta.propietario,
                    archivosDirectos: conteo.directos,
                    archivosTotales: conteo.totales,
                },
            ];
        });
    }

    // Utilidades privadas

    /**
     * Construye el filtro de fecha de los reportes de archivos.
     *
     * Siempre excluye la papelera y agrega `createdAt` con los límites
     * inclusivos `$gte`/`$lte` cuando existen.
     */
    private construirMatchRango(
        desde?: Date,
        hasta?: Date,
    ): Record<string, unknown> {
        const match: Record<string, unknown> = { enPapelera: false };

        if (desde || hasta) {
            const rango: Record<string, Date> = {};
            if (desde) rango.$gte = desde;
            if (hasta) rango.$lte = hasta;
            match.createdAt = rango;
        }

        return match;
    }

    /**
     * Devuelve las carpetas compartidas activas y todos sus descendientes.
     *
     * Toma como raíces las carpetas con `compartidoCon` no vacío y usa
     * `$graphLookup` para incluir el subárbol. Se usa para excluir del reporte
     * de privacidad los archivos alcanzados por una compartición heredada.
     */
    private async obtenerCarpetasExpuestas(): Promise<Types.ObjectId[]> {
        const raicesDocs = await CarpetaModel.find({
            enPapelera: false,
            'compartidoCon.0': { $exists: true },
        })
            .select('_id')
            .lean()
            .exec();

        if (raicesDocs.length === 0) return [];

        const raices = raicesDocs.map((carpeta) => carpeta._id);
        const resultado = await CarpetaModel.aggregate<{
            ids: Types.ObjectId[];
        }>([
            { $match: { _id: { $in: raices } } },
            {
                $graphLookup: {
                    from: 'carpetas',
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'carpetaPadre',
                    as: 'descendientes',
                    maxDepth: 20,
                    restrictSearchWithMatch: { enPapelera: false },
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

        const ids = new Map<string, Types.ObjectId>();
        for (const raiz of raices) ids.set(raiz.toString(), raiz);
        for (const id of resultado[0]?.ids ?? []) ids.set(id.toString(), id);

        return [...ids.values()];
    }
}
