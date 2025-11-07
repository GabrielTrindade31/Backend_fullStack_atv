import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  sub: string;
  email?: string | null;
}

export function signAccessToken(userId: string, email?: string | null): string {
  const payload: TokenPayload = { sub: userId };
  if (email) {
    payload.email = email;
  }
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
