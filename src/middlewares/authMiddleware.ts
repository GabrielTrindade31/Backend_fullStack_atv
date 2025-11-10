import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ message: 'Token de acesso não fornecido.' });
    return;
  }

  const [, token] = authHeader.split(' ');
  if (!token) {
    res.status(401).json({ message: 'Formato de autorização inválido.' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    if (!payload.role) {
      res.status(401).json({ message: 'Token de acesso inválido.' });
      return;
    }
    req.userRole = payload.role;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token de acesso inválido.' });
  }
}
