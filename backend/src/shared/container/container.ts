import { UsuarioController } from '../../modules/usuario/usuario.controller';
import { MongoUsuarioRepository } from '../../modules/usuario/usuario.repository';
import { UsuarioService } from '../../modules/usuario/usuario.service';

// Usuarios
const usuarioRepository = new MongoUsuarioRepository();
const usuarioService = new UsuarioService(usuarioRepository);
const usuarioController = new UsuarioController(usuarioService);

// Exportacion
export const container = {
    usuarioController,
    usuarioService,
    usuarioRepository,
};

export type Container = typeof container;
