"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("../services/auth.service");
const logger_1 = __importDefault(require("../utils/logger"));
const zod_1 = require("zod");
class AuthController {
    extractContext(req) {
        const forwardedFor = req.headers['x-forwarded-for'];
        const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor ?? req.ip;
        return {
            userAgent: req.headers['user-agent'] ?? undefined,
            ip: ip ?? undefined,
        };
    }
    async register(req, res, next) {
        try {
            const tokenPayload = await auth_service_1.authService.register(req.body, this.extractContext(req));
            logger_1.default.debug('Retornando resposta de registro', { userId: tokenPayload.user.id });
            return res.status(201).json(tokenPayload);
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const token = await auth_service_1.authService.login(req.body, this.extractContext(req));
            logger_1.default.debug('Token de autenticação gerado com sucesso');
            return res.status(200).json(token);
        }
        catch (error) {
            next(error);
        }
    }
    async loginWithGoogle(req, res, next) {
        try {
            const token = await auth_service_1.authService.loginWithGoogle(req.body, this.extractContext(req));
            logger_1.default.debug('Token de autenticação via Google gerado com sucesso');
            return res.status(200).json(token);
        }
        catch (error) {
            next(error);
        }
    }
    async refreshToken(req, res, next) {
        try {
            const token = await auth_service_1.authService.refreshToken(req.body, this.extractContext(req));
            logger_1.default.debug('Token de sessão renovado com sucesso');
            return res.status(200).json(token);
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            await auth_service_1.authService.logout(req.body);
            logger_1.default.debug('Refresh token revogado com sucesso');
            return res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    async me(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Token inválido.' });
            }
            const profile = await auth_service_1.authService.getProfile(req.user.id);
            return res.status(200).json(profile);
        }
        catch (error) {
            next(error);
        }
    }
    async introspect(req, res, next) {
        try {
            const schema = zod_1.z.object({ token: zod_1.z.string().min(10) });
            const { token } = schema.parse(req.body);
            const user = await auth_service_1.authService.introspectToken(token);
            return res.status(200).json({ active: true, user });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map