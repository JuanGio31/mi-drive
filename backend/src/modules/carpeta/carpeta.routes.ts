import { Router } from 'express';
import { container } from '../../shared/container/container';
import z from 'zod/v3';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import {
    validateBody,
    validateParams,
    validateQuery,
} from '../../shared/middlewares/validate.middleware';
import {
    CarpetaIdParamSchema,
    CompartirCarpetaSchema,
    CrearCarpetaSchema,
    DestacarCarpetaSchema,
    ListarCarpetasQuerySchema,
    MoverCarpetaSchema,
    RenombrarCarpetaSchema,
} from './carpeta.dto';

/** Rutas HTTP de carpetas. Todas requieren autenticación. */
const router = Router();
const { carpetaController } = container;

// Valida los params :id y :usuarioId de las rutas de compartidos.
const UsuarioIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID no válido'),
    usuarioId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID no válido'),
});

// todas las rutas requieren autenticación
router.use(authenticate);

// POST / → crea una carpeta.
router.post('/', validateBody(CrearCarpetaSchema), carpetaController.crear);

// GET / → lista carpetas propias y compartidas.
router.get(
    '/',
    validateQuery(ListarCarpetasQuerySchema),
    carpetaController.listar,
);

// GET /papelera → carpetas propias que están en la papelera.
router.get('/papelera', carpetaController.listarPapelera);

// GET /destacadas → carpetas marcadas por el usuario actual.
router.get('/destacadas', carpetaController.listarDestacadas);

// GET /:id → detalle de una carpeta.
router.get(
    '/:id',
    validateParams(CarpetaIdParamSchema),
    carpetaController.buscarPorId,
);

// PATCH /:id/renombrar → cambia el nombre.
router.patch(
    '/:id/renombrar',
    validateParams(CarpetaIdParamSchema),
    validateBody(RenombrarCarpetaSchema),
    carpetaController.renombrar,
);

// PATCH /:id/mover → mueve la carpeta a otro padre o a la raíz.
router.patch(
    '/:id/mover',
    validateParams(CarpetaIdParamSchema),
    validateBody(MoverCarpetaSchema),
    carpetaController.mover,
);

// PATCH /:id/destacar → marca o desmarca la carpeta para el usuario actual.
router.patch(
    '/:id/destacar',
    validateParams(CarpetaIdParamSchema),
    validateBody(DestacarCarpetaSchema),
    carpetaController.destacar,
);

// DELETE /:id/permanente → elimina la carpeta y su subárbol definitivamente.
router.delete(
    '/:id/permanente',
    validateParams(CarpetaIdParamSchema),
    carpetaController.eliminarPermanente,
);

// DELETE /:id → envía la carpeta a la papelera.
router.delete(
    '/:id',
    validateParams(CarpetaIdParamSchema),
    carpetaController.enviarAPapelera,
);

// POST /:id/restaurar → saca la carpeta de la papelera.
router.post(
    '/:id/restaurar',
    validateParams(CarpetaIdParamSchema),
    carpetaController.restaurar,
);

// POST /:id/compartir → comparte con un usuario.
router.post(
    '/:id/compartir',
    validateParams(CarpetaIdParamSchema),
    validateBody(CompartirCarpetaSchema),
    carpetaController.compartir,
);

// DELETE /:id/compartir/:usuarioId → quita a un usuario de compartidos.
router.delete(
    '/:id/compartir/:usuarioId',
    validateParams(UsuarioIdParamSchema),
    carpetaController.quitarCompartido,
);

export default router;
