import { Document, model, Schema, Types } from 'mongoose';
import { NivelPermiso } from '../../shared/types/enums';

/** Entrada de la lista de compartidos: usuario, permiso y fecha. */
export interface ICompartidoCon {
    usuario: Types.ObjectId;
    permiso: NivelPermiso;
    fechaCompartido: Date;
}

/** Documento de carpeta: árbol por carpetaPadre, dueño, compartidos y papelera. */
export interface ICarpeta extends Document {
    _id: Types.ObjectId;
    nombre: string;
    propietario: Types.ObjectId;
    creadoPor: Types.ObjectId;
    carpetaPadre: Types.ObjectId | null;
    compartidoCon: ICompartidoCon[];
    destacadoPor: Types.ObjectId[];
    enPapelera: boolean;
    fechaEnvioPapelera: Date | null;
    papeleraRaiz: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const CompartidoConSchema = new Schema<ICompartidoCon>(
    {
        usuario: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
        },
        permiso: {
            type: String,
            enum: Object.values(NivelPermiso),
            required: true,
        },
        fechaCompartido: {
            type: Date,
            default: Date.now,
        },
    },
    {
        _id: false,
    },
);

const CarpetaSchema = new Schema<ICarpeta>(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
            minlength: 1,
            maxlength: 200,
        },
        propietario: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
            index: true,
        },
        creadoPor: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
            index: true,
        },
        carpetaPadre: {
            type: Schema.Types.ObjectId,
            ref: 'Carpeta',
            default: null,
            index: true,
        },
        compartidoCon: {
            type: [CompartidoConSchema],
            default: [],
        },
        destacadoPor: {
            type: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }],
            default: [],
        },
        enPapelera: {
            type: Boolean,
            default: false,
            index: true,
        },
        fechaEnvioPapelera: {
            type: Date,
            default: null,
        },
        papeleraRaiz: {
            type: Schema.Types.ObjectId,
            default: null,
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Indices compuestos para mejorar la busqueda
CarpetaSchema.index({ propietario: 1, carpetaPadre: 1, enPapelera: 1 });
CarpetaSchema.index({ carpetaPadre: 1, enPapelera: 1, nombre: 1 });
CarpetaSchema.index({ 'compartidoCon.usuario': 1, enPapelera: 1 });

// Evitar duplicados: mismo nombre, mismo propietario y mismo padre, activa
CarpetaSchema.index(
    {
        propietario: 1,
        carpetaPadre: 1,
        nombre: 1,
    },
    {
        unique: true,
        partialFilterExpression: { enPapelera: false },
        name: 'unique_nombre_por_carpeta',
    },
);

export const CarpetaModel = model<ICarpeta>('Carpeta', CarpetaSchema);
