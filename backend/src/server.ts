import 'dotenv/config';
import { createApp } from './app';
import { connectDB, disconnectDB } from './shared/config/db';
import { env } from './shared/config/env';

const iniciarServidor = async (): Promise<void> => {
    await connectDB(env.MONGO_URI);

    const app = createApp();

    const server = app.listen(env.PORT, () => {
        console.log(`[Info] API en http://localhost:${env.PORT}`);
        console.log(`[Info] Entorno: ${env.NODE_ENV}`);
    });

    // Apagado graceful (ctrl + c)
    const shutdown = async (signal: string) => {
        console.log(`\n[Info] Recibido ${signal}, cerrando servidor...`);
        server.close(async () => {
            await disconnectDB();
            process.exit(0);
        });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
};

iniciarServidor().catch((e) => {
    console.log('[Error] error al iniciar el servidor:', e);
    process.exit(1);
});
