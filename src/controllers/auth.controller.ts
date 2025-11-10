import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import logger from '../utils/logger';

class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = await authService.register(req.body);
      logger.debug('Retornando resposta de registro', { userId: user.id });
      return res.status(201).json({
        message: 'Usuário criado com sucesso.',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const token = await authService.login(req.body);
      logger.debug('Token de autenticação gerado com sucesso');
      return res.status(200).json(token);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
