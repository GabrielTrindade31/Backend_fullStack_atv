import app from './app';
import { initializeDatabase } from './config/db';
import { env } from './config/env';

async function bootstrap() {
  try {
    await initializeDatabase();
    app.listen(env.port, () => {
      console.log(`Servidor de autenticação rodando na porta ${env.port}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

bootstrap();
