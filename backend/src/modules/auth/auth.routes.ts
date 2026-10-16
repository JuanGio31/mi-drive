import { Router } from 'express';
import { container } from '../../shared/container/container';
import { validateBody } from '../../shared/middlewares/validate.middleware';
import { LoginSchema, RegistroSchema } from './auth.dto';
import { authenticate } from '../../shared/middlewares/auth.middleware';

const router = Router();
const { authController } = container;

router.post('/sign-in', validateBody(LoginSchema), authController.signIn);
router.post('/sign-up', validateBody(RegistroSchema), authController.signUp);
router.get('/me', authenticate, authController.me);

export default router;
