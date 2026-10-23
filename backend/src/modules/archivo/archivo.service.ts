import { Types } from 'mongoose';
import { IArchivoRepository } from './archivo.repository';
import { ArchivoPermisosService } from './archivo-permisos.service';
import { ArchivoValidator } from './archivo.validator';
import { ActividadService } from '../actividad/actividad.service';
import {
    CrearArchivoDTO,
    ActualizarContenidoDTO,
    RenombrarArchivoDTO,
    MoverArchivoDTO,
    DestacarArchivoDTO,
    ListarArchivosQueryDTO,
} from './archivo.dto';
import { HttpError } from '../../shared/errors/http-error';
import { IArchivo } from './archivo.model';
import {
    AccionActividad,
    ExtensionArchivo,
    NivelPermiso,
    TipoRecurso,
} from '../../shared/types/enums';
import { CachePermisos } from '../carpeta/carpeta-permisos.service';

/** Archivo serializado con el permiso efectivo del usuario actual. */
export type ArchivoConPermiso = IArchivo & {
    miPermiso: NivelPermiso | null;
};

export class ArchivoService {
    constructor(
        private readonly archivoRepository: IArchivoRepository,
        private readonly permisosService: ArchivoPermisosService,
        private readonly validator: ArchivoValidator,
        private readonly actividadService: ActividadService,
    ) {}

    async crear(dto: CrearArchivoDTO, usuarioId: string): Promise<IArchivo> {
        const carpetaPadre = dto.carpetaPadre ?? null;

        // El propietario del archivo será el propietario de la carpeta padre
        // (si está dentro de una carpeta), o el propio usuario (si está en la raíz).
        let propietarioId = usuarioId;

        if (carpetaPadre) {
            const carpetaInfo =
                await this.permisosService.validarCarpetaDestino(
                    carpetaPadre,
                    usuarioId,
                );
            propietarioId = carpetaInfo!.propietarioId;
        }

        await this.validator.validarNombreUnico(
            propietarioId,
            carpetaPadre,
            dto.nombre,
        );

        const tamanio = Buffer.byteLength(dto.contenido, 'utf8');

        const archivo = await this.archivoRepository.crear({
            nombre: dto.nombre,
            tipo: dto.tipo as ExtensionArchivo,
            contenido: dto.contenido,
            tamanio,
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
            archivo,
            {
                tipo: archivo.tipo,
                tamanio,
            },
        );

        return archivo;
    }

    /**
     * Lista los archivos de una carpeta. Resuelve una sola vez el permiso del
     * padre y lo usa para todos los hijos, sin consultas por archivo.
     */
    async listar(
        usuarioId: string,
        filtros: ListarArchivosQueryDTO,
    ): Promise<ArchivoConPermiso[]> {
        const carpetaPadre = filtros.carpetaPadre ?? null;
        let permisoPadre: NivelPermiso | null = null;

        if (carpetaPadre) {
            permisoPadre = await this.permisosService.obtenerPermisoCarpeta(
                carpetaPadre,
                usuarioId,
            );
            if (!permisoPadre) {
                throw HttpError.notFound('Carpeta no encontrada');
            }
        }

        const archivos = await this.archivoRepository.listar(
            usuarioId,
            filtros,
            permisoPadre !== null,
        );

        return archivos.map((archivo) =>
            this.conPermiso(
                archivo,
                this.permisoDeArchivo(archivo, usuarioId, permisoPadre),
            ),
        );
    }

    async listarCompartidos(usuarioId: string): Promise<IArchivo[]> {
        return this.archivoRepository.listarCompartidosCon(usuarioId);
    }

    /**
     * Lista los archivos destacados por el usuario y descarta los que ya no
     * tiene permiso de ver (por ejemplo, si le revocaron una compartición).
     */
    async listarDestacados(usuarioId: string): Promise<ArchivoConPermiso[]> {
        const archivos = await this.archivoRepository.listarDestacados(
            usuarioId,
        );
        if (archivos.length === 0) return [];

        const permisos = await this.permisosService.obtenerPermiso(
            archivos,
            usuarioId,
        );
        const resultado: ArchivoConPermiso[] = [];

        for (const archivo of archivos) {
            const permiso = permisos.get(archivo._id.toString()) ?? null;
            if (permiso) resultado.push(this.conPermiso(archivo, permiso));
        }

        return resultado;
    }

    async listarPapelera(usuarioId: string): Promise<IArchivo[]> {
        return this.archivoRepository.listarPapelera(usuarioId);
    }

    /**
     * Carga un archivo accesible y adjunta el permiso efectivo del usuario.
     * Usa una caché local para reutilizar la resolución de ancestros.
     */
    async buscarPorId(
        id: string,
        usuarioId: string,
    ): Promise<ArchivoConPermiso> {
        const cache: CachePermisos = new Map();
        const archivo = await this.permisosService.obtenerConAcceso(
            id,
            usuarioId,
            false,
            cache,
        );
        const permisos = await this.permisosService.obtenerPermiso(
            [archivo],
            usuarioId,
            cache,
        );
        return this.conPermiso(
            archivo,
            permisos.get(archivo._id.toString()) ?? null,
        );
    }

    /** Registra que el usuario abrió el archivo desde el visor. */
    async registrarApertura(id: string, usuarioId: string): Promise<void> {
        const archivo = await this.permisosService.obtenerConAcceso(
            id,
            usuarioId,
        );
        await this.registrarActividad(
            usuarioId,
            AccionActividad.Abrir,
            archivo,
        );
    }

    async actualizarContenido(
        id: string,
        dto: ActualizarContenidoDTO,
        usuarioId: string,
    ): Promise<IArchivo> {
        const archivo = await this.permisosService.obtenerConPermisoEdicion(
            id,
            usuarioId,
        );

        const tamanio = Buffer.byteLength(dto.contenido, 'utf8');
        const tamañoAnterior = archivo.tamanio;

        const actualizado = await this.archivoRepository.actualizar(id, {
            contenido: dto.contenido,
            tamanio,
        });
        if (!actualizado) throw HttpError.notFound('Archivo no encontrado');

        await this.registrarActividad(
            usuarioId,
            AccionActividad.ActualizarContenido,
            actualizado,
            {
                tamañoAnterior,
                tamañoNuevo: tamanio,
            },
        );

        return actualizado;
    }

    async destacar(
        id: string,
        dto: DestacarArchivoDTO,
        usuarioId: string,
    ): Promise<{ destacado: boolean }> {
        await this.permisosService.obtenerConAcceso(id, usuarioId);
        const actualizado = await this.archivoRepository.actualizarDestacado(
            id,
            usuarioId,
            dto.destacado,
        );
        if (!actualizado) throw HttpError.notFound('Archivo no encontrado');

        return { destacado: dto.destacado };
    }

    async renombrar(
        id: string,
        dto: RenombrarArchivoDTO,
        usuarioId: string,
    ): Promise<IArchivo> {
        const archivo = await this.permisosService.obtenerConPermisoEdicion(
            id,
            usuarioId,
        );

        await this.validator.validarNombreUnico(
            archivo.propietario.toString(),
            archivo.carpetaPadre?.toString() ?? null,
            dto.nombre,
            id,
        );

        const actualizado = await this.archivoRepository.actualizar(id, {
            nombre: dto.nombre,
        });
        if (!actualizado) throw HttpError.notFound('Archivo no encontrado');

        await this.registrarActividad(
            usuarioId,
            AccionActividad.Renombrar,
            actualizado,
            {
                nombreAnterior: archivo.nombre,
            },
        );

        return actualizado;
    }

    /**
     * Mueve un archivo (solo el propietario). Si cambia de árbol, el archivo
     * pasa a pertenecer al dueño de la carpeta destino para conservar el
     * invariante de un único propietario por árbol.
     */
    async mover(
        id: string,
        dto: MoverArchivoDTO,
        usuarioId: string,
    ): Promise<IArchivo> {
        const archivo = await this.permisosService.obtenerComoPropietario(
            id,
            usuarioId,
        );
        const nuevoPadreId = dto.carpetaPadre;
        let propietarioId = archivo.propietario.toString();

        if (nuevoPadreId) {
            const destino = await this.permisosService.validarCarpetaDestino(
                nuevoPadreId,
                usuarioId,
            );
            propietarioId = destino!.propietarioId;
        }

        await this.validator.validarNombreUnico(
            propietarioId,
            nuevoPadreId,
            archivo.nombre,
            id,
        );

        const actualizado = await this.archivoRepository.actualizar(id, {
            carpetaPadre: nuevoPadreId
                ? new Types.ObjectId(nuevoPadreId)
                : null,
            propietario: new Types.ObjectId(propietarioId),
        });
        if (!actualizado) throw HttpError.notFound('Archivo no encontrado');

        await this.registrarActividad(
            usuarioId,
            AccionActividad.Mover,
            actualizado,
            {
                carpetaOrigen: archivo.carpetaPadre?.toString() ?? null,
                carpetaDestino: nuevoPadreId,
            },
        );

        return actualizado;
    }

    // Metodos privados
    /**
     * Calcula el permiso de un archivo en memoria: dueño, share directo o el
     * permiso heredado de la carpeta que se está listando.
     */
    private permisoDeArchivo(
        archivo: IArchivo,
        usuarioId: string,
        permisoHeredado: NivelPermiso | null,
    ): NivelPermiso | null {
        if (archivo.propietario.toString() === usuarioId) {
            return NivelPermiso.Escritura;
        }

        const directo = archivo.compartidoCon.find(
            (c) => c.usuario.toString() === usuarioId,
        );
        return directo ? directo.permiso : permisoHeredado;
    }

    /** Serializa el archivo agregando `miPermiso` para el frontend. */
    private conPermiso(
        archivo: IArchivo,
        permiso: NivelPermiso | null,
    ): ArchivoConPermiso {
        return {
            ...archivo.toObject(),
            miPermiso: permiso,
        } as unknown as ArchivoConPermiso;
    }

    private async registrarActividad(
        usuarioId: string,
        accion: AccionActividad,
        archivo: IArchivo,
        metadata: Record<string, unknown> = {},
    ): Promise<void> {
        await this.actividadService.registrar({
            usuarioId,
            accion,
            recursoTipo: TipoRecurso.Archivo,
            recursoId: archivo._id.toString(),
            recursoNombre: archivo.nombre,
            metadata,
        });
    }
}
