"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authRouter = (0, express_1.Router)();
const router = (0, express_1.Router)();
router.use('/auth', authRouter);
/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Cria um novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, confirmPassword, birthDate]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome completo do usuário
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               confirmPassword:
 *                 type: string
 *                 description: Deve ser idêntica ao campo password
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 description: Data de nascimento no formato ISO (AAAA-MM-DD)
 *     responses:
 *       201:
 *         description: Usuário criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       422: { description: Payload inválido/E-mail repetido }
 */
authRouter.post('/register', (req, res, next) => auth_controller_1.authController.register(req, res, next));
/**
 * @openapi
 * /auth/login:
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
 *               $ref: '#/components/schemas/AuthResponse'
 */
authRouter.post('/login', (req, res, next) => auth_controller_1.authController.login(req, res, next));
/**
 * @openapi
 * /auth/login/google:
 *   post:
 *     summary: Autentica utilizando um ID token do Google
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken: { type: string }
 *     responses:
 *       200:
 *         description: Token gerado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
authRouter.post('/login/google', (req, res, next) => auth_controller_1.authController.loginWithGoogle(req, res, next));
/**
 * @openapi
 * /auth/token/refresh:
 *   post:
 *     summary: Gera um novo par de tokens utilizando o refresh token atual
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Novo par de tokens
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
authRouter.post('/token/refresh', (req, res, next) => auth_controller_1.authController.refreshToken(req, res, next));
/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Revoga o refresh token ativo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       204: { description: Logout realizado }
 */
authRouter.post('/logout', (req, res, next) => auth_controller_1.authController.logout(req, res, next));
/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Retorna os dados do usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
authRouter.get('/me', auth_middleware_1.authenticateToken, (req, res, next) => auth_controller_1.authController.me(req, res, next));
/**
 * @openapi
 * /auth/token/introspect:
 *   post:
 *     summary: Valida um token de acesso emitido pelo serviço de cadastro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Resultado da introspecção
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 active: { type: boolean }
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
authRouter.post('/token/introspect', (req, res, next) => auth_controller_1.authController.introspect(req, res, next));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map