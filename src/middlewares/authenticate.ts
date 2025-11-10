import { NextFunction, Request, Response } from 'express';
import { AppError } from '../core/errors/AppError';
import { verifyAccessToken } from '../lib/jwt';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token de acesso não informado.', 401);
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    throw new AppError('Token de acesso mal formatado.', 401);
  }

  const payload = verifyAccessToken(token);

  req.auth = {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
    token,
  };

  next();
}
