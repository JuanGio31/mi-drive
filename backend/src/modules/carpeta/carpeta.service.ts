import { Types } from 'mongoose';
import { ICarpetaRepository } from './carpeta.repository';
import {
    CachePermisos,
    CarpetaPermisosService,
} from './carpeta-permisos.service';
import { CarpetaValidator } from './carpeta.validator';
import { ICarpeta } from './carpeta.model';
import {
    CrearCarpetaDTO,
    RenombrarCarpetaDTO,
    MoverCarpetaDTO,
    DestacarCarpetaDTO,
    ListarCarpetasQuery,
} from './carpeta.dto';
import { HttpError } from '../../shared/errors/http-error';
import { ActividadService } from '../actividad/actividad.service';
import {
    AccionActividad,
    NivelPermiso,
    TipoRecurso,
} from '../../shared/types/enums';
import { IArchivoRepository } from '../archivo/archivo.repository';

/** Carpeta serializada con el permiso efectivo del usuario actual. */
export type CarpetaConPermiso = ICarpeta & {
    miPermiso: NivelPermiso | null;
};

export class CarpetaService {
    constructor(
        private readonly carpetaRepository: ICarpetaRepository,
        private readonly archivoRepository: IArchivoRepository,
        private readonly permisosService: CarpetaPermisosService,
        private readonly validator: CarpetaValidator,
        private readonly actividadService: ActividadService,
    ) {}

    /**
     * Crea una carpeta. Si tiene padre, el propietario es el dueño del árbol
     * (no el creador) y se registra `creadoPor` para la atribución.
     */
    async crear(dto: CrearCarpetaDTO, usuarioId: string): Promise<ICarpeta> {
        const carpetaPadre = dto.carpetaPadre ?? null;
        let propietarioId = usuarioId;

        if (carpetaPadre) {
            const padre = await this.permisosService.validarPadreEditable(
                carpetaPadre,
                usuarioId,
            );
            propietarioId = padre!.propietario.toString();
        }

        await this.validator.validarNombreUnico(
            propietarioId,
            carpetaPadre,
            dto.nombre,
        );

        const carpeta = await this.carpetaRepository.crear({
            nombre: dto.nombre,
            propietario: new Types.ObjectId(propietarioId),
            creadoPor: new Types.ObjectId(usuarioId),
            carpetaPadre: carpetaPadre
                ? new Types.ObjectId(carpetaPadre)
                : null,
            compartidoCon: [],
            enPapelera: false,
        });

        await this.registrarActividad(
            usuarioId,
            AccionActividad.Crear,
            carpeta,
        );

        return carpeta;
    }

    /**
     * Lista el contenido de una carpeta. En la raíz devuelve lo propio y las
     * carpetas compartidas como puntos de entrada; dentro de una carpeta con
     * acceso devuelve todas sus subcarpetas (permisos heredados) y calcula
     * `miPermiso` en memoria, sin consultas por hija.
     */
    async listar(usuarioId: string, filtros: ListarCarpetasQuery) {
        const carpetaPadre = filtros.carpetaPadre ?? null;
        const cache: CachePermisos = new Map();

        if (!carpetaPadre) {
            const propias =
                await this.carpetaRepository.listarPorPropietarioYPadre(
                    usuarioId,
                    null,
                );
            const compartidas =
                await this.carpetaRepository.listarCompartidasCon(
                    usuarioId,
                    null,
                    true,
                );

            return {
                propias: propias.map((carpeta) =>
                    this.conPermiso(
                        carpeta,
                        this.permisosService.obtenerPermiso(carpeta, usuarioId),
                    ),
                ),
                compartidas: compartidas.map((carpeta) =>
                    this.conPermiso(
                        carpeta,
                        this.permisosService.obtenerPermiso(carpeta, usuarioId),
                    ),
                ),
            };
        }

        const padre = await this.permisosService.obtenerConAcceso(
            carpetaPadre,
            usuarioId,
            false,
            cache,
        );
        const permisoPadre = await this.permisosService.obtenerPermisoEfectivo(
            padre,
            usuarioId,
            cache,
        );
        const hijas = await this.carpetaRepository.listarPorPadre(carpetaPadre);

        return {
            propias: hijas.map((carpeta) =>
                this.conPermiso(
                    carpeta,
                    this.permisosService.obtenerPermiso(carpeta, usuarioId) ??
                        permisoPadre,
                ),
            ),
            compartidas: [],
        };
    }

    /**
     * Lista las carpetas destacadas por el usuario y descarta las que ya no
     * tiene permiso efectivo de ver, incluyendo permisos heredados.
     */
    async listarDestacadas(usuarioId: string): Promise<CarpetaConPermiso[]> {
        const carpetas = await this.carpetaRepository.listarDestacadas(
            usuarioId,
        );
        if (carpetas.length === 0) return [];

        const cache: CachePermisos = new Map();
        const permisos = await this.permisosService.resolverPermisos(
            carpetas,
            usuarioId,
            cache,
        );
        const resultado: CarpetaConPermiso[] = [];

        for (const carpeta of carpetas) {
            const permiso = permisos.get(carpeta._id.toString()) ?? null;
            if (permiso) resultado.push(this.conPermiso(carpeta, permiso));
        }

        return resultado;
    }

    /** Lista las carpetas propias que están en la papelera. */
    async listarPapelera(usuarioId: string): Promise<ICarpeta[]> {
        return this.carpetaRepository.listarPapelera(usuarioId);
    }

    /**
     * Carga una carpeta accesible y adjunta el permiso efectivo del usuario.
     */
    async buscarPorId(
        id: string,
        usuarioId: string,
    ): Promise<CarpetaConPermiso> {
        const cache: CachePermisos = new Map();
        const carpeta = await this.permisosService.obtenerConAcceso(
            id,
            usuarioId,
            false,
            cache,
        );
        const permiso = await this.permisosService.obtenerPermisoEfectivo(
            carpeta,
            usuarioId,
            cache,
        );

        return this.conPermiso(carpeta, permiso);
    }

    async destacar(
        id: string,
        dto: DestacarCarpetaDTO,
        usuarioId: string,
    ): Promise<{ destacado: boolean }> {
        await this.permisosService.obtenerConAcceso(id, usuarioId);
        const actualizada = await this.carpetaRepository.actualizarDestacado(
            id,
            usuarioId,
            dto.destacado,
        );
        if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');

        return { destacado: dto.destacado };
    }

    async renombrar(
        id: string,
        dto: RenombrarCarpetaDTO,
        usuarioId: string,
    ): Promise<ICarpeta> {
        const carpeta = await this.permisosService.obtenerConPermisoEdicion(
            id,
            usuarioId,
        );

        await this.validator.validarNombreUnico(
            carpeta.propietario.toString(),
            carpeta.carpetaPadre?.toString() ?? null,
            dto.nombre,
            id,
        );

        const actualizada = await this.carpetaRepository.actualizar(id, {
            nombre: dto.nombre,
        });
        if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');

        await this.registrarActividad(
            usuarioId,
            AccionActividad.Renombrar,
            actualizada,
            {
                nombreAnterior: carpeta.nombre,
            },
        );

        return actualizada;
    }

    /**
     * Mueve una carpeta (solo el propietario). Si cambia de árbol, el
     * subárbol completo pasa al dueño del destino para conservar un único
     * propietario por árbol; los archivos internos se actualizan en bloque.
     */
    async mover(
        id: string,
        dto: MoverCarpetaDTO,
        usuarioId: string,
    ): Promise<ICarpeta> {
        const nuevoPadreId = dto.carpetaPadre;
        const carpeta = await this.permisosService.obtenerComoPropietario(
            id,
            usuarioId,
        );
        let propietarioId = carpeta.propietario.toString();

        await this.validator.validarSinCiclos(id, nuevoPadreId);

        if (nuevoPadreId) {
            const padre = await this.permisosService.validarPadreEditable(
                nuevoPadreId,
                usuarioId,
            );
            propietarioId = padre!.propietario.toString();
        }

        await this.validator.validarNombreUnico(
            propietarioId,
            nuevoPadreId,
            carpeta.nombre,
            id,
        );

        const descendientes =
            await this.carpetaRepository.obtenerDescendientesIds(id);

        const actualizada = await this.carpetaRepository.actualizar(id, {
            carpetaPadre: nuevoPadreId
                ? new Types.ObjectId(nuevoPadreId)
                : null,
            propietario: new Types.ObjectId(propietarioId),
        });
        if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');

        if (propietarioId !== usuarioId) {
            const ids = [id, ...descendientes];
            await this.carpetaRepository.actualizarPropietarioArbol(
                ids,
                propietarioId,
            );
            await this.archivoRepository.actualizarPropietarioPorCarpetas(
                ids,
                propietarioId,
            );
        }

        await this.registrarActividad(
            usuarioId,
            AccionActividad.Mover,
            actualizada,
            {
                carpetaOrigen: carpeta.carpetaPadre?.toString() ?? null,
                carpetaDestino: nuevoPadreId,
            },
        );

        return actualizada;
    }

    // Métodos privados
    /** Serializa la carpeta agregando `miPermiso` para el frontend. */
    private conPermiso(
        carpeta: ICarpeta,
        permiso: NivelPermiso | null,
    ): CarpetaConPermiso {
        return {
            ...carpeta.toObject(),
            miPermiso: permiso,
        } as unknown as CarpetaConPermiso;
    }

    private async registrarActividad(
        usuarioId: string,
        accion: AccionActividad,
        carpeta: ICarpeta,
        metadata: Record<string, unknown> = {},
    ): Promise<void> {
        await this.actividadService.registrar({
            usuarioId,
            accion,
            recursoTipo: TipoRecurso.Carpeta,
            recursoId: carpeta._id.toString(),
            recursoNombre: carpeta.nombre,
            metadata,
        });
    }
}
