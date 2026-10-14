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

// Usuarios
const usuarioService = new UsuarioService(usuarioRepository);
const usuarioController = new UsuarioController(usuarioService);

// Auth
const authService = new AuthService(usuarioRepository);
const authController = new AuthController(authService);

// Carpetas
const carpetaService = new CarpetaService(carpetaRepository);
const carpetaController = new CarpetaController(carpetaService);

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
};

export type Container = typeof container;
