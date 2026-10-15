import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';
import {
    validateQuery,
    validateParams,
} from '../../shared/middlewares/validate.middleware';
import { FiltrosActividadSchema, RecursoParamSchema } from './actividad.dto';
import { container } from '../../shared/container/container';
import { Rol } from '../../shared/types/enums';

const router = Router();
const { actividadController } = container;

router.use(authenticate);

// Historial del usuario autenticado
router.get(
    '/mi-historial',
    validateQuery(FiltrosActividadSchema),
    actividadController.miHistorial,
);

// Historial global (solo admin)
router.get(
    '/',
    authorize(Rol.Administrador),
    validateQuery(FiltrosActividadSchema),
    actividadController.listar,
);

// Historial de un recurso específico
router.get(
    '/recurso/:tipo/:id',
    validateParams(RecursoParamSchema),
    actividadController.listarPorRecurso,
);

export default router;
