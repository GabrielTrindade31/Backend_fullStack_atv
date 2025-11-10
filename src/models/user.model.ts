import { pool } from '../database';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const mapUser = (row: Record<string, unknown>): UserRecord => ({
  id: String(row.id),
  name: String(row.name),
  email: String(row.email),
  password: String(row.password),
  createdAt: new Date(String(row.created_at)),
  updatedAt: new Date(String(row.updated_at)),
});

export const userRepository = {
  async create(name: string, email: string, password: string): Promise<UserRecord> {
    const result = await pool.query(
      `
        INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, password, created_at, updated_at
      `,
      [name, email, password]
    );

    return mapUser(result.rows[0]);
  },

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await pool.query(
      `
        SELECT id, name, email, password, created_at, updated_at
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

  async findById(id: string): Promise<UserRecord | null> {
    const result = await pool.query(
      `
        SELECT id, name, email, password, created_at, updated_at
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
