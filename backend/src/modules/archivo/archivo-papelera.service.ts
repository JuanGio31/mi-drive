import { IArchivoRepository } from './archivo.repository';
import { ArchivoPermisosService } from './archivo-permisos.service';
import { ActividadService } from '../actividad/actividad.service';
import { IArchivo } from './archivo.model';
import { HttpError } from '../../shared/errors/http-error';
import { ICarpetaRepository } from '../carpeta/carpeta.repository';
import { AccionActividad, TipoRecurso } from '../../shared/types/enums';

export class ArchivoPapeleraService {
    constructor(
        private readonly archivoRepository: IArchivoRepository,
        private readonly carpetaRepository: ICarpetaRepository,
        private readonly permisosService: ArchivoPermisosService,
        private readonly actividadService: ActividadService,
    ) {}

    async enviar(id: string, usuarioId: string): Promise<IArchivo> {
        const archivo = await this.permisosService.obtenerConPermisoEdicion(
            id,
            usuarioId,
        );

        const actualizado = await this.archivoRepository.enviarAPapelera(id);
        if (!actualizado) throw HttpError.notFound('Archivo no encontrado');

        await this.actividadService.registrar({
            usuarioId,
            accion: AccionActividad.EnviarPapelera,
            recursoTipo: TipoRecurso.Archivo,
            recursoId: id,
            recursoNombre: archivo.nombre,
        });

        return actualizado;
    }

    async restaurar(id: string, usuarioId: string): Promise<IArchivo> {
        const archivo = await this.permisosService.obtenerConPermisoEdicion(
            id,
            usuarioId,
        );

        if (!archivo.enPapelera) {
            throw HttpError.badRequest('El archivo no está en la papelera');
        }

        await this.validarPadreDisponible(archivo);

        const restaurado = await this.archivoRepository.restaurar(id);
        if (!restaurado) throw HttpError.notFound('Archivo no encontrado');

        await this.actividadService.registrar({
            usuarioId,
            accion: AccionActividad.Restaurar,
            recursoTipo: TipoRecurso.Archivo,
            recursoId: id,
            recursoNombre: archivo.nombre,
        });

        return restaurado;
    }

    private async validarPadreDisponible(archivo: IArchivo): Promise<void> {
        if (!archivo.carpetaPadre) return;

        const padre = await this.carpetaRepository.buscarPorId(
            archivo.carpetaPadre.toString(),
        );
        if (!padre || padre.enPapelera) {
            throw HttpError.badRequest(
                'No se puede restaurar: la carpeta padre no está disponible',
            );
        }
    }
}
