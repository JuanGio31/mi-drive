import { Router } from 'express';
import { container } from '../../shared/container/container';
import {
    validateBody,
    validateParams,
    validateQuery,
} from '../../shared/middlewares/validate.middleware';
import {
    ActualizarUsuarioSchema,
    CrearUsuarioSchema,
    ListarUsuarioQuerySchema,
    UsuarioIdParamSchema,
} from './usuario.dto';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';
import { Rol } from '../../shared/types/enums';

const router = Router();
const { usuarioController } = container;

router.post(
    '/',
    authenticate,
    authorize(Rol.Administrador),
    validateBody(CrearUsuarioSchema),
    usuarioController.crear,
);

router.get(
    '/',
    authenticate,
    authorize(Rol.Administrador),
    validateQuery(ListarUsuarioQuerySchema),
    usuarioController.listar,
);

router.get(
    '/:id',
    authenticate,
    validateParams(UsuarioIdParamSchema),
    usuarioController.buscarPorId,
);

router.put(
    '/:id',
    authenticate,
    validateParams(UsuarioIdParamSchema),
    validateBody(ActualizarUsuarioSchema),
    usuarioController.actualizar,
);

router.patch(
    '/:id/desactivar',
    authenticate,
    validateParams(UsuarioIdParamSchema),
    usuarioController.desactivar,
);

router.patch(
    '/:id/reactivar',
    authenticate,
    validateParams(UsuarioIdParamSchema),
    usuarioController.reactivar,
);

export default router;
