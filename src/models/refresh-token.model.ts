import { pool } from '../database';

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}

const mapRefreshToken = (row: Record<string, unknown>): RefreshTokenRecord => ({
  id: String(row.id),
  userId: String(row.user_id),
  tokenHash: String(row.token_hash),
  userAgent: row.user_agent ? String(row.user_agent) : null,
  ipAddress: row.ip_address ? String(row.ip_address) : null,
  expiresAt: new Date(String(row.expires_at)),
  createdAt: new Date(String(row.created_at)),
  revokedAt: row.revoked_at ? new Date(String(row.revoked_at)) : null,
});

export const refreshTokenRepository = {
  async create(options: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Promise<RefreshTokenRecord> {
    const { userId, tokenHash, expiresAt, userAgent = null, ipAddress = null } = options;

    const result = await pool.query(
      `
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, token_hash, user_agent, ip_address, expires_at, created_at, revoked_at
      `,
      [userId, tokenHash, expiresAt, userAgent, ipAddress]
    );

    return mapRefreshToken(result.rows[0]);
  },

  async revokeByHash(tokenHash: string): Promise<void> {
    await pool.query(
      `
        UPDATE refresh_tokens
        SET revoked_at = NOW()
        WHERE token_hash = $1 AND revoked_at IS NULL
      `,
      [tokenHash]
    );
  },

  async revokeAllForUser(userId: string): Promise<void> {
    await pool.query(
      `
        UPDATE refresh_tokens
        SET revoked_at = NOW()
        WHERE user_id = $1 AND revoked_at IS NULL
      `,
      [userId]
    );
  },

  async findActiveByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const result = await pool.query(
      `
        SELECT id, user_id, token_hash, user_agent, ip_address, expires_at, created_at, revoked_at
        FROM refresh_tokens
        WHERE token_hash = $1
          AND revoked_at IS NULL
        LIMIT 1
      `,
      [tokenHash]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return mapRefreshToken(result.rows[0]);
  },
};
