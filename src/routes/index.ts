import { Router } from 'express';
import authRouter from './auth.routes';
import protectedRouter from './protected.routes';
import health from './health.routes';
import taskRouter from './task.routes';

const router = Router();

// GET /health -> {"status":"ok",...}
router.use('/health', health);

// /register, /login
router.use(authRouter);

// /protected
router.use(protectedRouter);

// /tasks
router.use(taskRouter);

export default router;
