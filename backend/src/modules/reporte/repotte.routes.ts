import { Router } from 'express';
import { z } from 'zod/v3';
import { container } from '../../shared/container/container';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/role.middleware';
import {
    validateQuery,
    validateParams,
} from '../../shared/middlewares/validate.middleware';
import {
    RangoFechasSchema,
    TopLimiteSchema,
    UsuarioReporteSchema,
} from './reporte.dto';
import { Rol } from '../../shared/types/enums';

const router = Router();
const { reporteController } = container;

const PeriodoQuerySchema = z.object({
    unidad: z.enum(['dia', 'mes', 'año']).optional().default('dia'),
    desde: z.string().datetime().optional(),
    hasta: z.string().datetime().optional(),
});

router.use(authenticate);

// ============ Archivos y almacenamiento ============
router.get('/archivos/por-tipo', reporteController.archivosPorTipo);
router.get(
    '/archivos/por-rango',
    validateQuery(RangoFechasSchema),
    reporteController.archivosPorRango,
);
router.get(
    '/archivos/mas-operaciones',
    validateQuery(TopLimiteSchema),
    reporteController.archivosConMasOperaciones,
);

// ============ Usuarios ============
router.get(
    '/usuarios/top-archivos',
    validateQuery(TopLimiteSchema),
    reporteController.topUsuarios,
);
router.get(
    '/usuarios/mas-compartidos',
    validateQuery(TopLimiteSchema),
    reporteController.usuariosMasCompartidos,
);

// ============ Compartición ============
router.get(
    '/compartidos/mas-compartidos',
    validateQuery(TopLimiteSchema),
    reporteController.archivosMasCompartidos,
);
router.get(
    '/compartidos/por-usuario/:usuarioId',
    validateParams(UsuarioReporteSchema),
    reporteController.recursosCompartidosPorUsuario,
);
router.get(
    '/compartidos/recibidos/:usuarioId',
    validateParams(UsuarioReporteSchema),
    reporteController.recursosRecibidosPorUsuario,
);

// ============ Actividad (del usuario autenticado) ============
router.get(
    '/actividad/mi-rango',
    validateQuery(PeriodoQuerySchema),
    reporteController.miActividadPorRango,
);
router.get(
    '/actividad/por-tipo',
    validateQuery(PeriodoQuerySchema),
    reporteController.operacionesPorTipo,
);
router.get(
    '/actividad/por-periodo',
    validateQuery(PeriodoQuerySchema),
    reporteController.operacionesPorPeriodo,
);

// ============ Endpoints globales (solo admin) ============
router.get(
    '/admin/archivos/por-tipo',
    authorize(Rol.Administrador),
    reporteController.archivosPorTipo,
);

export default router;
