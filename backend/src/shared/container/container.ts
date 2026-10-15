import { ArchivoController } from '../../modules/archivo/archivo.controller';
import { MongoArchivoRepository } from '../../modules/archivo/archivo.repository';
import { ArchivoService } from '../../modules/archivo/archivo.service';
import { AuthController } from '../../modules/auth/auth.controller';
import { AuthService } from '../../modules/auth/auth.service';
import { CarpetaController } from '../../modules/carpeta/carpeta.controller';
import { MongoCarpetaRepository } from '../../modules/carpeta/carpeta.repository';
import { CarpetaService } from '../../modules/carpeta/carpeta.service';
import { UsuarioController } from '../../modules/usuario/usuario.controller';
import { MongoUsuarioRepository } from '../../modules/usuario/usuario.repository';
import { UsuarioService } from '../../modules/usuario/usuario.service';

// Repositorios
const usuarioRepository = new MongoUsuarioRepository();
const carpetaRepository = new MongoCarpetaRepository();
const archivoRepository = new MongoArchivoRepository();

// Usuarios
const usuarioService = new UsuarioService(usuarioRepository);
const usuarioController = new UsuarioController(usuarioService);

// Auth
const authService = new AuthService(usuarioRepository);
const authController = new AuthController(authService);

// Carpetas
const carpetaService = new CarpetaService(carpetaRepository);
const carpetaController = new CarpetaController(carpetaService);

// Archivos
const archivoService = new ArchivoService(archivoRepository, carpetaRepository);
const archivoController = new ArchivoController(archivoService);

// Exportacion
export const container = {
    usuarioRepository,
    usuarioService,
    usuarioController,
    authService,
    authController,
    carpetaRepository,
    carpetaService,
    carpetaController,
    archivoRepository,
    archivoService,
    archivoController,
};

export type Container = typeof container;
