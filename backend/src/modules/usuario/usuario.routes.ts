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

const router = Router();
const { usuarioController } = container;

router.post('/', validateBody(CrearUsuarioSchema), usuarioController.crear);

router.get(
    '/',
    validateQuery(ListarUsuarioQuerySchema),
    usuarioController.listar,
);

router.get(
    '/:id',
    validateParams(UsuarioIdParamSchema),
    usuarioController.buscarPorId,
);

router.put(
    '/:id',
    validateParams(UsuarioIdParamSchema),
    validateBody(ActualizarUsuarioSchema),
    usuarioController.actualizar,
);

router.patch(
    '/:id/desactivar',
    validateParams(UsuarioIdParamSchema),
    usuarioController.desactivar,
);

router.patch(
    '/:id/reactivar',
    validateParams(UsuarioIdParamSchema),
    usuarioController.reactivar,
);

export default router;
