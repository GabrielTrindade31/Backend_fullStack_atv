import { NextFunction, Request, Response } from 'express';
import { Role } from '../types/user';

export function authorizeRoles(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userId || !req.userRole) {
      res.status(401).json({ message: 'Usuário não autenticado.' });
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({ message: 'Usuário sem permissão para acessar este recurso.' });
      return;
    }

    next();
  };
}
