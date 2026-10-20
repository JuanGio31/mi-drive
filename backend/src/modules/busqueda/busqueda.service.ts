import { IArchivoRepository } from '../archivo/archivo.repository';
import { IArchivo } from '../archivo/archivo.model';
import { ICarpetaRepository } from '../carpeta/carpeta.repository';
import { ICarpeta } from '../carpeta/carpeta.model';

/** Resultado unificado de la búsqueda global. */
export interface ResultadoBusqueda {
    archivos: IArchivo[];
    carpetas: ICarpeta[];
}

export class BusquedaService {
    constructor(
        private readonly archivoRepository: IArchivoRepository,
        private readonly carpetaRepository: ICarpetaRepository,
    ) {}

    /**
     * Busca archivos y carpetas por nombre (parcial, sin distinguir
     * mayúsculas) entre todo lo que el usuario puede ver: lo propio, lo
     * compartido con él y lo que está dentro de sus carpetas compartidas.
     */
    async buscar(
        usuarioId: string,
        q: string,
        limite?: number,
    ): Promise<ResultadoBusqueda> {
        const tope = Math.min(Number(limite) || 8, 20);

        const carpetasCompartidas =
            await this.carpetaRepository.listarCompartidasCon(
                usuarioId,
                null,
                true,
            );
        const raices = carpetasCompartidas.map((c) => c._id.toString());
        const descendientes =
            await this.carpetaRepository.obtenerDescendientesDeVarias(raices);
        const idsCompartidas = Array.from(
            new Set([...raices, ...descendientes]),
        );

        const [archivos, carpetas] = await Promise.all([
            this.archivoRepository.buscarPorNombre(
                usuarioId,
                idsCompartidas,
                q,
                tope,
            ),
            this.carpetaRepository.buscarPorNombre(
                usuarioId,
                q,
                tope,
                idsCompartidas,
            ),
        ]);

        return { archivos, carpetas };
    }
}
