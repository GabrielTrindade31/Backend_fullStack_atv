import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { env } from '../config/env';
import logger from '../utils/logger';
import { UserRole } from '../models/user.model';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
    provider?: string;
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
    const decoded = jwt.verify(token, env.jwtSecret) as {
      sub: string;
      email: string;
      name?: string;
      role?: UserRole;
      provider?: string;
    };

    if (!decoded.sub || !decoded.email) {
      logger.warn('Payload do token não possui identificadores obrigatórios.');
      return next(new AppError('Token inválido.', 401));
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role ?? 'customer',
      provider: decoded.provider,
    };
    logger.debug('Token JWT validado com sucesso', { userId: decoded.sub });
    next();
  } catch (error) {
    logger.warn('Token JWT inválido.', { error });
    next(new AppError('Token inválido.', 401));
  }
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn('Tentativa de autorização sem usuário na requisição.');
      return next(new AppError('Token inválido.', 401));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Usuário tentou acessar recurso não autorizado.', {
        userId: req.user.id,
        role: req.user.role,
        allowedRoles: roles,
      });
      return next(new AppError('Acesso não autorizado.', 403));
    }

    next();
  };
};
