import 'dotenv/config';
import { createApp } from './app';
import { connectDB, disconnectDB } from './shared/config/db';
import { env } from './shared/config/env';
import { flushLogger, logger } from './shared/logger/logger';

let cerrando = false;

/** Espera a que los logs se escriban y termina el proceso. */
const terminar = async (codigo: number): Promise<void> => {
    await flushLogger();
    process.exit(codigo);
};

/**
 * Conecta a MongoDB, levanta el servidor HTTP y registra el apagado graceful
 * ante SIGINT/SIGTERM. Los errores fatales terminan el proceso.
 */
const iniciarServidor = async (): Promise<void> => {
    await connectDB(env.MONGO_URI);

    const app = createApp();

    const server = app.listen(env.PORT, () => {
        logger.info({ puerto: env.PORT }, 'API iniciada');
    });

    server.on('error', (error) => {
        logger.fatal({ err: error }, 'Error del servidor HTTP');
        void terminar(1);
    });

    // Apagado graceful (ctrl + c)
    /** Cierra el servidor y la conexión a Mongo una sola vez por señal. */
    const shutdown = async (signal: string) => {
        if (cerrando) return;
        cerrando = true;

        logger.info({ signal }, 'Cerrando servidor');

        server.close(async () => {
            try {
                await disconnectDB();
            } catch (error) {
                logger.error({ err: error }, 'Error al desconectar MongoDB');
            }
            await terminar(0);
        });

        // Evita que un cierre bloqueado deje el proceso colgado.
        setTimeout(() => {
            logger.error('Cierre forzado por tiempo de espera');
            void terminar(1);
        }, 10_000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
};

process.on('unhandledRejection', (motivo) => {
    logger.fatal({ err: motivo }, 'Promesa no manejada');
    void terminar(1);
});

process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Excepción no capturada');
    void terminar(1);
});

iniciarServidor().catch((error) => {
    logger.fatal({ err: error }, 'Error al iniciar el servidor');
    void terminar(1);
});
