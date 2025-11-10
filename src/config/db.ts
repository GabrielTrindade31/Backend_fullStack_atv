import { Pool, PoolClient } from 'pg';
import { env } from './env';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
});

async function runMigrations(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT NOT NULL,
      date_of_birth DATE,
      google_id TEXT UNIQUE,
      role TEXT NOT NULL DEFAULT 'client',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    UPDATE users
    SET role = 'admin'
    WHERE role = 'backlog';
  `);

  await client.query(`
    UPDATE users
    SET role = 'client'
    WHERE role IS NULL OR role = 'user';
  `);

  await client.query(`
    ALTER TABLE users
    ALTER COLUMN role SET DEFAULT 'client';
  `);

  await client.query(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_role_check;
  `);

  await client.query(`
    ALTER TABLE users
    ADD CONSTRAINT users_role_check CHECK (role IN ('client', 'admin'));
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      revoked_at TIMESTAMPTZ,
      CONSTRAINT refresh_tokens_expiration_check CHECK (expires_at > created_at)
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens(user_id);
  `);
}

let initializationPromise: Promise<void> | null = null;

export async function initializeDatabase(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const client = await pool.connect();
      try {
        await runMigrations(client);
      } finally {
        client.release();
      }
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  await initializationPromise;
}

void initializeDatabase().catch((error) => {
  console.error('Falha ao inicializar o banco de dados:', error);
});
