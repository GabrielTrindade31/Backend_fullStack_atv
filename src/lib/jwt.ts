import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { AppError } from '../core/errors/AppError';
import { env } from '../config/env';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

export function createAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {};

  if (env.jwtExpiresIn) {
    options.expiresIn = env.jwtExpiresIn as SignOptions['expiresIn'];
  }

  return jwt.sign(payload, env.jwtSecret as Secret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.jwtSecret as Secret) as JwtPayload;
  } catch (error) {
    throw new AppError('Token inválido ou expirado.', 401, error);
  }
}
