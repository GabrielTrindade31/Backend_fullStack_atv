import { app } from './app';
import { env } from './config/env';
import { initializeDatabase } from './config/database';

async function bootstrap(): Promise<void> {
  try {
    await initializeDatabase();
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

void bootstrap();
