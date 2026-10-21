import { Application, Request, Response } from 'express';
import express from 'express';
import cors, { CorsOptions } from 'cors';
import { notFoundHandler } from './shared/middlewares/not-found.middleware';
import { errorHandler } from './shared/middlewares/error.middleware';
import { assignRequestId } from './shared/middlewares/request-id.middleware';
import { requestLogger } from './shared/middlewares/request-logger.middleware';
import authRoutes from './modules/auth/auth.routes';
import usuarioRoutes from './modules/usuario/usuario.routes';
import carpetaRoutes from './modules/carpeta/carpeta.routes';
import archivoRoutes from './modules/archivo/archivo.routes';
import actividadRoutes from './modules/actividad/actividad.routes';
import reporteRoutes from './modules/reporte/repotte.routes';
import busquedaRoutes from './modules/busqueda/busqueda.routes';
import { env } from './shared/config/env';

const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        // Permitir peticiones sin Origin (curl, Postman, etc.)
        if (!origin) return callback(null, true);
        if (env.CORS_ORIGIN.includes(origin)) return callback(null, true);

        // Rechazar con error -> pasa por el middleware de error
        callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true, // permite el uso de cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // cabeceras permitidas
    exposedHeaders: ['Content-Disposition', 'X-Request-Id'], // descarga de archivos y correlación de logs
    maxAge: 3600, // cachear preflight durante 1 hora
};

export const createApp = (): Application => {
    const app = express();

    // Middlewares globales
    // - identifica la petición antes de registrarla o responder errores
    app.use(assignRequestId);
    // - registra metadatos de todas las peticiones
    app.use(requestLogger);

    // - permite el uso de CORS antes de las rutas
    app.use(cors(corsOptions));

    // - parsea el body de las peticiones
    app.use(express.json({ limit: '16mb' }));
    app.use(express.urlencoded({ limit: '16mb', extended: true }));

    // HealthCheck
    app.get('/api/health', (_req: Request, res: Response) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // definicion de rutas
    app.use('/api/auth', authRoutes);
    app.use('/api/usuarios', usuarioRoutes);
    app.use('/api/carpetas', carpetaRoutes);
    app.use('/api/archivos', archivoRoutes);
    app.use('/api/actividad', actividadRoutes);
    app.use('/api/reportes', reporteRoutes);
    app.use('/api/buscar', busquedaRoutes);

    // Manejo de rutas no encontradas
    app.use(notFoundHandler);

    // Manejo global de errores
    app.use(errorHandler);

    return app;
};
