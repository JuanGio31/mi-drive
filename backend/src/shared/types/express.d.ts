import { Rol } from './enums';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                correo: string;
                rol: Rol;
            };
        }
    }
}

export {};
