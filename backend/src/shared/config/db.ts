import mongoose from 'mongoose';
import { logger } from '../logger/logger';

/**
 * Abre la conexión con MongoDB y registra los eventos de error/desconexión.
 * Si la conexión inicial falla, loguea y propaga el error.
 */
export const connectDB = async (uri: string): Promise<void> => {
    try {
        await mongoose.connect(uri);
        logger.info('Conectado a MongoDB');

        mongoose.connection.on('error', (error) => {
            logger.error({ err: error }, 'Error de conexión con MongoDB');
        });

        mongoose.connection.on('disconnected', () => {
            logger.info('Desconectado de MongoDB');
        });
    } catch (error) {
        logger.error({ err: error }, 'No se pudo conectar con MongoDB');
        throw error;
    }
};

/** Cierra la conexión activa con MongoDB. */
export const disconnectDB = async (): Promise<void> => {
    await mongoose.disconnect();
};
