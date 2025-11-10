import 'dotenv/config';
import { pool, initializeDatabase } from '../config/db';

async function main(): Promise<void> {
  try {
    await initializeDatabase();
    console.log('Banco de dados inicializado com sucesso.');
  } catch (error) {
    console.error('Falha ao inicializar o banco de dados:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
