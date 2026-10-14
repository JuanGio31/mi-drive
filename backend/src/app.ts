import { Application, Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import { notFoundHandler } from './shared/middlewares/not-found.middleware';
import { errorHandler } from './shared/middlewares/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import usuarioRouter from './modules/usuario/usuario.routes';
import carpetaRouter from './modules/carpeta/carpeta.routes';

export const createApp = (): Application => {
    const app = express();

    // Middlewares globales
    app.use(cors());
    app.use(express.json({ limit: '16mb' }));
    app.use(express.urlencoded({ limit: '16mb', extended: true }));

    // HealthCheck
    app.get('/api/health', (_req: Request, res: Response) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // definicion de rutas
    app.use('/api/auth', authRoutes);
    app.use('/api/usuarios', usuarioRouter);
    app.use('/api/carpetas', carpetaRouter);

    // Manejo de rutas no encontradas
    app.use(notFoundHandler);

    // Manejo global de errores
    app.use(errorHandler);

    return app;
};
