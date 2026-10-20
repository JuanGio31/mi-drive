import { IArchivoRepository } from './archivo.repository';
import { HttpError } from '../../shared/errors/http-error';
import { ICarpetaRepository } from '../carpeta/carpeta.repository';
import {
    CachePermisos,
    CarpetaPermisosService,
} from '../carpeta/carpeta-permisos.service';
import { IArchivo } from './archivo.model';
import { NivelPermiso } from '../../shared/types/enums';

export class ArchivoPermisosService {
    constructor(
        private readonly archivoRepository: IArchivoRepository,
        private readonly carpetaRepository: ICarpetaRepository,
        private readonly carpetaPermisosService: CarpetaPermisosService,
    ) {}

    /**
     * Devuelve el permiso efectivo del usuario sobre varios archivos.
     * Considera propietario, share directo y, para el resto, resuelve el
     * permiso heredado de las carpetas padre en lote (una sola agregación
     * de ancestros), sin consultar una vez por archivo.
     */
    async obtenerPermiso(
        archivos: IArchivo[],
        usuarioId: string,
        cache?: CachePermisos,
    ): Promise<Map<string, NivelPermiso | null>> {
        const permisos = new Map<string, NivelPermiso | null>();
        const carpetasNecesarias = new Set<string>();

        for (const archivo of archivos) {
            const idStr = archivo._id.toString();
            if (archivo.propietario.toString() === usuarioId) {
                permisos.set(idStr, NivelPermiso.Escritura);
                continue;
            }

            const directo = archivo.compartidoCon.find(
                (c) => c.usuario.toString() === usuarioId,
            );
            if (directo) {
                permisos.set(idStr, directo.permiso);
                continue;
            }

            if (archivo.carpetaPadre) {
                carpetasNecesarias.add(archivo.carpetaPadre.toString());
            } else {
                permisos.set(idStr, null);
            }
        }

        if (carpetasNecesarias.size > 0) {
            const carpetas = await this.carpetaRepository.buscarVariasPorIds(
                Array.from(carpetasNecesarias),
            );
            const permisosCarpetas =
                await this.carpetaPermisosService.resolverPermisos(
                    carpetas,
                    usuarioId,
                    cache,
                );

            for (const archivo of archivos) {
                const idStr = archivo._id.toString();
                if (permisos.has(idStr) || !archivo.carpetaPadre) continue;
                permisos.set(
                    idStr,
                    permisosCarpetas.get(
                        archivo.carpetaPadre.toString(),
                    ) ?? null,
                );
            }
        }

        return permisos;
    }

    /**
     * Permiso efectivo de la carpeta que se está listando. Devuelve null si
     * la carpeta no existe o está en la papelera.
     */
    async obtenerPermisoCarpeta(
        carpetaId: string,
        usuarioId: string,
        cache?: CachePermisos,
    ): Promise<NivelPermiso | null> {
        const carpeta = await this.carpetaRepository.buscarPorId(carpetaId);
        if (!carpeta || carpeta.enPapelera) return null;
        return this.carpetaPermisosService.obtenerPermisoEfectivo(
            carpeta,
            usuarioId,
            cache,
        );
    }

    /**
     * Carga el archivo y valida que el usuario tenga al menos acceso de
     * lectura. Por defecto los archivos en papelera se tratan como inexistentes.
     */
    async obtenerConAcceso(
        id: string,
        usuarioId: string,
        incluirPapelera = false,
        cache?: CachePermisos,
    ): Promise<IArchivo> {
        const archivo = await this.archivoRepository.buscarPorId(id);
        if (!archivo || (archivo.enPapelera && !incluirPapelera)) {
            throw HttpError.notFound('Archivo no encontrado');
        }

        const map = await this.obtenerPermiso([archivo], usuarioId, cache);
        const permiso = map.get(archivo._id.toString());
        if (!permiso) {
            throw HttpError.notFound('Archivo no encontrado');
        }

        return archivo;
    }

    /**
     * Carga el archivo y valida que el usuario pueda editarlo, incluyendo el
     * permiso heredado de su carpeta padre. Sin acceso se oculta con 404.
     */
    async obtenerConPermisoEdicion(
        id: string,
        usuarioId: string,
        incluirPapelera = false,
        cache?: CachePermisos,
    ): Promise<IArchivo> {
        const archivo = await this.archivoRepository.buscarPorId(id);
        if (!archivo || (archivo.enPapelera && !incluirPapelera)) {
            throw HttpError.notFound('Archivo no encontrado');
        }

        const map = await this.obtenerPermiso([archivo], usuarioId, cache);
        const permiso = map.get(archivo._id.toString());
        if (!permiso) {
            throw HttpError.notFound('Archivo no encontrado');
        }
        if (permiso !== NivelPermiso.Escritura) {
            throw HttpError.forbidden(
                'No tiene permisos de edición sobre este archivo',
            );
        }

        return archivo;
    }

    /**
     * Carga el archivo y valida que el usuario sea el propietario. Por defecto
     * los archivos en papelera se tratan como inexistentes.
     */
    async obtenerComoPropietario(
        id: string,
        usuarioId: string,
        incluirPapelera = false,
    ): Promise<IArchivo> {
        const archivo = await this.archivoRepository.buscarPorId(id);
        if (!archivo || (archivo.enPapelera && !incluirPapelera)) {
            throw HttpError.notFound('Archivo no encontrado');
        }

        if (archivo.propietario.toString() !== usuarioId) {
            const permisos = await this.obtenerPermiso([archivo], usuarioId);
            if (!permisos.get(archivo._id.toString())) {
                throw HttpError.notFound('Archivo no encontrado');
            }
            throw HttpError.forbidden(
                'Solo el propietario puede realizar esta acción',
            );
        }

        return archivo;
    }

    /**
     * Valida que el usuario tenga permiso de edición efectivo sobre la carpeta
     * destino (para crear o mover archivos). Devuelve el propietario del árbol.
     */
    async validarCarpetaDestino(
        carpetaId: string | null,
        usuarioId: string,
        cache?: CachePermisos,
    ): Promise<{ propietarioId: string } | null> {
        if (!carpetaId) return null;

        const padre = await this.carpetaRepository.buscarPorId(carpetaId);
        if (!padre) throw HttpError.notFound('Carpeta destino no encontrada');
        if (padre.enPapelera) {
            throw HttpError.badRequest(
                'No se puede operar dentro de una carpeta en papelera',
            );
        }

        const permiso = await this.carpetaPermisosService.obtenerPermisoEfectivo(
            padre,
            usuarioId,
            cache,
        );
        if (!permiso) {
            throw HttpError.notFound('Carpeta destino no encontrada');
        }
        if (permiso !== NivelPermiso.Escritura) {
            throw HttpError.forbidden(
                'No tiene permisos de edición sobre la carpeta destino',
            );
        }

        return { propietarioId: padre.propietario.toString() };
    }
}
