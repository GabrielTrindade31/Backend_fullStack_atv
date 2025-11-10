"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("../services/auth.service");
const logger_1 = __importDefault(require("../utils/logger"));
class AuthController {
    async register(req, res, next) {
        try {
            const user = await auth_service_1.authService.register(req.body);
            logger_1.default.debug('Retornando resposta de registro', { userId: user.id });
            return res.status(201).json({
                message: 'Usuário criado com sucesso.',
                user,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const token = await auth_service_1.authService.login(req.body);
            logger_1.default.debug('Token de autenticação gerado com sucesso');
            return res.status(200).json(token);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map