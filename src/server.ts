import createApp from './app';
import { env } from './config/env';
import { connectDatabase } from './database';
import logger from './utils/logger';

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    const app = createApp();

    app.listen(env.port, () => {
      logger.info(`Servidor rodando na porta ${env.port}`);
    });
  } catch (error) {
    logger.error('Falha ao iniciar o servidor', { error });
    process.exit(1);
  }
};

startServer();
