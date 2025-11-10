import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { AppError } from '../errors/AppError';
import { userRepository, UserRecord } from '../models/user.model';
import { refreshTokenRepository } from '../models/refresh-token.model';
import { env, validateEnv } from '../config/env';
import logger from '../utils/logger';

const passwordSchema = z
  .string()
  .min(8, 'A senha deve possuir pelo menos 8 caracteres.')
  .regex(/[A-Z]/, 'A senha deve possuir ao menos uma letra maiúscula.')
  .regex(/[a-z]/, 'A senha deve possuir ao menos uma letra minúscula.')
  .regex(/\d/, 'A senha deve possuir ao menos um número.')
  .regex(/[^A-Za-z0-9]/, 'A senha deve possuir ao menos um caractere especial.');

const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve possuir ao menos 3 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(8, 'Senha inválida.'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token inválido.'),
});

const googleLoginSchema = z.object({
  idToken: z.string().min(10, 'ID token inválido.'),
});

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface GoogleLoginInput {
  idToken: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRecord['role'];
  provider: UserRecord['provider'];
  pictureUrl?: string | null;
  createdAt: Date;
}

export interface AuthTokenPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: AuthenticatedUser;
}

const ACCESS_TOKEN_TYPE: AuthTokenPayload['tokenType'] = 'Bearer';

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const randomToken = (): string => crypto.randomBytes(64).toString('hex');

const sanitizeUser = (user: UserRecord): AuthenticatedUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  provider: user.provider,
  pictureUrl: user.pictureUrl,
  createdAt: user.createdAt,
});

export class AuthService {
  constructor() {
    validateEnv();
  }

  private async verifyGoogleIdToken(idToken: string): Promise<{
    sub: string;
    aud: string;
    email?: string;
    name?: string;
    picture?: string;
    email_verified?: string;
  }> {
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
      );

      if (!response.ok) {
        const errorBody = await response.text();
        logger.warn('Falha ao validar token do Google', { status: response.status, errorBody });
        throw new AppError('Token do Google inválido.', 401);
      }

      const payload = (await response.json()) as {
        sub?: string;
        aud?: string;
        email?: string;
        name?: string;
        picture?: string;
        email_verified?: string;
      };

      if (!payload.sub || payload.aud !== env.googleClientId) {
        logger.warn('Token do Google com audience inesperada ou sem sub.', { aud: payload.aud });
        throw new AppError('Token do Google inválido.', 401);
      }

      return {
        sub: payload.sub,
        aud: payload.aud!,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Erro inesperado ao verificar token do Google', { error });
      throw new AppError('Não foi possível validar o token do Google.', 500);
    }
  }

  private async generateTokens(user: UserRecord, context?: { userAgent?: string; ip?: string }): Promise<AuthTokenPayload> {
    const expiresInMinutes = env.jwtAccessExpiresInMinutes;
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        provider: user.provider,
      },
      env.jwtSecret,
      {
        expiresIn: `${expiresInMinutes}m`,
      }
    );

    const refreshToken = randomToken();
    const expiresAt = new Date(Date.now() + env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000);

    await refreshTokenRepository.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      userAgent: context?.userAgent ?? null,
      ipAddress: context?.ip ?? null,
    });

    logger.debug('Tokens gerados para usuário.', { userId: user.id });

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInMinutes * 60,
      tokenType: ACCESS_TOKEN_TYPE,
      user: sanitizeUser(user),
    };
  }

  async register(input: RegisterInput, context?: { userAgent?: string; ip?: string }): Promise<AuthTokenPayload> {
    const payload = registerSchema.parse(input);

    logger.info('Iniciando registro de usuário', { email: payload.email });

    const existingUser = await userRepository.findByEmail(payload.email);

    if (existingUser) {
      logger.warn('Tentativa de registro com e-mail existente', { email: payload.email });
      throw new AppError('E-mail já cadastrado.', 422);
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const user = await userRepository.create({
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: 'customer',
      provider: 'local',
    });

    logger.info('Usuário registrado com sucesso', { userId: user.id });

    await refreshTokenRepository.revokeAllForUser(user.id);

    return this.generateTokens(user, context);
  }

  async login(input: LoginInput, context?: { userAgent?: string; ip?: string }): Promise<AuthTokenPayload> {
    const payload = loginSchema.parse(input);

    logger.info('Tentativa de login recebida', { email: payload.email });

    const user = await userRepository.findByEmail(payload.email);

    if (!user) {
      logger.warn('Usuário não encontrado durante login', { email: payload.email });
      throw new AppError('Usuário não encontrado.', 404);
    }

    if (user.provider !== 'local') {
      logger.warn('Tentativa de login local para usuário com autenticação externa', {
        email: payload.email,
        provider: user.provider,
      });
      throw new AppError('Use o login social configurado para esta conta.', 400);
    }

    const passwordMatch = await bcrypt.compare(payload.password, user.password);

    if (!passwordMatch) {
      logger.warn('Senha inválida durante login', { email: payload.email });
      throw new AppError('Credenciais inválidas.', 401);
    }

    await refreshTokenRepository.revokeAllForUser(user.id);

    logger.info('Usuário autenticado com sucesso', { userId: user.id });

    return this.generateTokens(user, context);
  }

  async loginWithGoogle(
    input: GoogleLoginInput,
    context?: { userAgent?: string; ip?: string }
  ): Promise<AuthTokenPayload> {
    const payload = googleLoginSchema.parse(input);

    logger.info('Tentativa de login com Google recebida.');

    const googlePayload = await this.verifyGoogleIdToken(payload.idToken);

    const googleId = googlePayload.sub;
    const email = googlePayload.email;

    if (!email) {
      logger.warn('ID token do Google sem e-mail associado.');
      throw new AppError('Token do Google inválido.', 401);
    }

    let user = await userRepository.findByGoogleId(googleId);

    if (!user) {
      const existingByEmail = await userRepository.findByEmail(email);

      if (existingByEmail) {
        user =
          (await userRepository.linkGoogleAccount(existingByEmail.id, googleId, googlePayload.picture ?? null)) ??
          existingByEmail;
      } else {
        const randomPassword = await bcrypt.hash(randomToken(), 10);
        user = await userRepository.create({
          name: googlePayload.name ?? 'Usuário Google',
          email,
          password: randomPassword,
          role: 'customer',
          provider: 'google',
          googleId,
          pictureUrl: googlePayload.picture ?? null,
        });
      }
    }

    await refreshTokenRepository.revokeAllForUser(user.id);

    logger.info('Usuário autenticado via Google', { userId: user.id });

    return this.generateTokens(user, context);
  }

  async refreshToken(input: RefreshTokenInput, context?: { userAgent?: string; ip?: string }): Promise<AuthTokenPayload> {
    const payload = refreshSchema.parse(input);

    const hashed = hashToken(payload.refreshToken);
    const storedToken = await refreshTokenRepository.findActiveByHash(hashed);

    if (!storedToken) {
      logger.warn('Refresh token não encontrado ou revogado.');
      throw new AppError('Refresh token inválido.', 401);
    }

    if (storedToken.expiresAt.getTime() < Date.now()) {
      logger.warn('Refresh token expirado.', { tokenId: storedToken.id });
      await refreshTokenRepository.revokeByHash(hashed);
      throw new AppError('Refresh token expirado.', 401);
    }

    const user = await userRepository.findById(storedToken.userId);

    if (!user) {
      logger.warn('Usuário não encontrado para refresh token.', { userId: storedToken.userId });
      await refreshTokenRepository.revokeByHash(hashed);
      throw new AppError('Usuário não encontrado.', 404);
    }

    await refreshTokenRepository.revokeByHash(hashed);

    return this.generateTokens(user, context);
  }

  async logout(input: RefreshTokenInput): Promise<void> {
    const payload = refreshSchema.parse(input);
    await refreshTokenRepository.revokeByHash(hashToken(payload.refreshToken));
  }

  async getProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return sanitizeUser(user);
  }

  async introspectToken(token: string): Promise<AuthenticatedUser> {
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as {
        sub: string;
      };

      if (!decoded.sub) {
        throw new AppError('Token inválido.', 401);
      }

      return this.getProfile(decoded.sub);
    } catch (error) {
      logger.warn('Falha ao validar token para introspecção.', { error });
      throw new AppError('Token inválido.', 401);
    }
  }
}

export const authService = new AuthService();
