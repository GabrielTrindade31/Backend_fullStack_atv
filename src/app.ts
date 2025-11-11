import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import router from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/request-logger.middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

export const createApp = (): express.Application => {
  const app = express();

  app.use(cors());
  // Desabilite CSP para o Swagger UI (evita página em branco)
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json());
  app.use(requestLogger);

  // JSON da spec (útil para debug)
  app.get('/docs.json', (_req, res) => res.json(swaggerSpec));
  // UI
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
    })
  );

  app.use(router);
  app.use(errorMiddleware);
  
  return app;
};

export default createApp; // ok ter default também
