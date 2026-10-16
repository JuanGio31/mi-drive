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
        archivos: IArchivo[],
        usuarioId: string,
    ): Promise<Map<string, NivelPermiso | null>> {
        const permisos = new Map<string, NivelPermiso | null>();

        // Resolverlos directos (propietario | compartido) sin query
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

        // consulta para todas las carpetas padre necesarias
        if (carpetasNecesarias.size > 0) {
            const carpetas = await this.carpetaRepository.buscarVariasPorIds(
                Array.from(carpetasNecesarias),
            );
            const carpetasMap = new Map(
                carpetas.map((c) => [c._id.toString(), c]),
            );

            for (const archivo of archivos) {
                const idsStr = archivo._id.toString();
                if (permisos.has(idsStr)) continue;
                if (archivo.carpetaPadre) {
                    const padre = carpetasMap.get(
                        archivo.carpetaPadre.toString(),
                    );
                    if (padre) {
                        permisos.set(
                            idsStr,
                            this.carpetaPermisosService.obtenerPermiso(
                                padre,
                                usuarioId,
                            ),
                        );
                    } else {
                        permisos.set(idsStr, null);
                    }
                }
            }
        }

        return permisos;
    }

    /** Carga el archivo y valida que el usuario tenga al menos acceso de lectura. */
    async obtenerConAcceso(id: string, usuarioId: string): Promise<IArchivo> {
        const archivo = await this.archivoRepository.buscarPorId(id);
        if (!archivo) throw HttpError.notFound('Archivo no encontrado');

        const map = await this.obtenerPermiso([archivo], usuarioId);
        const permiso = map.get(archivo._id.toString());
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

        const map = await this.obtenerPermiso([archivo], usuarioId);
        const permiso = map.get(archivo._id.toString());
        if (permiso !== NivelPermiso.Escritura) {
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
