import { pool } from '../database';

export type UserRole = 'customer' | 'admin';
export type AuthProvider = 'local' | 'google';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  provider: AuthProvider;
  googleId: string | null;
  pictureUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  provider?: AuthProvider;
  googleId?: string | null;
  pictureUrl?: string | null;
}

const mapUser = (row: Record<string, unknown>): UserRecord => ({
  id: String(row.id),
  name: String(row.name),
  email: String(row.email),
  password: String(row.password),
  role: row.role as UserRole,
  provider: row.provider as AuthProvider,
  googleId: row.google_id ? String(row.google_id) : null,
  pictureUrl: row.picture_url ? String(row.picture_url) : null,
  createdAt: new Date(String(row.created_at)),
  updatedAt: new Date(String(row.updated_at)),
});

export const userRepository = {
  async create(input: CreateUserInput): Promise<UserRecord> {
    const { name, email, password, role = 'customer', provider = 'local', googleId = null, pictureUrl = null } = input;

    const result = await pool.query(
      `
        INSERT INTO users (name, email, password, role, provider, google_id, picture_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, email, password, role, provider, google_id, picture_url, created_at, updated_at
      `,
      [name, email, password, role, provider, googleId, pictureUrl]
    );

    return mapUser(result.rows[0]);
  },

  async linkGoogleAccount(
    userId: string,
    googleId: string,
    pictureUrl?: string | null
  ): Promise<UserRecord | null> {
    const result = await pool.query(
      `
        UPDATE users
        SET provider = 'google',
            google_id = $2,
            picture_url = COALESCE($3, picture_url),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, email, password, role, provider, google_id, picture_url, created_at, updated_at
      `,
      [userId, googleId, pictureUrl ?? null]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return mapUser(result.rows[0]);
  },

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await pool.query(
      `
        SELECT id, name, email, password, role, provider, google_id, picture_url, created_at, updated_at
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [email]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return mapUser(result.rows[0]);
  },

  async findByGoogleId(googleId: string): Promise<UserRecord | null> {
    const result = await pool.query(
      `
        SELECT id, name, email, password, role, provider, google_id, picture_url, created_at, updated_at
        FROM users
        WHERE google_id = $1
        LIMIT 1
      `,
      [googleId]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return mapUser(result.rows[0]);
  },

  async findById(id: string): Promise<UserRecord | null> {
    const result = await pool.query(
      `
        SELECT id, name, email, password, role, provider, google_id, picture_url, created_at, updated_at
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return mapUser(result.rows[0]);
  },
};
