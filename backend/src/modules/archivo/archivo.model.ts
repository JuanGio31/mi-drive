import { Schema, model, Document, Types } from 'mongoose';
import { ExtensionArchivo, NivelPermiso } from '../../shared/types/enums';

export interface ICompartidoArchivo {
    usuario: Types.ObjectId;
    permiso: NivelPermiso;
    fechaCompartido: Date;
}

export interface IArchivo extends Document {
    _id: Types.ObjectId;
    nombre: string;
    tipo: ExtensionArchivo;
    contenido: string;
    tamanio: number;
    propietario: Types.ObjectId;
    creadoPor: Types.ObjectId;
    carpetaPadre: Types.ObjectId | null;
    compartidoCon: ICompartidoArchivo[];
    destacadoPor: Types.ObjectId[];
    enPapelera: boolean;
    fechaEnvioPapelera: Date | null;
    papeleraRaiz: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const CompartidoArchivoSchema = new Schema<ICompartidoArchivo>(
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

const ArchivoSchema = new Schema<IArchivo>(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
            minlength: 1,
            maxLength: 300,
        },
        tipo: {
            type: String,
            enum: Object.values(ExtensionArchivo),
            required: true,
        },
        contenido: {
            type: String,
            default: '',
            maxLength: 10_000_000,
        },
        tamanio: {
            type: Number,
            default: 0,
            min: 0,
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
            type: [CompartidoArchivoSchema],
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
        toJSON: {
            // No se devuelve el contenido completo del documento en listados por default
            transform: (_doc, ret) => {
                return ret;
            },
        },
    },
);

// Indices compuestos para mejorar la busqueda
ArchivoSchema.index({ propietario: 1, carpetaPadre: 1, enPapelera: 1 });
ArchivoSchema.index({ carpetaPadre: 1, enPapelera: 1 });
ArchivoSchema.index({ 'compartidoCon.usuario': 1, enPapelera: 1 });
ArchivoSchema.index({ tipo: 1 });
// Indices para busquedas de texto
ArchivoSchema.index({ nombre: 'text' });

export const ArchivoModel = model<IArchivo>('Archivo', ArchivoSchema);
