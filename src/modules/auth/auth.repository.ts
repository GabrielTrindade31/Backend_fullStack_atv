import { query } from '../../config/database';
import { PublicUser, UserRecord, UserRole } from '../users/users.types';

type RefreshTokenRecord = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  revoked_at: string | null;
};

export async function createUser(params: {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  dateOfBirth?: string | null;
  role?: UserRole;
}): Promise<UserRecord> {
  const { rows } = await query<UserRecord>({
    text: `
      INSERT INTO users (name, email, password_hash, google_id, date_of_birth, role)
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'client'))
      RETURNING *;
    `,
    values: [params.name, params.email, params.passwordHash ?? null, params.googleId ?? null, params.dateOfBirth ?? null, params.role ?? null],
  });

  return rows[0];
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const { rows } = await query<UserRecord>({
    text: 'SELECT * FROM users WHERE email = $1 LIMIT 1;',
    values: [email],
  });

  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const { rows } = await query<UserRecord>({
    text: 'SELECT * FROM users WHERE id = $1 LIMIT 1;',
    values: [id],
  });

  return rows[0] ?? null;
}

export async function findUserByGoogleId(googleId: string): Promise<UserRecord | null> {
  const { rows } = await query<UserRecord>({
    text: 'SELECT * FROM users WHERE google_id = $1 LIMIT 1;',
    values: [googleId],
  });

  return rows[0] ?? null;
}

export async function listUsers(): Promise<PublicUser[]> {
  const { rows } = await query<UserRecord>({
    text: 'SELECT * FROM users ORDER BY created_at DESC;',
  });

  return rows.map(mapUserToPublic);
}

export async function linkGoogleAccount(userId: string, googleId: string): Promise<UserRecord> {
  const { rows } = await query<UserRecord>({
    text: `
      UPDATE users
      SET google_id = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `,
    values: [googleId, userId],
  });

  return rows[0];
}

export async function createRefreshToken(params: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<RefreshTokenRecord> {
  const { rows } = await query<RefreshTokenRecord>({
    text: `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *;
    `,
    values: [params.userId, params.tokenHash, params.expiresAt.toISOString()],
  });

  return rows[0];
}

export async function findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null> {
  const { rows } = await query<RefreshTokenRecord>({
    text: `
      SELECT * FROM refresh_tokens
      WHERE token_hash = $1 AND revoked_at IS NULL
      LIMIT 1;
    `,
    values: [tokenHash],
  });

  return rows[0] ?? null;
}

export async function revokeRefreshToken(id: string): Promise<void> {
  await query({
    text: 'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1;',
    values: [id],
  });
}

export async function revokeRefreshTokensByUserId(userId: string): Promise<void> {
  await query({
    text: 'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1;',
    values: [userId],
  });
}

export function mapUserToPublic(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    dateOfBirth: user.date_of_birth,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}
