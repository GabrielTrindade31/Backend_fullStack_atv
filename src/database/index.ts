import { Pool } from 'pg';
import { env } from '../config/env';
import logger from '../utils/logger';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : false,
});

let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  if (isConnected) {
    logger.debug('Conexão com PostgreSQL já estabelecida.');
    return;
  }

  try {
    await pool.query('SELECT 1');
    isConnected = true;
    logger.info('Conectado ao PostgreSQL com sucesso.');
  } catch (error) {
    logger.error('Erro ao conectar ao PostgreSQL', { error });
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  await pool.end();
  isConnected = false;
  logger.info('Conexão com PostgreSQL encerrada.');
};
