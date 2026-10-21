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
            /** Id generado por `assignRequestId` para correlacionar logs. */
            requestId?: string;
        }
    }
}

export {};
