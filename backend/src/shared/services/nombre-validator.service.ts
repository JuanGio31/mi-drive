import { Types } from 'mongoose';
import { HttpError } from '../errors/http-error';

/**
 * Servicio para validar nombres duplicados en ubicaciones
 * Reutilizable para archivos y carpetas
 */
export class NombreValidatorService {
    /**
     * Verifica si existe un recurso con el mismo nombre en la ubicación
     * @param propietarioId - ID del propietario del recurso
     * @param carpetaPadre - ID de la carpeta padre (null para raíz)
     * @param nombre - Nombre a verificar
     * @param existeCallback - Función que verifica si existe el nombre
     * @param excluirId - ID a excluir de la verificación (para actualizaciones)
     * @throws Conflict si ya existe un nombre duplicado
     */
    async validarNombreUnico(
        propietarioId: string,
        carpetaPadre: string | null,
        nombre: string,
        existeCallback: (
            propietarioId: string,
            carpetaPadre: string | null,
            nombre: string,
            excluirId?: string,
        ) => Promise<boolean>,
        excluirId?: string,
    ): Promise<void> {
        const existe = await existeCallback(
            propietarioId,
            carpetaPadre,
            nombre,
            excluirId,
        );

        if (existe) {
            throw HttpError.conflict(
                'Ya existe un recurso con ese nombre en esta ubicación',
            );
        }
    }
}
