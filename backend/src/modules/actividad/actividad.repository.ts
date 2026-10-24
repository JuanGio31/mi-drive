import { Types } from 'mongoose';
import { ActividadModel, IActividad } from './actividad.model';
import { FiltrosActividad } from './actividad.dto';
import { TipoRecurso } from '../../shared/types/enums';

export interface IActividadRepository {
    crear(data: Partial<IActividad>): Promise<IActividad>;
    listar(filtros: FiltrosActividad): Promise<IActividad[]>;
    contar(filtros: FiltrosActividad): Promise<number>;
    /** Historial de un recurso concreto (archivo, carpeta o usuario). */
    listarPorRecurso(
        recursoTipo: TipoRecurso,
        recursoId: string,
    ): Promise<IActividad[]>;
    contarPorAccion(
        filtros: FiltrosActividad,
    ): Promise<{ accion: string; total: number }[]>;
    contarPorPeriodo(
        filtros: FiltrosActividad,
        unidad: 'dia' | 'mes' | 'año',
    ): Promise<{ periodo: string; total: number }[]>;
}

/** Implementación en MongoDB del historial de actividad. */
export class MongoActividadRepository implements IActividadRepository {
    /** Inserta un registro de actividad en la colección. */
    async crear(data: Partial<IActividad>): Promise<IActividad> {
        return ActividadModel.create(data);
    }

    /**
     * Lista actividades con filtros y paginación. Ordena de la más reciente a
     * la más antigua y usa `limit` 50 y `page` 1 por defecto.
     */
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

    /** Cuenta actividades con los mismos filtros que `listar`. */
    async contar(filtros: FiltrosActividad): Promise<number> {
        return ActividadModel.countDocuments(
            this.construirQuery(filtros),
        ).exec();
    }

    /**
     * Busca las últimas 200 actividades de un recurso. Tipar `recursoTipo`
     * como el enum del modelo evita el desajuste de overloads de Mongoose.
     */
    async listarPorRecurso(
        recursoTipo: TipoRecurso,
        recursoId: string,
    ): Promise<IActividad[]> {
        return ActividadModel.find({
            recursoTipo,
            recursoId: new Types.ObjectId(recursoId),
        })
            .sort({ createdAt: -1 })
            .limit(200)
            .exec();
    }

    /** Agrupa las actividades filtradas por acción y ordena por total. */
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

    /**
     * Agrupa las actividades filtradas por día, mes o año (en UTC, según el
     * formato de MongoDB) y las devuelve ordenadas cronológicamente.
     */
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

    // metodos privados

    /** Traduce los filtros de la API a un query de MongoDB con ObjectIds. */
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
