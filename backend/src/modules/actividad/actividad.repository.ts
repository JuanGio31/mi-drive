import { Types } from 'mongoose';
import { ActividadModel, IActividad } from './actividad.model';
import { FiltrosActividad } from './actividad.dto';

export interface IActividadRepository {
    crear(data: Partial<IActividad>): Promise<IActividad>;
    listar(filtros: FiltrosActividad): Promise<IActividad[]>;
    listarPorRecurso(
        recursoTipo: string,
        recursoId: string,
    ): Promise<IActividad[]>;
    contarPorAccion(
        filtros: FiltrosActividad,
    ): Promise<{ accion: string; total: number }[]>;
    contarPorPeriodo(
        filtros: FiltrosActividad,
        unidad: 'dia' | 'mes' | 'año',
    ): Promise<{ periodo: string; total: number }[]>;
    archivosConMasOperaciones(
        limite: number,
    ): Promise<{ recursoId: string; recursoNombre: string; total: number }[]>;
}

export class MongoActividadRepository implements IActividadRepository {
    async crear(data: Partial<IActividad>): Promise<IActividad> {
        return ActividadModel.create(data);
    }

    async listar(filtros: FiltrosActividad): Promise<IActividad[]> {
        const query = this.construirQuery(filtros);

        const limit = filtros.limit ?? 50;
        const page = filtros.page ?? 1;

        return ActividadModel.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();
    }

    async listarPorRecurso(
        recursoTipo: string,
        recursoId: string,
    ): Promise<IActividad[]> {
        return ActividadModel.find({
            recursoTipo: { $eq: recursoTipo },
            recursoId: new Types.ObjectId(recursoId),
        })
            .sort({ createdAt: -1 })
            .limit(200)
            .exec();
    }

    async contarPorAccion(
        filtros: FiltrosActividad,
    ): Promise<{ accion: string; total: number }[]> {
        const query = this.construirQuery(filtros);

        return ActividadModel.aggregate([
            { $match: query },
            { $group: { _id: '$accion', total: { $sum: 1 } } },
            { $project: { _id: 0, accion: '$_id', total: 1 } },
            { $sort: { total: -1 } },
        ]).exec();
    }

    async contarPorPeriodo(
        filtros: FiltrosActividad,
        unidad: 'dia' | 'mes' | 'año',
    ): Promise<{ periodo: string; total: number }[]> {
        const query = this.construirQuery(filtros);

        const formatos = {
            dia: '%Y-%m-%d',
            mes: '%Y-%m',
            año: '%Y',
        };

        return ActividadModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: formatos[unidad],
                            date: '$createdAt',
                        },
                    },
                    total: { $sum: 1 },
                },
            },
            { $project: { _id: 0, periodo: '$_id', total: 1 } },
            { $sort: { periodo: 1 } },
        ]).exec();
    }

    async archivosConMasOperaciones(
        limite: number,
    ): Promise<{ recursoId: string; recursoNombre: string; total: number }[]> {
        return ActividadModel.aggregate([
            { $match: { recursoTipo: 'archivo', recursoId: { $ne: null } } },
            {
                $group: {
                    _id: '$recursoId',
                    recursoNombre: { $last: '$recursoNombre' },
                    total: { $sum: 1 },
                },
            },
            { $sort: { total: -1 } },
            { $limit: limite },
            {
                $project: {
                    _id: 0,
                    recursoId: { $toString: '$_id' },
                    recursoNombre: 1,
                    total: 1,
                },
            },
        ]).exec();
    }

    // metodos privados

    private construirQuery(filtros: FiltrosActividad): Record<string, unknown> {
        const query: Record<string, unknown> = {};

        if (filtros.usuarioId) {
            query.usuario = new Types.ObjectId(filtros.usuarioId);
        }
        if (filtros.accion) query.accion = filtros.accion;
        if (filtros.recursoTipo) query.recursoTipo = filtros.recursoTipo;
        if (filtros.recursoId) {
            query.recursoId = new Types.ObjectId(filtros.recursoId);
        }

        if (filtros.desde || filtros.hasta) {
            const rango: Record<string, Date> = {};
            if (filtros.desde) rango.$gte = new Date(filtros.desde);
            if (filtros.hasta) rango.$lte = new Date(filtros.hasta);
            query.createdAt = rango;
        }

        return query;
    }
}
