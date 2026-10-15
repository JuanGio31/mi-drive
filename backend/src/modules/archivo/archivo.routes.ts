import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import {
    validateBody,
    validateParams,
    validateQuery,
} from '../../shared/middlewares/validate.middleware';
import {
    CrearArchivoSchema,
    ActualizarContenidoSchema,
    RenombrarArchivoSchema,
    MoverArchivoSchema,
    CompartirArchivoSchema,
    ArchivoIdParamSchema,
    ArchivoUsuarioParamSchema,
    ListarArchivosQuerySchema,
} from './archivo.dto';
import { container } from '../../shared/container/container';

const router = Router();
const { archivoController } = container;

// Todas las rutas requieren autenticación
router.use(authenticate);

router.post('/', validateBody(CrearArchivoSchema), archivoController.crear);

router.get(
    '/',
    validateQuery(ListarArchivosQuerySchema),
    archivoController.listar,
);

router.get('/compartidos', archivoController.listarCompartidos);

router.get(
    '/:id',
    validateParams(ArchivoIdParamSchema),
    archivoController.buscarPorId,
);

router.get(
    '/:id/descargar',
    validateParams(ArchivoIdParamSchema),
    archivoController.descargar,
);

router.put(
    '/:id/contenido',
    validateParams(ArchivoIdParamSchema),
    validateBody(ActualizarContenidoSchema),
    archivoController.actualizarContenido,
);

router.patch(
    '/:id/renombrar',
    validateParams(ArchivoIdParamSchema),
    validateBody(RenombrarArchivoSchema),
    archivoController.renombrar,
);

router.patch(
    '/:id/mover',
    validateParams(ArchivoIdParamSchema),
    validateBody(MoverArchivoSchema),
    archivoController.mover,
);

router.delete(
    '/:id',
    validateParams(ArchivoIdParamSchema),
    archivoController.enviarAPapelera,
);

router.post(
    '/:id/restaurar',
    validateParams(ArchivoIdParamSchema),
    archivoController.restaurar,
);

router.post(
    '/:id/compartir',
    validateParams(ArchivoIdParamSchema),
    validateBody(CompartirArchivoSchema),
    archivoController.compartir,
);

router.delete(
    '/:id/compartir/:usuarioId',
    validateParams(ArchivoUsuarioParamSchema),
    archivoController.quitarCompartido,
);

router.delete(
    '/:id/permanente',
    validateParams(ArchivoIdParamSchema),
    archivoController.eliminarPermanente,
);

export default router;
