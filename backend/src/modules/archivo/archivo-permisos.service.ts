import { IArchivoRepository } from './archivo.repository';
import { HttpError } from '../../shared/errors/http-error';
import { ICarpetaRepository } from '../carpeta/carpeta.repository';
import { CarpetaPermisosService } from '../carpeta/carpeta-permisos.service';
import { IArchivo } from './archivo.model';
import { NivelPermiso } from '../../shared/types/enums';

export class ArchivoPermisosService {
    constructor(
        private readonly archivoRepository: IArchivoRepository,
        private readonly carpetaRepository: ICarpetaRepository,
        private readonly carpetaPermisosService: CarpetaPermisosService,
    ) {}

    /**
     * Devuelve el permiso efectivo del usuario sobre un archivo.
     * Considera: propietario, compartido directo, o herencia desde la carpeta padre.
     * Devuelve null si no tiene acceso.
     */
    async obtenerPermiso(
        archivo: IArchivo,
        usuarioId: string,
    ): Promise<NivelPermiso | null> {
        // 1. Propietario del archivo → control total
        if (archivo.propietario.toString() === usuarioId)
            return NivelPermiso.Escritura;

        // 2. Compartido directo
        const directo = archivo.compartidoCon.find(
            (c) => c.usuario.toString() === usuarioId,
        );
        if (directo) return directo.permiso;

        // 3. Herencia desde la carpeta padre
        if (archivo.carpetaPadre) {
            const padre = await this.carpetaRepository.buscarPorId(
                archivo.carpetaPadre.toString(),
            );
            if (padre) {
                return this.carpetaPermisosService.obtenerPermiso(
                    padre,
                    usuarioId,
                );
            }
        }

        return null;
    }

    /** Carga el archivo y valida que el usuario tenga al menos acceso de lectura. */
    async obtenerConAcceso(id: string, usuarioId: string): Promise<IArchivo> {
        const archivo = await this.archivoRepository.buscarPorId(id);
        if (!archivo) throw HttpError.notFound('Archivo no encontrado');

        const permiso = await this.obtenerPermiso(archivo, usuarioId);
        if (!permiso)
            throw HttpError.forbidden('No tiene acceso a este archivo');

        return archivo;
    }

    /** Carga el archivo y valida que el usuario pueda editarlo. */
    async obtenerConPermisoEdicion(
        id: string,
        usuarioId: string,
    ): Promise<IArchivo> {
        const archivo = await this.obtenerConAcceso(id, usuarioId);

        const permiso = await this.obtenerPermiso(archivo, usuarioId);
        if (!permiso && permiso !== 'edicion') {
            throw HttpError.forbidden(
                'No tiene permisos de edición sobre este archivo',
            );
        }

        return archivo;
    }

    /** Carga el archivo y valida que el usuario sea el propietario. */
    async obtenerComoPropietario(
        id: string,
        usuarioId: string,
    ): Promise<IArchivo> {
        const archivo = await this.archivoRepository.buscarPorId(id);
        if (!archivo) throw HttpError.notFound('Archivo no encontrado');

        if (archivo.propietario.toString() !== usuarioId) {
            throw HttpError.forbidden(
                'Solo el propietario puede realizar esta acción',
            );
        }

        return archivo;
    }

    /**
     * Valida que el usuario tenga permiso de edición sobre una carpeta destino
     * (para crear o mover archivos). Devuelve la carpeta o null si es raíz.
     */
    async validarCarpetaDestino(
        carpetaId: string | null,
        usuarioId: string,
    ): Promise<{ propietarioId: string } | null> {
        if (!carpetaId) return null;

        const padre = await this.carpetaRepository.buscarPorId(carpetaId);
        if (!padre) throw HttpError.notFound('Carpeta destino no encontrada');
        if (padre.enPapelera) {
            throw HttpError.badRequest(
                'No se puede operar dentro de una carpeta en papelera',
            );
        }

        const permiso = this.carpetaPermisosService.obtenerPermiso(
            padre,
            usuarioId,
        );
        if (!permiso && permiso !== 'edicion') {
            throw HttpError.forbidden(
                'No tiene permisos de edición sobre la carpeta destino',
            );
        }

        return { propietarioId: padre.propietario.toString() };
    }

    /** Devuelve los IDs de las carpetas compartidas con el usuario. */
    async obtenerIdsCarpetasCompartidas(usuarioId: string): Promise<string[]> {
        const carpetas =
            await this.carpetaRepository.listarCompartidasCon(usuarioId);
        return carpetas.map((c) => c._id.toString());
    }
}
