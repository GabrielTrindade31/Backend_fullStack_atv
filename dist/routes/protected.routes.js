"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const protected_controller_1 = require("../controllers/protected.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const protectedRouter = (0, express_1.Router)();
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
protectedRouter.get('/protected', auth_middleware_1.authenticateToken, (req, res) => protected_controller_1.protectedController.getProtectedMessage(req, res));
exports.default = protectedRouter;
//# sourceMappingURL=protected.routes.js.map