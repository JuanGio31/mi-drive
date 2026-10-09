import mongoose from 'mongoose';

export const connectDB = async (uri: string): Promise<void> => {
    try {
        await mongoose.connect(uri);
        console.log('[Info] Conectado a MongoDB');

        mongoose.connection.on('error', (error) => {
            console.log('[Error] MongoDB:', error);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('[Info] Desconectado de MongoDB');
        });
    } catch (e) {
        console.log('[Error] error al conectar MongoDB:', e);
        process.exit(1);
    }
};

export const disconnectDB = async (): Promise<void> => {
    await mongoose.disconnect();
    console.log('[Info] Desconectado de MongoDB');
};
