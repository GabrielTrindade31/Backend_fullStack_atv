import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
const authRouter = Router();

/**
 * @openapi
 * /register:
 *   post:
 *     summary: Cria um novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201: { description: Usuário criado }
 *       422: { description: Payload inválido/E-mail repetido }
 */
authRouter.post('/register', (req, res, next) => authController.register(req, res, next));

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Autentica e retorna um token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Token gerado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 */
authRouter.post('/login', (req, res, next) => authController.login(req, res, next));

export default authRouter;
