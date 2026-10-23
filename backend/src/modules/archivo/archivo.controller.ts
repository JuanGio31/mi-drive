import { Request, Response } from 'express';
import { ArchivoService } from './archivo.service';
import { ArchivoPapeleraService } from './archivo-papelera.service';
import { HttpError } from '../../shared/errors/http-error';
import { ArchivoCompartidosService } from './archivo-compartido.service';

/** Controlador HTTP de archivos: CRUD, contenido, compartidos y papelera. */
export class ArchivoController {
    constructor(
        private readonly archivoService: ArchivoService,
        private readonly compartidosService: ArchivoCompartidosService,
        private readonly papeleraService: ArchivoPapeleraService,
    ) {}

    /** Devuelve el ID del usuario autenticado o lanza `401`. */
    private getUsuarioId(req: Request): string {
        if (!req.user) throw HttpError.unauthorized();
        return req.user.id;
    }

    /**
     * Crea un archivo `.txt` o `.md`; el body se valida con `CrearArchivoSchema`
     * y responde `201`.
     */
    crear = async (req: Request, res: Response): Promise<void> => {
        const archivo = await this.archivoService.crear(
            req.body,
            this.getUsuarioId(req),
        );
        res.status(201).json(archivo);
    };

    /** Lista archivos por carpeta, tipo, búsqueda y paginación. */
    listar = async (req: Request, res: Response): Promise<void> => {
        const archivos = await this.archivoService.listar(
            this.getUsuarioId(req),
            req.query,
        );
        res.json(archivos);
    };

    /** Lista los archivos compartidos con el usuario autenticado. */
    listarCompartidos = async (req: Request, res: Response): Promise<void> => {
        const archivos = await this.archivoService.listarCompartidos(
            this.getUsuarioId(req),
        );
        res.json(archivos);
    };

    /** Lista los archivos destacados y accesibles para el usuario actual. */
    listarDestacados = async (req: Request, res: Response): Promise<void> => {
        const archivos = await this.archivoService.listarDestacados(
            this.getUsuarioId(req),
        );
        res.json(archivos);
    };

    /** Lista los archivos propios que están en la papelera. */
    listarPapelera = async (req: Request, res: Response): Promise<void> => {
        const archivos = await this.archivoService.listarPapelera(
            this.getUsuarioId(req),
        );
        res.json(archivos);
    };

    /** Devuelve un archivo si el usuario tiene acceso; responde `404` si no lo tiene. */
    buscarPorId = async (req: Request, res: Response): Promise<void> => {
        const archivo = await this.archivoService.buscarPorId(
            req.params.id as string,
            this.getUsuarioId(req),
        );
        res.json(archivo);
    };

    /** Descarga el contenido como `text/plain` con el nombre original en `Content-Disposition`. */
    descargar = async (req: Request, res: Response): Promise<void> => {
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
    };

    /** Registra la apertura del archivo en el visor. Responde 204. */
    abrir = async (req: Request, res: Response): Promise<void> => {
        await this.archivoService.registrarApertura(
            req.params.id as string,
            this.getUsuarioId(req),
        );
        res.status(204).send();
    };

    /** Actualiza el contenido y el tamaño del archivo; requiere permiso de edición. */
    actualizarContenido = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const archivo = await this.archivoService.actualizarContenido(
            req.params.id as string,
            req.body,
            this.getUsuarioId(req),
        );
        res.json(archivo);
    };

    /** Renombra el archivo dentro de su carpeta actual. */
    renombrar = async (req: Request, res: Response): Promise<void> => {
        const archivo = await this.archivoService.renombrar(
            req.params.id as string,
            req.body,
            this.getUsuarioId(req),
        );
        res.json(archivo);
    };

    /** Mueve el archivo a otra carpeta o a la raíz. */
    mover = async (req: Request, res: Response): Promise<void> => {
        const archivo = await this.archivoService.mover(
            req.params.id as string,
            req.body,
            this.getUsuarioId(req),
        );
        res.json(archivo);
    };

    /** Marca o desmarca el archivo como destacado para el usuario actual. */
    destacar = async (req: Request, res: Response): Promise<void> => {
        const resultado = await this.archivoService.destacar(
            req.params.id as string,
            req.body,
            this.getUsuarioId(req),
        );
        res.json(resultado);
    };

    /** Envía el archivo a la papelera mediante borrado lógico; responde `204`. */
    enviarAPapelera = async (req: Request, res: Response): Promise<void> => {
        await this.papeleraService.enviar(
            req.params.id as string,
            this.getUsuarioId(req),
        );
        res.status(204).send();
    };

    /** Restaura el archivo desde la papelera a su ubicación original. */
    restaurar = async (req: Request, res: Response): Promise<void> => {
        const archivo = await this.papeleraService.restaurar(
            req.params.id as string,
            this.getUsuarioId(req),
        );
        res.json(archivo);
    };

    /** Elimina definitivamente un archivo de la papelera. Responde 204. */
    eliminarPermanente = async (req: Request, res: Response): Promise<void> => {
        await this.papeleraService.eliminarPermanente(
            req.params.id as string,
            this.getUsuarioId(req),
        );
        res.status(204).send();
    };

    /** Comparte el archivo con otro usuario y un permiso; solo el propietario puede hacerlo. */
    compartir = async (req: Request, res: Response): Promise<void> => {
        const archivo = await this.compartidosService.compartir(
            req.params.id as string,
            req.body,
            this.getUsuarioId(req),
        );
        res.json(archivo);
    };

    /** Quita el acceso de un usuario al archivo compartido. */
    quitarCompartido = async (req: Request, res: Response): Promise<void> => {
        const archivo = await this.compartidosService.quitar(
            req.params.id as string,
            req.params.usuarioId as string,
            this.getUsuarioId(req),
        );
        res.json(archivo);
    };
}
