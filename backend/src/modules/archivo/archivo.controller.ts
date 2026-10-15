import { Request, Response, NextFunction } from 'express';
import { ArchivoService } from './archivo.service';
import { HttpError } from '../../shared/errors/http-error';

export class ArchivoController {
    constructor(private readonly archivoService: ArchivoService) {}

    private getUsuarioId(req: Request): string {
        if (!req.user) throw HttpError.unauthorized();
        return req.user.id;
    }

    crear = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const archivo = await this.archivoService.crear(
                req.body,
                this.getUsuarioId(req),
            );
            res.status(201).json(archivo);
        } catch (error) {
            next(error);
        }
    };

    listar = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const archivos = await this.archivoService.listar(
                this.getUsuarioId(req),
                req.query,
            );
            res.json(archivos);
        } catch (error) {
            next(error);
        }
    };

    listarCompartidos = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const archivos = await this.archivoService.listarCompartidos(
                this.getUsuarioId(req),
            );
            res.json(archivos);
        } catch (error) {
            next(error);
        }
    };

    buscarPorId = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const archivo = await this.archivoService.buscarPorId(
                req.params.id as string,
                this.getUsuarioId(req),
            );
            res.json(archivo);
        } catch (error) {
            next(error);
        }
    };

    descargar = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const archivo = await this.archivoService.buscarPorId(
                req.params.id as string,
                this.getUsuarioId(req),
            );

            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${encodeURIComponent(archivo.nombre)}"`,
            );
            res.send(archivo.contenido);
        } catch (error) {
            next(error);
        }
    };

    actualizarContenido = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const archivo = await this.archivoService.actualizarContenido(
                req.params.id as string,
                req.body,
                this.getUsuarioId(req),
            );
            res.json(archivo);
        } catch (error) {
            next(error);
        }
    };

    renombrar = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const archivo = await this.archivoService.renombrar(
                req.params.id as string,
                req.body,
                this.getUsuarioId(req),
            );
            res.json(archivo);
        } catch (error) {
            next(error);
        }
    };

    mover = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const archivo = await this.archivoService.mover(
                req.params.id as string,
                req.body,
                this.getUsuarioId(req),
            );
            res.json(archivo);
        } catch (error) {
            next(error);
        }
    };

    enviarAPapelera = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            await this.archivoService.enviarAPapelera(
                req.params.id as string,
                this.getUsuarioId(req),
            );
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };

    restaurar = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const archivo = await this.archivoService.restaurar(
                req.params.id as string,
                this.getUsuarioId(req),
            );
            res.json(archivo);
        } catch (error) {
            next(error);
        }
    };

    compartir = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const archivo = await this.archivoService.compartir(
                req.params.id as string,
                req.body,
                this.getUsuarioId(req),
            );
            res.json(archivo);
        } catch (error) {
            next(error);
        }
    };

    quitarCompartido = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const archivo = await this.archivoService.quitarCompartido(
                req.params.id as string,
                req.params.usuarioId as string,
                this.getUsuarioId(req),
            );
            res.json(archivo);
        } catch (error) {
            next(error);
        }
    };

    eliminarPermanente = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            await this.archivoService.eliminarPermanente(
                req.params.id as string,
                this.getUsuarioId(req),
            );
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };
}
