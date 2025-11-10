import express from 'express';
import swaggerUi from 'swagger-ui-express';
const swaggerDocument = require('./swagger.json');
import healthRouter from './routes/health.route';
import { initializeDatabase } from './config/db';
import { env } from './config/env';

const app = express();

// MONTAR SWAGGER E HEALTH ANTES DE AUTH (se existir)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

// rota pública de health
app.use('/', healthRouter);

async function bootstrap() {
  try {
    await initializeDatabase();
    const port = Number(process.env.PORT) || 3000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

bootstrap();

export default app;
