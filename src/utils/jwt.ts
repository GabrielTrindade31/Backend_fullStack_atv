import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  sub: string;
  email?: string | null;
  role: 'client' | 'admin';
}

export function signAccessToken(userId: string, email: string | null, role: 'client' | 'admin'): string {
  const payload: TokenPayload = { sub: userId, role };
  if (email) {
    payload.email = email;
  }
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '15m' });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
