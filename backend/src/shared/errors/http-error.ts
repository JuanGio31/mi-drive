export class HttpError extends Error {
    constructor(
        public readonly codigoEstado: number,
        mensaje: string,
        public readonly detalles?: unknown,
    ) {
        super(mensaje);
        this.name = 'HttpError';
        Object.setPrototypeOf(this, HttpError.prototype);
    }

    static badRequest(mensaje: string, detalles?: unknown) {
        return new HttpError(400, mensaje, detalles);
    }

    static unauthorized(mensaje = 'No autorizado') {
        return new HttpError(401, mensaje);
    }

    static forbidden(mensaje = 'Acceso denegado') {
        return new HttpError(403, mensaje);
    }

    static notFound(mensaje = 'Recurso no encontrado') {
        return new HttpError(404, mensaje);
    }

    static conflict(mensaje: string) {
        return new HttpError(409, mensaje);
    }

    static internal(mensaje = 'Error interno del servidor') {
        return new HttpError(500, mensaje);
    }
}
