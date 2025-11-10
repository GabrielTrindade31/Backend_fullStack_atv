import { OAuth2Client } from 'google-auth-library';
import { AppError } from '../../core/errors/AppError';
import { env } from '../../config/env';
import { addDays } from '../../lib/date';
import { createAccessToken, verifyAccessToken } from '../../lib/jwt';
import { comparePassword, hashPassword } from '../../lib/password';
import { generateRefreshTokenValue, hashToken } from '../../lib/token';
import {
  createRefreshToken,
  createUser,
  findRefreshToken,
  findUserByEmail,
  findUserByGoogleId,
  findUserById,
  linkGoogleAccount,
  listUsers as listUsersRepository,
  mapUserToPublic,
  revokeRefreshToken,
} from './auth.repository';
import { PublicUser, UserRecord } from '../users/users.types';

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

type AuthSession = {
  user: PublicUser;
  accessToken: string;
  refreshToken: {
    value: string;
    expiresAt: string;
  };
};

async function buildSession(user: UserRecord): Promise<AuthSession> {
  const accessToken = createAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshValue = generateRefreshTokenValue();
  const expiresAt = addDays(new Date(), env.refreshTokenDays);
  const refreshHash = hashToken(refreshValue);

  await createRefreshToken({
    userId: user.id,
    tokenHash: refreshHash,
    expiresAt,
  });

  return {
    user: mapUserToPublic(user),
    accessToken,
    refreshToken: {
      value: refreshValue,
      expiresAt: expiresAt.toISOString(),
    },
  };
}

export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  dateOfBirth?: string;
  role?: 'admin' | 'client';
}): Promise<AuthSession> {
  const existingUser = await findUserByEmail(params.email);

  if (existingUser) {
    throw new AppError('E-mail já cadastrado.', 409);
  }

  const passwordHash = await hashPassword(params.password);

  const user = await createUser({
    name: params.name,
    email: params.email,
    passwordHash,
    dateOfBirth: params.dateOfBirth ?? null,
    role: params.role,
  });

  return buildSession(user);
}

export async function loginWithPassword(params: { email: string; password: string }): Promise<AuthSession> {
  const user = await findUserByEmail(params.email);

  if (!user || !user.password_hash) {
    throw new AppError('Credenciais inválidas.', 401);
  }

  const passwordMatches = await comparePassword(params.password, user.password_hash);

  if (!passwordMatches) {
    throw new AppError('Credenciais inválidas.', 401);
  }

  return buildSession(user);
}

export async function loginWithGoogle(idToken: string): Promise<AuthSession> {
  if (!googleClient) {
    throw new AppError('Login com Google não está configurado.', 500);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.sub || !payload.email) {
    throw new AppError('Token do Google inválido.', 401);
  }

  const googleId = payload.sub;
  let user = await findUserByGoogleId(googleId);

  if (!user) {
    const existingByEmail = await findUserByEmail(payload.email);

    if (existingByEmail) {
      user = await linkGoogleAccount(existingByEmail.id, googleId);
    } else {
      user = await createUser({
        name: payload.name ?? payload.email.split('@')[0],
        email: payload.email,
        googleId,
      });
    }
  }

  return buildSession(user);
}

export async function refreshSession(refreshToken: string): Promise<AuthSession> {
  const tokenHash = hashToken(refreshToken);
  const stored = await findRefreshToken(tokenHash);

  if (!stored) {
    throw new AppError('Token de atualização inválido.', 401);
  }

  if (new Date(stored.expires_at) < new Date()) {
    await revokeRefreshToken(stored.id);
    throw new AppError('Token de atualização expirado.', 401);
  }

  const user = await findUserById(stored.user_id);

  if (!user) {
    await revokeRefreshToken(stored.id);
    throw new AppError('Usuário não encontrado.', 404);
  }

  await revokeRefreshToken(stored.id);
  return buildSession(user);
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  const stored = await findRefreshToken(tokenHash);

  if (stored) {
    await revokeRefreshToken(stored.id);
  }
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  return mapUserToPublic(user);
}

export async function validateAccessToken(token: string): Promise<{
  valid: boolean;
  user?: PublicUser;
  payload?: ReturnType<typeof verifyAccessToken>;
}> {
  const payload = verifyAccessToken(token);
  const user = await findUserById(payload.sub);

  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  return {
    valid: true,
    user: mapUserToPublic(user),
    payload,
  };
}

export async function listUsers(): Promise<PublicUser[]> {
  return listUsersRepository();
}
