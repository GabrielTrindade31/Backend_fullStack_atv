import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';

class AuthController {
  private extractContext(req: Request) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor ?? req.ip;
    return {
      userAgent: req.headers['user-agent'] ?? undefined,
      ip: ip ?? undefined,
    };
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const tokenPayload = await authService.register(req.body, this.extractContext(req));
      logger.debug('Retornando resposta de registro', { userId: tokenPayload.user.id });
      return res.status(201).json(tokenPayload);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const token = await authService.login(req.body, this.extractContext(req));
      logger.debug('Token de autenticação gerado com sucesso');
      return res.status(200).json(token);
    } catch (error) {
      next(error);
    }
  }

  async loginWithGoogle(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const token = await authService.loginWithGoogle(req.body, this.extractContext(req));
      logger.debug('Token de autenticação via Google gerado com sucesso');
      return res.status(200).json(token);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const token = await authService.refreshToken(req.body, this.extractContext(req));
      logger.debug('Token de sessão renovado com sucesso');
      return res.status(200).json(token);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await authService.logout(req.body);
      logger.debug('Refresh token revogado com sucesso');
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Token inválido.' });
      }

      const profile = await authService.getProfile(req.user.id);
      return res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  }

  async introspect(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const schema = z.object({ token: z.string().min(10) });
      const { token } = schema.parse(req.body);
      const user = await authService.introspectToken(token);
      return res.status(200).json({ active: true, user });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
