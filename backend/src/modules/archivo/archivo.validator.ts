import { HttpError } from '../../shared/errors/http-error';
import { IArchivoRepository } from './archivo.repository';
import { ICarpetaRepository } from '../carpeta/carpeta.repository';

/**
 * Validador de reglas de negocio para el módulo de archivos.
 * Encapsula la validación de unicidad de nombres dentro de la misma ubicación
 * y la comprobación de disponibilidad de carpetas contenedoras.
 */
export class ArchivoValidator {
    constructor(
        private readonly archivoRepository: IArchivoRepository,
        private readonly carpetaRepository: ICarpetaRepository,
    ) {}

    /**
     * Valida que no exista ya un archivo activo con el mismo nombre en la ubicación indicada.
     * @param propietarioId - ID del propietario del archivo.
     * @param carpetaPadreId - ID de la carpeta contenedora o null si es la raíz.
     * @param nombre - Nombre del archivo.
     * @param excluirId - Opcional, ID del archivo a excluir (para renombrar o mover).
     * @throws HttpError.conflict (409) si ya existe un archivo con ese nombre en esa ubicación.
     */
    async validarNombreUnico(
        propietarioId: string,
        carpetaPadreId: string | null,
        nombre: string,
        excluirId?: string,
    ): Promise<void> {
        const existe = await this.archivoRepository.existeArchivoConNombre(
            propietarioId,
            carpetaPadreId,
            nombre,
            excluirId,
        );

        if (existe) {
            throw HttpError.conflict(
                'Ya existe un archivo con ese nombre en esta ubicación',
            );
        }
    }

    /**
     * Valida que la carpeta padre del archivo exista y no esté en la papelera.
     * Si carpetaPadreId es null (raíz), la validación pasa exitosamente.
     * @param carpetaPadreId - ID de la carpeta padre a validar o null.
     * @throws HttpError.badRequest (400) si la carpeta padre no está disponible o está en la papelera.
     */
    async validarPadreDisponible(
        carpetaPadreId: string | null,
    ): Promise<void> {
        if (!carpetaPadreId) return;

        const padre = await this.carpetaRepository.buscarPorId(carpetaPadreId);
        if (!padre || padre.enPapelera) {
            throw HttpError.badRequest(
                'No se puede restaurar: la carpeta padre no está disponible',
            );
        }
    }
}
