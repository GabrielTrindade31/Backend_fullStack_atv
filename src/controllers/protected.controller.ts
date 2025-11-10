import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import logger from '../utils/logger';

export class ProtectedController {
  async getProtectedMessage(req: AuthenticatedRequest, res: Response): Promise<Response> {
    logger.debug('Retornando conteúdo protegido para usuário autenticado.', {
      userId: req.user?.id,
    });

    return res.status(200).json({
      message: 'Acesso autorizado.',
      user: req.user,
    });
  }
}

export const protectedController = new ProtectedController();
