import { Request, Response } from 'express';
import { CarpetaService } from './carpeta.service';
import { HttpError } from '../../shared/errors/http-error';
import { CarpetaCompartidosService } from './carpeta-compartido.service';
import { CarpetaPapeleraService } from './carpeta-papelera.service';

/** Controlador HTTP de carpetas: extrae datos de la petición y delega al servicio. */
export class CarpetaController {
    constructor(
        private readonly carpetaService: CarpetaService,
        private readonly compartidoService: CarpetaCompartidosService,
        private readonly papeleraService: CarpetaPapeleraService,
    ) {}

    /** Obtiene el ID del usuario autenticado desde la petición. */
    private getUsuarioId(req: Request): string {
        if (!req.user) throw HttpError.unauthorized();
        return req.user.id;
    }

    /** Crea una carpeta con los datos del body. Responde 201. */
    crear = async (req: Request, res: Response): Promise<void> => {
        const carpeta = await this.carpetaService.crear(
            req.body,
            this.getUsuarioId(req),
        );
        res.status(201).json(carpeta);
    };

    /** Lista carpetas propias y compartidas según los query params. */
    listar = async (req: Request, res: Response): Promise<void> => {
        const resultado = await this.carpetaService.listar(
            this.getUsuarioId(req),
            req.query,
        );
        res.json(resultado);
    };

    /** Lista las carpetas destacadas y accesibles para el usuario actual. */
    listarDestacadas = async (req: Request, res: Response): Promise<void> => {
        const carpetas = await this.carpetaService.listarDestacadas(
            this.getUsuarioId(req),
        );
        res.json(carpetas);
    };

    /** Lista las carpetas propias que están en la papelera. */
    listarPapelera = async (req: Request, res: Response): Promise<void> => {
        const carpetas = await this.carpetaService.listarPapelera(
            this.getUsuarioId(req),
        );
        res.json(carpetas);
    };

    /** Devuelve el detalle de una carpeta por su ID. */
    buscarPorId = async (req: Request, res: Response): Promise<void> => {
        const carpeta = await this.carpetaService.buscarPorId(
            req.params.id as string,
            this.getUsuarioId(req),
        );
        res.json(carpeta);
    };

    /** Cambia el nombre de una carpeta. */
    renombrar = async (req: Request, res: Response): Promise<void> => {
        const carpeta = await this.carpetaService.renombrar(
            req.params.id as string,
            req.body,
            this.getUsuarioId(req),
        );
        res.json(carpeta);
    };

    /** Mueve una carpeta a otro padre o a la raíz. */
    mover = async (req: Request, res: Response): Promise<void> => {
        const carpeta = await this.carpetaService.mover(
            req.params.id as string,
            req.body,
            this.getUsuarioId(req),
        );
        res.json(carpeta);
    };

    /** Marca o desmarca la carpeta como destacada para el usuario actual. */
    destacar = async (req: Request, res: Response): Promise<void> => {
        const resultado = await this.carpetaService.destacar(
            req.params.id as string,
            req.body,
            this.getUsuarioId(req),
        );
        res.json(resultado);
    };

    /** Envía una carpeta a la papelera. Responde 204 sin contenido. */
    enviarAPapelera = async (req: Request, res: Response): Promise<void> => {
        await this.papeleraService.enviar(
            req.params.id as string,
            this.getUsuarioId(req),
        );
        res.status(204).send();
    };

    /** Restaura una carpeta que estaba en la papelera. */
    restaurar = async (req: Request, res: Response): Promise<void> => {
        const carpeta = await this.papeleraService.restaurar(
            req.params.id as string,
            this.getUsuarioId(req),
        );
        res.json(carpeta);
    };

    /** Elimina definitivamente una carpeta y su subárbol. Responde 204. */
    eliminarPermanente = async (req: Request, res: Response): Promise<void> => {
        await this.papeleraService.eliminarPermanente(
            req.params.id as string,
            this.getUsuarioId(req),
        );
        res.status(204).send();
    };

    /** Comparte una carpeta con otro usuario con un permiso dado. */
    compartir = async (req: Request, res: Response): Promise<void> => {
        const carpeta = await this.compartidoService.compartir(
            req.params.id as string,
            req.body,
            this.getUsuarioId(req),
        );
        res.json(carpeta);
    };

    /** Quita a un usuario de los compartidos de una carpeta. */
    quitarCompartido = async (req: Request, res: Response): Promise<void> => {
        const carpeta = await this.compartidoService.quitar(
            req.params.id as string,
            req.params.usuarioId as string,
            this.getUsuarioId(req),
        );
        res.json(carpeta);
    };
}
