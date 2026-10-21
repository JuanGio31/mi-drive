import { Request, Response } from 'express';
import { UsuarioService } from './usuario.service';
import { HttpError } from '../../shared/errors/http-error';

/** Controlador HTTP de usuarios: administración y autoservicio. */
export class UsuarioController {
    constructor(private readonly usuarioService: UsuarioService) {}

    /** Devuelve el id y el rol del usuario autenticado o lanza `401`. */
    private getSolicitante(req: Request): { id: string; rol: string } {
        if (!req.user) throw HttpError.unauthorized();
        return { id: req.user.id, rol: req.user.rol };
    }

    /** Crea un usuario; requiere rol administrador y responde `201`. */
    crear = async (req: Request, res: Response): Promise<void> => {
        const { id } = this.getSolicitante(req);
        const usuario = await this.usuarioService.crear(req.body, id);
        res.status(201).json(usuario);
    };

    /** Lista usuarios de forma paginada; requiere rol administrador. */
    listar = async (req: Request, res: Response): Promise<void> => {
        const { id } = this.getSolicitante(req);
        const usuarios = await this.usuarioService.listar(req.query, id);
        res.json(usuarios);
    };

    /** Usuarios activos (id, nombre, correo): para compartir y resolver nombres. */
    listarDirectorio = async (_req: Request, res: Response): Promise<void> => {
        const usuarios = await this.usuarioService.directorio();
        res.json(usuarios);
    };

    /** Devuelve un usuario; aplica las reglas de acceso del servicio. */
    buscarPorId = async (req: Request, res: Response): Promise<void> => {
        const solicitante = this.getSolicitante(req);
        const usuario = await this.usuarioService.buscarPorId(
            req.params.id as string,
            solicitante.id,
            solicitante.rol,
        );
        res.json(usuario);
    };

    /** Actualiza datos del usuario; valida propiedad, rol y campos permitidos. */
    actualizar = async (req: Request, res: Response): Promise<void> => {
        const solicitante = this.getSolicitante(req);
        const usuario = await this.usuarioService.actualizar(
            req.params.id as string,
            req.body,
            solicitante.id,
            solicitante.rol,
        );
        res.json(usuario);
    };

    /** Cambia la contraseña del propio usuario autenticado. */
    cambiarPassword = async (req: Request, res: Response): Promise<void> => {
        const { id: solicitanteId } = this.getSolicitante(req);
        await this.usuarioService.cambiarPassword(
            req.params.id as string,
            req.body,
            solicitanteId,
        );
        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    };

    /** Desactiva un usuario; requiere admin y prohíbe la auto-desactivación. */
    desactivar = async (req: Request, res: Response): Promise<void> => {
        const { id: ejecutorId } = this.getSolicitante(req);
        const usuario = await this.usuarioService.desactivar(
            req.params.id as string,
            ejecutorId,
        );
        res.json(usuario);
    };

    /** Reactiva un usuario desactivado; requiere rol administrador. */
    reactivar = async (req: Request, res: Response): Promise<void> => {
        const { id: ejecutorId } = this.getSolicitante(req);
        const usuario = await this.usuarioService.reactivar(
            req.params.id as string,
            ejecutorId,
        );
        res.json(usuario);
    };
}
