import { Router } from 'express';
import { container } from '../../shared/container/container';
import {
    validateBody,
    validateParams,
    validateQuery,
} from '../../shared/middlewares/validate.middleware';
import {
    ActualizarUsuarioSchema,
    CambiarPasswordSchema,
    CrearUsuarioSchema,
    ListarUsuarioQuerySchema,
    UsuarioIdParamSchema,
} from './usuario.dto';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';
import { Rol } from '../../shared/types/enums';

const router = Router();
const { usuarioController } = container;

router.use(authenticate);

router.post(
    '/',
    authorize(Rol.Administrador),
    validateBody(CrearUsuarioSchema),
    usuarioController.crear,
);

router.get(
    '/',
    authorize(Rol.Administrador),
    validateQuery(ListarUsuarioQuerySchema),
    usuarioController.listar,
);

// GET /directorio → usuarios activos (id, nombre, correo). Cualquier autenticado.
// Debe ir antes de /:id para que "directorio" no se interprete como un id.
router.get('/directorio', usuarioController.listarDirectorio);

router.get(
    '/:id',
    validateParams(UsuarioIdParamSchema),
    usuarioController.buscarPorId,
);

// PATCH /:id → actualización parcial (el schema es parcial: todos los campos opcionales).
router.patch(
    '/:id',
    validateParams(UsuarioIdParamSchema),
    validateBody(ActualizarUsuarioSchema),
    usuarioController.actualizar,
);

// PATCH /:id/password → cambio de contraseña del propio usuario (autoservicio).
router.patch(
    '/:id/password',
    validateParams(UsuarioIdParamSchema),
    validateBody(CambiarPasswordSchema),
    usuarioController.cambiarPassword,
);

// DELETE /:id → soft delete: desactiva el usuario (no lo borra físicamente).
router.delete(
    '/:id',
    authorize(Rol.Administrador),
    validateParams(UsuarioIdParamSchema),
    usuarioController.desactivar,
);

// POST /:id/reactivar → restaura un usuario desactivado (acción, como en carpeta POST /:id/restaurar).
router.post(
    '/:id/reactivar',
    authorize(Rol.Administrador),
    validateParams(UsuarioIdParamSchema),
    usuarioController.reactivar,
);

export default router;
