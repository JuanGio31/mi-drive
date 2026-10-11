import { Document, model, Schema, Types } from 'mongoose';
import { Rol } from '../../shared/types/enums';

export interface IUsuario extends Document {
    _id: Types.ObjectId;
    nombre: string;
    correo: string;
    passwordHash: string;
    rol: Rol;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UsuarioSchema = new Schema<IUsuario>(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
            minlength: 2,
            maxlength: 150,
        },
        correo: {
            type: String,
            required: [true, 'El correo es requerido'],
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: [true, 'La contraseña es requerida'],
            select: false, // por defecto no se envia la contraseña
        },
        rol: {
            type: String,
            enum: Object.values(Rol),
            default: Rol.Usuario,
            required: true,
        },
        activo: {
            type: Boolean,
            required: true,
        },
    },
    {
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
        },
        versionKey: false,
        collection: 'usuarios',
        toJSON: {
            transform: (_doc, ret) => {
                delete (ret as any).passwordHash;
                return ret;
            },
        },
    },
);

UsuarioSchema.index({ correo: 1 }, { unique: true });
UsuarioSchema.index({ rol: 1 });
UsuarioSchema.index({ activo: 1 });

export const UsuarioModel = model<IUsuario>('Usuario', UsuarioSchema);
