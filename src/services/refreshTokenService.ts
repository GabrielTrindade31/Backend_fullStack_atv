import { randomBytes, randomUUID } from 'crypto';
import { PoolClient } from 'pg';
import { pool } from '../config/db';
import { User } from '../types/user';
import { hashOpaqueToken, verifyOpaqueToken } from '../utils/opaqueToken';

const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
}

function buildRefreshToken(id: string, token: string): string {
  return `${id}.${token}`;
}

function parseRefreshToken(refreshToken: string): { id: string; token: string } {
  const [id, token] = refreshToken.split('.');
  if (!id || !token) {
    throw new Error('Token de atualização inválido.');
  }
  return { id, token };
}

async function insertRefreshToken(client: PoolClient, userId: string): Promise<string> {
  const tokenId = randomUUID();
  const token = randomBytes(48).toString('hex');
  const tokenHash = await hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();

  await client.query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [tokenId, userId, tokenHash, expiresAt]
  );

  return buildRefreshToken(tokenId, token);
}

export async function createRefreshToken(userId: string): Promise<string> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const token = await insertRefreshToken(client, userId);
    await client.query('COMMIT');
    return token;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function rotateRefreshToken(refreshToken: string): Promise<{ user: User; refreshToken: string }> {
  const { id, token } = parseRefreshToken(refreshToken);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const storedTokenResult = await client.query<RefreshTokenRow>(
      `SELECT id, user_id, token_hash, expires_at, revoked_at
       FROM refresh_tokens
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (storedTokenResult.rows.length === 0) {
      throw new Error('Token de atualização inexistente.');
    }

    const storedToken = storedTokenResult.rows[0];

    if (storedToken.revoked_at) {
      throw new Error('Token de atualização revogado.');
    }

    if (new Date(storedToken.expires_at).getTime() <= Date.now()) {
      throw new Error('Token de atualização expirado.');
    }

    const isValid = await verifyOpaqueToken(token, storedToken.token_hash);
    if (!isValid) {
      await client.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [storedToken.id]);
      throw new Error('Token de atualização inválido.');
    }

    const userResult = await client.query<User>('SELECT * FROM users WHERE id = $1', [storedToken.user_id]);
    if (userResult.rows.length === 0) {
      await client.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [storedToken.id]);
      throw new Error('Usuário associado ao token não encontrado.');
    }

    const user = userResult.rows[0];

    await client.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [storedToken.id]);
    const newRefreshToken = await insertRefreshToken(client, storedToken.user_id);

    await client.query('COMMIT');

    return { user, refreshToken: newRefreshToken };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  const { id, token } = parseRefreshToken(refreshToken);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const storedTokenResult = await client.query<RefreshTokenRow>(
      `SELECT id, token_hash, revoked_at
       FROM refresh_tokens
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if (storedTokenResult.rows.length === 0) {
      throw new Error('Token de atualização inexistente.');
    }

    const storedToken = storedTokenResult.rows[0];
    if (storedToken.revoked_at) {
      await client.query('COMMIT');
      return;
    }

    const isValid = await verifyOpaqueToken(token, storedToken.token_hash);
    if (!isValid) {
      await client.query('ROLLBACK');
      throw new Error('Token de atualização inválido.');
    }

    await client.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [storedToken.id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function revokeAllTokensForUser(userId: string): Promise<void> {
  await pool.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [userId]);
}
