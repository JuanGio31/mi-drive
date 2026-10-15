import { Types } from 'mongoose';
import { IArchivoRepository } from './archivo.repository';
import { ArchivoPermisosService } from './archivo-permisos.service';
import { ActividadService } from '../actividad/actividad.service';
import {
    CrearArchivoDTO,
    ActualizarContenidoDTO,
    RenombrarArchivoDTO,
    MoverArchivoDTO,
    ListarArchivosQueryDTO,
} from './archivo.dto';
import { HttpError } from '../../shared/errors/http-error';
import { IArchivo } from './archivo.model';
import {
    AccionActividad,
    ExtensionArchivo,
    TipoRecurso,
} from '../../shared/types/enums';

export class ArchivoService {
    constructor(
        private readonly archivoRepository: IArchivoRepository,
        private readonly permisosService: ArchivoPermisosService,
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

        await this.validarNombreUnico(propietarioId, carpetaPadre, dto.nombre);

        const tamanio = Buffer.byteLength(dto.contenido, 'utf8');

        const archivo = await this.archivoRepository.crear({
            nombre: dto.nombre,
            tipo: dto.tipo as ExtensionArchivo,
            contenido: dto.contenido,
            tamanio,
            propietario: new Types.ObjectId(propietarioId),
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

    async listar(
        usuarioId: string,
        filtros: ListarArchivosQueryDTO,
    ): Promise<IArchivo[]> {
        const carpetasCompartidas = filtros.incluirCompartidas
            ? await this.obtenerCarpetasCompartidasIds(usuarioId)
            : [];

        return this.archivoRepository.listar(
            usuarioId,
            filtros,
            carpetasCompartidas,
        );
    }

    async listarCompartidos(usuarioId: string): Promise<IArchivo[]> {
        return this.archivoRepository.listarCompartidosCon(usuarioId);
    }

    async buscarPorId(id: string, usuarioId: string): Promise<IArchivo> {
        return this.permisosService.obtenerConAcceso(id, usuarioId);
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

    async renombrar(
        id: string,
        dto: RenombrarArchivoDTO,
        usuarioId: string,
    ): Promise<IArchivo> {
        const archivo = await this.permisosService.obtenerConPermisoEdicion(
            id,
            usuarioId,
        );

        await this.validarNombreUnico(
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

    async mover(
        id: string,
        dto: MoverArchivoDTO,
        usuarioId: string,
    ): Promise<IArchivo> {
        const archivo = await this.permisosService.obtenerConPermisoEdicion(
            id,
            usuarioId,
        );
        const nuevoPadreId = dto.carpetaPadre;

        if (nuevoPadreId) {
            await this.permisosService.validarCarpetaDestino(
                nuevoPadreId,
                usuarioId,
            );
        }

        await this.validarNombreUnico(
            archivo.propietario.toString(),
            nuevoPadreId,
            archivo.nombre,
            id,
        );

        const actualizado = await this.archivoRepository.actualizar(id, {
            carpetaPadre: nuevoPadreId
                ? new Types.ObjectId(nuevoPadreId)
                : null,
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

    private async validarNombreUnico(
        propietarioId: string,
        carpetaPadre: string | null,
        nombre: string,
        excluirId?: string,
    ): Promise<void> {
        const existe = await this.archivoRepository.existeArchivoConNombre(
            propietarioId,
            carpetaPadre,
            nombre,
            excluirId,
        );
        if (existe) {
            throw HttpError.conflict(
                'Ya existe un archivo con ese nombre en esta ubicación',
            );
        }
    }

    private async obtenerCarpetasCompartidasIds(
        usuarioId: string,
    ): Promise<string[]> {
        return this.permisosService.obtenerIdsCarpetasCompartidas(usuarioId);
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
