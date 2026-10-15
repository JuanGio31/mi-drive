import { ICarpetaRepository } from './carpeta.repository';
import { CarpetaPermisosService } from './carpeta-permisos.service';
// import { ActividadService } from '../actividad/actividad.service';
import { ICarpeta } from './carpeta.model';
import { HttpError } from '../../shared/errors/http-error';
import { ActividadService } from '../actividad/actividad.service';
import { AccionActividad, TipoRecurso } from '../../shared/types/enums';

export class CarpetaPapeleraService {
    constructor(
        private readonly carpetaRepository: ICarpetaRepository,
        private readonly permisosService: CarpetaPermisosService,
        private readonly actividadService: ActividadService,
    ) {}

    async enviar(id: string, usuarioId: string): Promise<ICarpeta> {
        const carpeta = await this.permisosService.obtenerConPermisoEdicion(
            id,
            usuarioId,
        );

        const actualizada = await this.carpetaRepository.enviarAPapelera(id);
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

    async restaurar(id: string, usuarioId: string): Promise<ICarpeta> {
        const carpeta = await this.permisosService.obtenerConPermisoEdicion(
            id,
            usuarioId,
        );

        if (!carpeta.enPapelera) {
            throw HttpError.badRequest('La carpeta no está en la papelera');
        }

        await this.validarPadreDisponible(carpeta);

        const restaurada = await this.carpetaRepository.restaurar(id);
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

    private async validarPadreDisponible(carpeta: ICarpeta): Promise<void> {
        if (!carpeta.carpetaPadre) return;

        const padre = await this.carpetaRepository.buscarPorId(
            carpeta.carpetaPadre.toString(),
        );
        if (!padre || padre.enPapelera) {
            throw HttpError.badRequest(
                'No se puede restaurar: la carpeta padre no está disponible',
            );
        }
    }
}
