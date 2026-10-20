import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { validateQuery } from '../../shared/middlewares/validate.middleware';
import { BuscarQuerySchema } from './busqueda.dto';
import { container } from '../../shared/container/container';

const router = Router();
const { busquedaController } = container;

router.use(authenticate);

// GET /api/buscar?q=texto → búsqueda global (archivos + carpetas).
router.get(
    '/',
    validateQuery(BuscarQuerySchema),
    busquedaController.buscar,
);

export default router;
