import { Request, Response } from 'express';
import { AuthService } from './auth.service';

/** Controlador HTTP de autenticación: login, registro y usuario actual. */
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * Inicia sesión y devuelve el usuario con su token JWT.
     * El body se valida con `LoginSchema`.
     */
    signIn = async (req: Request, res: Response): Promise<void> => {
        const result = await this.authService.signIn(req.body);
        res.json(result);
    };

    /**
     * Registra una cuenta pública con rol Usuario.
     * El body se valida con `RegistroSchema`; responde `201`.
     */
    signUp = async (req: Request, res: Response): Promise<void> => {
        const result = await this.authService.signUp(req.body);
        res.status(201).json(result);
    };

    /** Devuelve el usuario autenticado que dejó `authenticate` en `req.user`. */
    me = async (req: Request, res: Response): Promise<void> => {
        // req.user ya está seteado por el middleware de authenticate
        res.json({ usuario: req.user });
    };
}
