import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { env } from '../config/env';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn('Tentativa de acesso sem token.');
    return next(new AppError('Token não informado.', 401));
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    logger.warn('Cabeçalho Authorization mal formatado.');
    return next(new AppError('Token inválido.', 401));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { sub: string; email: string };
    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };
    logger.debug('Token JWT validado com sucesso', { userId: decoded.sub });
    next();
  } catch (error) {
    logger.warn('Token JWT inválido.', { error });
    next(new AppError('Token inválido.', 401));
  }
};
