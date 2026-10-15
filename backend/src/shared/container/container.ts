import { ActividadController } from '../../modules/actividad/actividad.controller';
import { MongoActividadRepository } from '../../modules/actividad/actividad.repository';
import { ActividadService } from '../../modules/actividad/actividad.service';
import { ArchivoCompartidosService } from '../../modules/archivo/archivo-compartido.service';
import { ArchivoPapeleraService } from '../../modules/archivo/archivo-papelera.service';
import { ArchivoPermisosService } from '../../modules/archivo/archivo-permisos.service';
import { ArchivoController } from '../../modules/archivo/archivo.controller';
import { MongoArchivoRepository } from '../../modules/archivo/archivo.repository';
import { ArchivoService } from '../../modules/archivo/archivo.service';
import { AuthController } from '../../modules/auth/auth.controller';
import { AuthService } from '../../modules/auth/auth.service';
import { CarpetaCompartidosService } from '../../modules/carpeta/carpeta-compartido.service';
import { CarpetaPapeleraService } from '../../modules/carpeta/carpeta-papelera.service';
import { CarpetaPermisosService } from '../../modules/carpeta/carpeta-permisos.service';
import { CarpetaController } from '../../modules/carpeta/carpeta.controller';
import { MongoCarpetaRepository } from '../../modules/carpeta/carpeta.repository';
import { CarpetaService } from '../../modules/carpeta/carpeta.service';
import { UsuarioPermisosService } from '../../modules/usuario/usuario-permisos.services';
import { UsuarioController } from '../../modules/usuario/usuario.controller';
import { MongoUsuarioRepository } from '../../modules/usuario/usuario.repository';
import { UsuarioService } from '../../modules/usuario/usuario.service';

// Repositorios
const usuarioRepository = new MongoUsuarioRepository();
const carpetaRepository = new MongoCarpetaRepository();
const archivoRepository = new MongoArchivoRepository();
const actividadRepository = new MongoActividadRepository();

// Actividades
const actividadService = new ActividadService(
    actividadRepository,
    usuarioRepository,
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
const carpetaPermisosService = new CarpetaPermisosService(carpetaRepository);
const carpetaService = new CarpetaService(
    carpetaRepository,
    carpetaPermisosService,
    actividadService,
);
const carpetaCompartidosService = new CarpetaCompartidosService(
    carpetaRepository,
    carpetaPermisosService,
    actividadService,
);
const carpetaPapeleraService = new CarpetaPapeleraService(
    carpetaRepository,
    carpetaPermisosService,
    actividadService,
);
const carpetaController = new CarpetaController(
    carpetaService,
    carpetaCompartidosService,
    carpetaPapeleraService,
);

// Archivos
const archivoPermisosService = new ArchivoPermisosService(
    archivoRepository,
    carpetaRepository,
    carpetaPermisosService,
);
const archivoService = new ArchivoService(
    archivoRepository,
    archivoPermisosService,
    actividadService,
);
const archivoCompartidosService = new ArchivoCompartidosService(
    archivoRepository,
    archivoPermisosService,
    actividadService,
);
const archivoPapeleraService = new ArchivoPapeleraService(
    archivoRepository,
    carpetaRepository,
    archivoPermisosService,
    actividadService,
);
const archivoController = new ArchivoController(
    archivoService,
    archivoCompartidosService,
    archivoPapeleraService,
);

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

    // Actividades
    actividadController,
};

export type Container = typeof container;
