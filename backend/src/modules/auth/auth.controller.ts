import { NextFunction, Request, Response } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
    constructor(private readonly authService: AuthService) {}

    signIn = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const result = await this.authService.signIn(req.body);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    signUp = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const result = await this.authService.signUp(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    };

    me = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            // req.user ya está seteado por el middleware de authenticate
            res.json({ usuario: req.user });
        } catch (error) {
            next(error);
        }
    };
}
