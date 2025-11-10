import { Router, Response } from 'express';
import { protectedController } from '../controllers/protected.controller';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth.middleware';
const protectedRouter = Router();

/**
 * @openapi
 * /protected:
 *   get:
 *     summary: Rota protegida por JWT
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Acesso autorizado }
 *       401: { description: Token ausente/inválido }
 */
protectedRouter.get('/protected', authenticateToken, (req: AuthenticatedRequest, res: Response) =>
  protectedController.getProtectedMessage(req, res)
);

export default protectedRouter;
