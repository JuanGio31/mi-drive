import { AuthController } from "../../modules/auth/auth.controller";
import { AuthService } from "../../modules/auth/auth.service";
import { UsuarioController } from "../../modules/usuario/usuario.controller";
import { MongoUsuarioRepository } from "../../modules/usuario/usuario.repository";
import { UsuarioService } from "../../modules/usuario/usuario.service";



// Repositorios
const usuarioRepository = new MongoUsuarioRepository();

// Usuarios
const usuarioService = new UsuarioService(usuarioRepository);
const usuarioController = new UsuarioController(usuarioService);

// Auth
const authService = new AuthService(usuarioRepository);
const authController = new AuthController(authService);

// Exportacion
export const container = {
    usuarioRepository,
    usuarioService,
    usuarioController,
    authService,
    authController,
};

export type Container = typeof container;
