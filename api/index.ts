import type { IncomingMessage, ServerResponse } from 'http';
import createApp from '../src/app';
import { connectDatabase } from '../src/database';
import logger from '../src/utils/logger';

let appPromise: Promise<ReturnType<typeof createApp>> | null = null;

import health from '../src/routes/health.routes';
import { Router } from 'express';
import authRouter from '../src/routes/auth.routes';
import protectedRouter from '../src/routes/protected.routes';
const router = Router();
router.use(health);
router.use(authRouter);
router.use(protectedRouter);

const getApp = async () => {
  if (!appPromise) {
    appPromise = (async () => {
      await connectDatabase();
      logger.info('Aplicação inicializada no ambiente serverless.');
      return createApp();
    })();
  }
  return appPromise;
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  return (app as any)(req, res);
}

export const config = { api: { bodyParser: false, externalResolver: true } };
