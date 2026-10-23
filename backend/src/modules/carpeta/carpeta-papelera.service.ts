import { ICarpetaRepository } from './carpeta.repository';
import { CarpetaPermisosService } from './carpeta-permisos.service';
import { CarpetaValidator } from './carpeta.validator';
import { ICarpeta } from './carpeta.model';
import { HttpError } from '../../shared/errors/http-error';
import { ActividadService } from '../actividad/actividad.service';
import { AccionActividad, TipoRecurso } from '../../shared/types/enums';
import { IArchivoRepository } from '../archivo/archivo.repository';

export class CarpetaPapeleraService {
    constructor(
        private readonly carpetaRepository: ICarpetaRepository,
        private readonly archivoRepository: IArchivoRepository,
        private readonly permisosService: CarpetaPermisosService,
        private readonly validator: CarpetaValidator,
        private readonly actividadService: ActividadService,
    ) {}

    /**
     * Envía una carpeta y todo su subárbol a la papelera en dos operaciones
     * masivas: una para carpetas y otra para archivos. Solo el propietario
     * puede hacerlo y todos los elementos quedan con la carpeta como raíz.
     */
    async enviar(id: string, usuarioId: string): Promise<ICarpeta> {
        const carpeta = await this.permisosService.obtenerComoPropietario(
            id,
            usuarioId,
            true,
        );
        if (carpeta.enPapelera) {
            throw HttpError.badRequest('La carpeta ya está en la papelera');
        }

        const descendientes =
            await this.carpetaRepository.obtenerDescendientesIds(id);
        const ids = [id, ...descendientes];

        await this.carpetaRepository.enviarAPapeleraCascada(ids, id);
        await this.archivoRepository.enviarAPapeleraPorCarpetas(ids, id);

        const actualizada = await this.carpetaRepository.buscarPorId(id);
        if (!actualizada) throw HttpError.notFound('Carpeta no encontrada');

        await this.actividadService.registrar({
            usuarioId,
            accion: AccionActividad.EnviarPapelera,
            recursoTipo: TipoRecurso.Carpeta,
            recursoId: id,
            recursoNombre: carpeta.nombre,
        });

        return actualizada;
    }

    /**
     * Restaura una carpeta eliminada individualmente junto con su subárbol.
     * No permite restaurar hijos sueltos ni carpetas cuyo padre sigue en la
     * papelera.
     */
    async restaurar(id: string, usuarioId: string): Promise<ICarpeta> {
        const carpeta = await this.permisosService.obtenerComoPropietario(
            id,
            usuarioId,
            true,
        );

        if (!carpeta.enPapelera) {
            throw HttpError.badRequest('La carpeta no está en la papelera');
        }
        if (carpeta.papeleraRaiz?.toString() !== id) {
            throw HttpError.badRequest(
                'La carpeta se eliminó junto con otra; restaure la carpeta superior',
            );
        }

        await this.validator.validarPadreDisponible(
            carpeta.carpetaPadre?.toString() ?? null,
        );

        await this.carpetaRepository.restaurarCascada(id);
        await this.archivoRepository.restaurarPorCarpetaRaiz(id);

        const restaurada = await this.carpetaRepository.buscarPorId(id);
        if (!restaurada) throw HttpError.notFound('Carpeta no encontrada');

        await this.actividadService.registrar({
            usuarioId,
            accion: AccionActividad.Restaurar,
            recursoTipo: TipoRecurso.Carpeta,
            recursoId: id,
            recursoNombre: carpeta.nombre,
        });

        return restaurada;
    }

    /**
     * Elimina definitivamente la carpeta y todo su subárbol. Solo se permite
     * desde la raíz del envío a papelera, igual que la restauración.
     */
    async eliminarPermanente(id: string, usuarioId: string): Promise<void> {
        const carpeta = await this.permisosService.obtenerComoPropietario(
            id,
            usuarioId,
            true,
        );

        if (!carpeta.enPapelera) {
            throw HttpError.badRequest('La carpeta no está en la papelera');
        }
        if ((carpeta.papeleraRaiz?.toString() ?? id) !== id) {
            throw HttpError.badRequest(
                'La carpeta se eliminó junto con otra; elimine la carpeta superior',
            );
        }

        const descendientes =
            await this.carpetaRepository.obtenerDescendientesIds(id);
        const ids = [id, ...descendientes];

        const archivos =
            await this.archivoRepository.eliminarPermanentePorCarpetas(
                ids,
                id,
            );
        const carpetas =
            await this.carpetaRepository.eliminarPermanenteCascada(ids);

        await this.actividadService.registrar({
            usuarioId,
            accion: AccionActividad.EliminarPermanente,
            recursoTipo: TipoRecurso.Carpeta,
            recursoId: id,
            recursoNombre: carpeta.nombre,
            metadata: { carpetas, archivos },
        });
    }
}
