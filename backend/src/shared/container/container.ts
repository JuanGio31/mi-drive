import { ActividadController } from '../../modules/actividad/actividad.controller';
import { MongoActividadRepository } from '../../modules/actividad/actividad.repository';
import { ActividadService } from '../../modules/actividad/actividad.service';
import { ArchivoCompartidosService } from '../../modules/archivo/archivo-compartido.service';
import { ArchivoPapeleraService } from '../../modules/archivo/archivo-papelera.service';
import { ArchivoPermisosService } from '../../modules/archivo/archivo-permisos.service';
import { ArchivoValidator } from '../../modules/archivo/archivo.validator';
import { ArchivoController } from '../../modules/archivo/archivo.controller';
import { MongoArchivoRepository } from '../../modules/archivo/archivo.repository';
import { ArchivoService } from '../../modules/archivo/archivo.service';
import { AuthController } from '../../modules/auth/auth.controller';
import { AuthService } from '../../modules/auth/auth.service';
import { BusquedaController } from '../../modules/busqueda/busqueda.controller';
import { BusquedaService } from '../../modules/busqueda/busqueda.service';
import { CarpetaCompartidosService } from '../../modules/carpeta/carpeta-compartido.service';
import { CarpetaPapeleraService } from '../../modules/carpeta/carpeta-papelera.service';
import { CarpetaPermisosService } from '../../modules/carpeta/carpeta-permisos.service';
import { CarpetaValidator } from '../../modules/carpeta/carpeta.validator';
import { CarpetaController } from '../../modules/carpeta/carpeta.controller';
import { MongoCarpetaRepository } from '../../modules/carpeta/carpeta.repository';
import { CarpetaService } from '../../modules/carpeta/carpeta.service';
import { ReporteController } from '../../modules/reporte/reporte.controller';
import { MongoReporteRepository } from '../../modules/reporte/reporte.repository';
import { ReporteService } from '../../modules/reporte/reporte.service';
import { UsuarioPermisosService } from '../../modules/usuario/usuario-permisos.services';
import { UsuarioController } from '../../modules/usuario/usuario.controller';
import { MongoUsuarioRepository } from '../../modules/usuario/usuario.repository';
import { UsuarioService } from '../../modules/usuario/usuario.service';

// Repositorios
const usuarioRepository = new MongoUsuarioRepository();
const carpetaRepository = new MongoCarpetaRepository();
const archivoRepository = new MongoArchivoRepository();
const actividadRepository = new MongoActividadRepository();
const reporteRepository = new MongoReporteRepository();

// Permisos compartidos por actividad y recursos
const carpetaPermisosService = new CarpetaPermisosService(carpetaRepository);
const archivoPermisosService = new ArchivoPermisosService(
    archivoRepository,
    carpetaRepository,
    carpetaPermisosService,
);

// Actividades
const actividadService = new ActividadService(
    actividadRepository,
    usuarioRepository,
    archivoPermisosService,
    carpetaPermisosService,
);
const actividadController = new ActividadController(actividadService);

// Usuarios
const usuarioPermisosService = new UsuarioPermisosService(usuarioRepository);
const usuarioService = new UsuarioService(
    usuarioRepository,
    usuarioPermisosService,
    actividadService,
);
const usuarioController = new UsuarioController(usuarioService);

// Auth
const authService = new AuthService(usuarioRepository, actividadService);
const authController = new AuthController(authService);

// Carpetas
const carpetaValidator = new CarpetaValidator(carpetaRepository);
const carpetaService = new CarpetaService(
    carpetaRepository,
    archivoRepository,
    carpetaPermisosService,
    carpetaValidator,
    actividadService,
);
const carpetaCompartidosService = new CarpetaCompartidosService(
    carpetaRepository,
    carpetaPermisosService,
    actividadService,
    usuarioRepository,
);
const carpetaPapeleraService = new CarpetaPapeleraService(
    carpetaRepository,
    archivoRepository,
    carpetaPermisosService,
    carpetaValidator,
    actividadService,
);
const carpetaController = new CarpetaController(
    carpetaService,
    carpetaCompartidosService,
    carpetaPapeleraService,
);

// Archivos
const archivoValidator = new ArchivoValidator(
    archivoRepository,
    carpetaRepository,
);
const archivoService = new ArchivoService(
    archivoRepository,
    archivoPermisosService,
    archivoValidator,
    actividadService,
);
const archivoCompartidosService = new ArchivoCompartidosService(
    archivoRepository,
    archivoPermisosService,
    actividadService,
    usuarioRepository,
);
const archivoPapeleraService = new ArchivoPapeleraService(
    archivoRepository,
    archivoPermisosService,
    archivoValidator,
    actividadService,
);
const archivoController = new ArchivoController(
    archivoService,
    archivoCompartidosService,
    archivoPapeleraService,
);

// Busqueda global
const busquedaService = new BusquedaService(
    archivoRepository,
    carpetaRepository,
);
const busquedaController = new BusquedaController(busquedaService);

// Reportes
const reporteService = new ReporteService(
    reporteRepository,
    usuarioRepository,
    actividadService,
);
const reporteController = new ReporteController(reporteService);

// Exportacion
export const container = {
    // Repositorios
    usuarioRepository,
    carpetaRepository,
    archivoRepository,
    actividadRepository,

    // Servicios compartidos
    actividadService,

    // Auth
    authService,
    authController,

    // Usuarios
    usuarioService,
    usuarioController,

    // Carpetas
    carpetaService,
    carpetaPermisosService,
    carpetaCompartidosService,
    carpetaPapeleraService,
    carpetaController,

    // Archivos
    archivoService,
    archivoPermisosService,
    archivoCompartidosService,
    archivoPapeleraService,
    archivoController,

    // Busqueda global
    busquedaService,
    busquedaController,

    // Actividades
    actividadController,

    // Reportes
    reporteService,
    reporteController,
};

export type Container = typeof container;
