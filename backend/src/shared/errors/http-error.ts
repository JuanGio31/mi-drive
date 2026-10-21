/**
 * Error controlado de la API.
 *
 * `errorHandler` usa `codigoEstado` para la respuesta HTTP y `detalles` para
 * información adicional, como los errores de validación.
 */
export class HttpError extends Error {
    /**
     * Crea un error con el código HTTP y el mensaje que se enviarán al cliente.
     */
    constructor(
        public readonly codigoEstado: number,
        mensaje: string,
        public readonly detalles?: unknown,
    ) {
        super(mensaje);
        this.name = 'HttpError';
        Object.setPrototypeOf(this, HttpError.prototype);
    }

    /** Error `400` por datos inválidos; admite detalles de validación. */
    static badRequest(mensaje: string, detalles?: unknown) {
        return new HttpError(400, mensaje, detalles);
    }

    /** Error `401` por falta de autenticación o token inválido. */
    static unauthorized(mensaje = 'No autorizado') {
        return new HttpError(401, mensaje);
    }

    /** Error `403` cuando el usuario no tiene permiso para la acción. */
    static forbidden(mensaje = 'Acceso denegado') {
        return new HttpError(403, mensaje);
    }

    /** Error `404` cuando el recurso no existe o no es visible. */
    static notFound(mensaje = 'Recurso no encontrado') {
        return new HttpError(404, mensaje);
    }

    /** Error `409` por conflictos, por ejemplo un correo duplicado. */
    static conflict(mensaje: string) {
        return new HttpError(409, mensaje);
    }

    /** Error `500` para fallos no controlados. */
    static internal(mensaje = 'Error interno del servidor') {
        return new HttpError(500, mensaje);
    }
}
