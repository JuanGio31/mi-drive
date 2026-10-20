import { IArchivoRepository } from './archivo.repository';
import { ArchivoPermisosService } from './archivo-permisos.service';
import { ArchivoValidator } from './archivo.validator';
import { ActividadService } from '../actividad/actividad.service';
import { IArchivo } from './archivo.model';
import { HttpError } from '../../shared/errors/http-error';
import { AccionActividad, TipoRecurso } from '../../shared/types/enums';

export class ArchivoPapeleraService {
    constructor(
        private readonly archivoRepository: IArchivoRepository,
        private readonly permisosService: ArchivoPermisosService,
        private readonly validator: ArchivoValidator,
        private readonly actividadService: ActividadService,
    ) {}

    /**
     * Envía un archivo a la papelera. Solo el propietario puede hacerlo y el
     * archivo queda marcado como raíz de su propio envío.
     */
    async enviar(id: string, usuarioId: string): Promise<IArchivo> {
        const archivo = await this.permisosService.obtenerComoPropietario(
            id,
            usuarioId,
            true,
        );
        if (archivo.enPapelera) {
            throw HttpError.badRequest('El archivo ya está en la papelera');
        }

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

    /**
     * Restaura un archivo enviado individualmente a la papelera. Si se eliminó
     * junto con su carpeta, debe restaurarse la carpeta contenedora.
     */
    async restaurar(id: string, usuarioId: string): Promise<IArchivo> {
        const archivo = await this.permisosService.obtenerComoPropietario(
            id,
            usuarioId,
            true,
        );

        if (!archivo.enPapelera) {
            throw HttpError.badRequest('El archivo no está en la papelera');
        }
        if (archivo.papeleraRaiz?.toString() !== id) {
            throw HttpError.badRequest(
                'El archivo se eliminó junto con su carpeta; restaure la carpeta',
            );
        }

        await this.validator.validarPadreDisponible(
            archivo.carpetaPadre?.toString() ?? null,
        );

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
}
