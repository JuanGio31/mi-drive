import { Rol } from './enums';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                nombre: string;
                correo: string;
                rol: Rol;
            };
        }
    }
}

export {};
