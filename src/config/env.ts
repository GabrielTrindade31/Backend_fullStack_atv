import { config } from 'dotenv';

config();

export interface EnvConfig {
  nodeEnv: string;
  port: number;
  jwtSecret: string;
  databaseUrl: string;
  databaseSsl: boolean;
}

const resolveDatabaseUrl = (): string => {
  const env = process.env.NODE_ENV ?? 'development';
  if (env === 'production') {
    return process.env.DATABASE_URL_PROD ?? process.env.DATABASE_URL ?? '';
  }
  return process.env.DATABASE_URL ?? '';
};

const resolveDatabaseSsl = (): boolean => {
  const sslValue = process.env.POSTGRES_SSL ?? process.env.DATABASE_SSL ?? '';
  return ['1', 'true', 'enabled', 'require'].includes(sslValue.toLowerCase());
};

export const env: EnvConfig = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3333),
  jwtSecret: process.env.JWT_SECRET ?? '',
  databaseUrl: resolveDatabaseUrl(),
  databaseSsl: resolveDatabaseSsl(),
};

export const validateEnv = (): void => {
  const missing: string[] = [];

  if (!env.databaseUrl) {
    missing.push(env.nodeEnv === 'production' ? 'DATABASE_URL_PROD' : 'DATABASE_URL');
  }

  if (!env.jwtSecret) {
    missing.push('JWT_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente ausentes: ${missing.join(', ')}`);
  }
};
