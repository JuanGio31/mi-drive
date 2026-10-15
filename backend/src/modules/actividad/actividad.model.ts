import { Schema, model, Document, Types } from 'mongoose';
import { AccionActividad, TipoRecurso } from '../../shared/types/enums';

// export type AccionActividad =
//     | 'crear'
//     | 'renombrar'
//     | 'mover'
//     | 'actualizar_contenido'
//     | 'compartir'
//     | 'quitar_compartido'
//     | 'enviar_papelera'
//     | 'restaurar'
//     | 'eliminar_permanente'
//     | 'login'
//     | 'desactivar_usuario'
//     | 'reactivar_usuario';

// export type TipoRecurso = 'archivo' | 'carpeta' | 'usuario' | 'sistema';

export interface IActividad extends Document {
    _id: Types.ObjectId;
    usuario: Types.ObjectId;
    // snapshot: si el usuario se renombra, el historial mantiene el nombre de la época
    usuarioNombre: string;
    usuarioCorreo: string;
    accion: AccionActividad;
    recursoTipo: TipoRecurso;
    recursoId: Types.ObjectId | null;
    // snapshot del nombre del recurso en el momento de la acción
    recursoNombre: string | null;
    metadata: Record<string, unknown>; // datos específicos por acción
    createdAt: Date;
}

const ActividadSchema = new Schema<IActividad>(
    {
        usuario: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
            index: true,
        },
        usuarioNombre: { type: String, required: true },
        usuarioCorreo: { type: String, required: true },
        accion: {
            type: String,
            required: true,
            enum: Object.values(AccionActividad),
            index: true,
        },
        recursoTipo: {
            type: String,
            required: true,
            enum: Object.values(TipoRecurso),
            index: true,
        },
        recursoId: {
            type: Schema.Types.ObjectId,
            default: null,
            index: true,
        },
        recursoNombre: {
            type: String,
            default: null,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        versionKey: false,
    },
);

// Índices para reportes frecuentes
ActividadSchema.index({ usuario: 1, createdAt: -1 });
ActividadSchema.index({ accion: 1, createdAt: -1 });
ActividadSchema.index({ recursoTipo: 1, recursoId: 1, createdAt: -1 });
ActividadSchema.index({ createdAt: -1 });

export const ActividadModel = model<IActividad>('Actividad', ActividadSchema);
