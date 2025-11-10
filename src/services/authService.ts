import { randomUUID } from 'crypto';
import { pool } from '../config/db';
import { mapToPublicUser, PublicUser, User } from '../types/user';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import { verifyGoogleToken } from './googleAuthService';
import { getUserPermissions } from './permissionService';

type NullableDate = string | null;

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  dateOfBirth: NullableDate;
  role: 'user' | 'backlog';
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: PublicUser;
  permissions: string[];
}

async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query<User>('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] ?? null;
}

async function findUserById(id: string): Promise<User | null> {
  const result = await pool.query<User>('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function registerLocalUser(input: RegisterInput): Promise<AuthResponse> {
  const existingUser = await findUserByEmail(input.email);
  if (existingUser) {
    throw new Error('E-mail já cadastrado.');
  }

  const passwordHash = await hashPassword(input.password);
  const userId = randomUUID();

  try {
    const result = await pool.query<User>(
      `INSERT INTO users (id, email, password_hash, name, date_of_birth, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, input.email, passwordHash, input.name, input.dateOfBirth, input.role]
    );

    const user = result.rows[0];
    const token = signAccessToken(user.id, user.email);
    const permissions = await getUserPermissions(user.id);
    return { token, user: mapToPublicUser(user), permissions };
  } catch (error: any) {
    if (error?.code === '23505') {
      throw new Error('E-mail já cadastrado.');
    }
    throw error;
  }
}

export async function loginLocalUser(input: LoginInput): Promise<AuthResponse> {
  const user = await findUserByEmail(input.email);
  if (!user || !user.password_hash) {
    throw new Error('Credenciais inválidas.');
  }

  const isValidPassword = await verifyPassword(input.password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Credenciais inválidas.');
  }

  const token = signAccessToken(user.id, user.email);
  const permissions = await getUserPermissions(user.id);
  return { token, user: mapToPublicUser(user), permissions };
}

export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const payload = await verifyGoogleToken(idToken);
  const googleId = payload.sub;
  const email = payload.email ?? null;
  const name = payload.name ?? payload.given_name ?? 'Usuário Google';

  if (!googleId) {
    throw new Error('Token do Google sem identificador de usuário.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let user: User | null = null;

    const userByGoogle = await client.query<User>('SELECT * FROM users WHERE google_id = $1', [googleId]);
    user = userByGoogle.rows[0] ?? null;

    if (!user && email) {
      const userByEmail = await client.query<User>('SELECT * FROM users WHERE email = $1', [email]);
      user = userByEmail.rows[0] ?? null;
    }

    if (user) {
      const updated = await client.query<User>(
        `UPDATE users
         SET email = COALESCE($1, email),
             name = $2,
             google_id = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [email, name, googleId, user.id]
      );
      user = updated.rows[0];
    } else {
      const newUserId = randomUUID();
      const inserted = await client.query<User>(
        `INSERT INTO users (id, email, name, google_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [newUserId, email, name, googleId]
      );
      user = inserted.rows[0];
    }

    await client.query('COMMIT');

    if (!user) {
      throw new Error('Não foi possível determinar o usuário autenticado pelo Google.');
    }

    const token = signAccessToken(user.id, user.email);
    const permissions = await getUserPermissions(user.id);
    return { token, user: mapToPublicUser(user), permissions };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getUserProfile(userId: string): Promise<PublicUser> {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }
  return mapToPublicUser(user);
}
