import { NextFunction, Request, Response } from 'express';
import { AppError } from '../core/errors/AppError';

type Role = 'admin' | 'client';

export function ensureRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    if (!roles.includes(req.auth.role as Role)) {
      throw new AppError('Usuário sem permissão para acessar este recurso.', 403);
    }

    next();
  };
}
