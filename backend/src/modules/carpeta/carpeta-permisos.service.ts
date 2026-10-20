import { HttpError } from '../../shared/errors/http-error';
import { NivelPermiso } from '../../shared/types/enums';
import { ICarpeta } from './carpeta.model';
import { ICarpetaRepository } from './carpeta.repository';

/** Caché por operación para no repetir la resolución de ancestros. */
export type CachePermisos = Map<string, NivelPermiso | null>;

export class CarpetaPermisosService {
    constructor(private readonly carpetaRepository: ICarpetaRepository) {}

    /**
     * Devuelve el permiso directo sobre la carpeta (dueño o compartido),
     * sin considerar herencia. Devuelve null si no tiene acceso directo.
     */
    obtenerPermiso(carpeta: ICarpeta, usuarioId: string): NivelPermiso | null {
        if (carpeta.propietario.toString() === usuarioId) {
            return NivelPermiso.Escritura;
        }

        const compartido = carpeta.compartidoCon.find(
            (c) => c.usuario.toString() === usuarioId,
        );
        return compartido ? compartido.permiso : null;
    }

    /**
     * Resuelve permisos efectivos en lote. Usa dueño/share directo en memoria
     * y, para las carpetas sin permiso propio, trae toda la cadena de
     * ancestros en una sola agregación ($graphLookup) y busca en memoria el
     * ancestro más cercano con permiso. Evita una consulta por ítem o nivel.
     */
    async resolverPermisos(
        carpetas: ICarpeta[],
        usuarioId: string,
        cache?: CachePermisos,
    ): Promise<Map<string, NivelPermiso | null>> {
        const resultado = new Map<string, NivelPermiso | null>();
        const pendientes: ICarpeta[] = [];

        for (const carpeta of carpetas) {
            const id = carpeta._id.toString();
            if (cache?.has(id)) {
                resultado.set(id, cache.get(id) ?? null);
                continue;
            }

            const directo = this.obtenerPermiso(carpeta, usuarioId);
            if (directo) {
                resultado.set(id, directo);
                cache?.set(id, directo);
            } else {
                pendientes.push(carpeta);
            }
        }

        if (pendientes.length === 0) return resultado;

        const ancestros = await this.carpetaRepository.obtenerAncestros(
            pendientes.map((carpeta) => carpeta._id.toString()),
        );

        const mapa = new Map<string, ICarpeta>(
            ancestros.map((carpeta) => [carpeta._id.toString(), carpeta]),
        );
        for (const carpeta of carpetas) {
            mapa.set(carpeta._id.toString(), carpeta);
        }

        for (const carpeta of pendientes) {
            const id = carpeta._id.toString();
            let actual: ICarpeta | undefined = carpeta;
            let permiso: NivelPermiso | null = null;
            const visitadas = new Set<string>();

            while (actual?.carpetaPadre) {
                const padreId = actual.carpetaPadre.toString();
                if (visitadas.has(padreId)) break;
                visitadas.add(padreId);

                const padre = mapa.get(padreId);
                if (!padre) break;

                const permisoPadre = this.obtenerPermiso(padre, usuarioId);
                if (permisoPadre) {
                    permiso = permisoPadre;
                    break;
                }
                actual = padre;
            }

            resultado.set(id, permiso);
            cache?.set(id, permiso);
        }

        return resultado;
    }

    /** Permiso efectivo de una carpeta, incluyendo la herencia de sus ancestros. */
    async obtenerPermisoEfectivo(
        carpeta: ICarpeta,
        usuarioId: string,
        cache?: CachePermisos,
    ): Promise<NivelPermiso | null> {
        const permisos = await this.resolverPermisos(
            [carpeta],
            usuarioId,
            cache,
        );
        return permisos.get(carpeta._id.toString()) ?? null;
    }

    /**
     * Carga la carpeta y valida que el usuario tenga al menos acceso de
     * lectura. Por defecto las carpetas en papelera se tratan como inexistentes.
     */
    async obtenerConAcceso(
        id: string,
        usuarioId: string,
        incluirPapelera = false,
        cache?: CachePermisos,
    ): Promise<ICarpeta> {
        const carpeta = await this.carpetaRepository.buscarPorId(id);
        if (!carpeta || (carpeta.enPapelera && !incluirPapelera)) {
            throw HttpError.notFound('Carpeta no encontrada');
        }

        const permiso = await this.obtenerPermisoEfectivo(
            carpeta,
            usuarioId,
            cache,
        );
        if (!permiso) {
            throw HttpError.notFound('Carpeta no encontrada');
        }

        return carpeta;
    }

    /**
     * Carga la carpeta y valida que el usuario pueda editarla, considerando
     * permisos heredados desde sus ancestros. Sin acceso se oculta con 404.
     */
    async obtenerConPermisoEdicion(
        id: string,
        usuarioId: string,
        incluirPapelera = false,
        cache?: CachePermisos,
    ): Promise<ICarpeta> {
        const carpeta = await this.carpetaRepository.buscarPorId(id);
        if (!carpeta || (carpeta.enPapelera && !incluirPapelera)) {
            throw HttpError.notFound('Carpeta no encontrada');
        }

        const permiso = await this.obtenerPermisoEfectivo(
            carpeta,
            usuarioId,
            cache,
        );
        if (!permiso) {
            throw HttpError.notFound('Carpeta no encontrada');
        }
        if (permiso !== NivelPermiso.Escritura) {
            throw HttpError.forbidden(
                'No tiene permisos de edición sobre esta carpeta',
            );
        }

        return carpeta;
    }

    /**
     * Carga la carpeta y valida que el usuario sea el propietario. Por defecto
     * las carpetas en papelera se tratan como inexistentes.
     */
    async obtenerComoPropietario(
        id: string,
        usuarioId: string,
        incluirPapelera = false,
    ): Promise<ICarpeta> {
        const carpeta = await this.carpetaRepository.buscarPorId(id);
        if (!carpeta || (carpeta.enPapelera && !incluirPapelera)) {
            throw HttpError.notFound('Carpeta no encontrada');
        }
        if (carpeta.propietario.toString() !== usuarioId) {
            const permiso = await this.obtenerPermisoEfectivo(
                carpeta,
                usuarioId,
            );
            if (!permiso) throw HttpError.notFound('Carpeta no encontrada');
            throw HttpError.forbidden(
                'Solo el propietario puede realizar esta acción',
            );
        }
        return carpeta;
    }

    /**
     * Valida que la carpeta padre exista, no esté en papelera y que el usuario
     * tenga permiso de edición efectivo (propio o heredado).
     */
    async validarPadreEditable(
        carpetaPadreId: string | null,
        usuarioId: string,
        cache?: CachePermisos,
    ): Promise<ICarpeta | null> {
        if (!carpetaPadreId) return null;

        const padre = await this.carpetaRepository.buscarPorId(carpetaPadreId);
        if (!padre) {
            throw HttpError.notFound('Carpeta padre no encontrada');
        }

        if (padre.enPapelera) {
            throw HttpError.badRequest(
                'No se puede crear dentro de una carpeta en papelera',
            );
        }

        const permiso = await this.obtenerPermisoEfectivo(
            padre,
            usuarioId,
            cache,
        );
        if (!permiso) {
            throw HttpError.notFound('Carpeta padre no encontrada');
        }
        if (permiso !== NivelPermiso.Escritura) {
            throw HttpError.forbidden(
                'No tiene permisos de edición sobre la carpeta padre',
            );
        }

        return padre;
    }
}
