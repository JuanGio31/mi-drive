import { HttpError } from '../../shared/errors/http-error';
import { ICarpetaRepository } from './carpeta.repository';

/**
 * Validador de reglas de negocio para el módulo de carpetas.
 * Encapsula verificaciones de integridad referencial, unicidad y restricciones de árbol.
 */
export class CarpetaValidator {
    constructor(private readonly carpetaRepository: ICarpetaRepository) {}

    /**
     * Valida que no exista ya una carpeta activa con el mismo nombre dentro de la misma ubicación.
     * @param propietarioId - ID del propietario de la carpeta.
     * @param carpetaPadreId - ID de la carpeta contenedora o null si es raíz.
     * @param nombre - Nombre a comprobar.
     * @param excluirId - Opcional, ID de carpeta a excluir (para operaciones de renombrado/movimiento).
     * @throws HttpError.conflict (409) si ya existe una carpeta con ese nombre en esa ubicación.
     */
    async validarNombreUnico(
        propietarioId: string,
        carpetaPadreId: string | null,
        nombre: string,
        excluirId?: string,
    ): Promise<void> {
        const existe = await this.carpetaRepository.existeCarpetaConNombre(
            propietarioId,
            carpetaPadreId,
            nombre,
            excluirId,
        );

        if (existe) {
            throw HttpError.conflict(
                'Ya existe una carpeta con ese nombre en esta ubicación',
            );
        }
    }

    /**
     * Valida que una carpeta no sea movida dentro de sí misma ni dentro de ninguno de sus descendientes.
     * Previene ciclos en la estructura jerárquica del árbol.
     * @param carpetaId - ID de la carpeta a mover.
     * @param nuevoPadreId - ID de la carpeta destino (o null si es la raíz).
     * @throws HttpError.badRequest (400) si se intenta mover dentro de sí misma o de un descendiente.
     */
    async validarSinCiclos(
        carpetaId: string,
        nuevoPadreId: string | null,
    ): Promise<void> {
        if (!nuevoPadreId) return;

        if (nuevoPadreId === carpetaId) {
            throw HttpError.badRequest(
                'No se puede mover una carpeta dentro de sí misma',
            );
        }

        const descendientes =
            await this.carpetaRepository.obtenerDescendientesIds(carpetaId);

        if (descendientes.includes(nuevoPadreId)) {
            throw HttpError.badRequest(
                'No se puede mover una carpeta dentro de uno de sus descendientes',
            );
        }
    }

    /**
     * Valida que la carpeta padre especificada exista y no esté en la papelera.
     * Si carpetaPadreId es null (raíz), la validación pasa exitosamente.
     * @param carpetaPadreId - ID de la carpeta padre a validar o null.
     * @throws HttpError.notFound (404) si la carpeta padre no existe.
     * @throws HttpError.badRequest (400) si la carpeta padre está en la papelera.
     */
    async validarPadreDisponible(
        carpetaPadreId: string | null,
    ): Promise<void> {
        if (!carpetaPadreId) return;

        const padre = await this.carpetaRepository.buscarPorId(carpetaPadreId);
        if (!padre) {
            throw HttpError.notFound('Carpeta padre no encontrada');
        }

        if (padre.enPapelera) {
            throw HttpError.badRequest(
                'No se puede operar dentro de una carpeta en papelera',
            );
        }
    }
}
