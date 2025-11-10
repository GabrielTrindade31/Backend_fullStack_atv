"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = require("../errors/AppError");
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../utils/logger"));
const authenticateToken = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        logger_1.default.warn('Tentativa de acesso sem token.');
        return next(new AppError_1.AppError('Token não informado.', 401));
    }
    const [, token] = authHeader.split(' ');
    if (!token) {
        logger_1.default.warn('Cabeçalho Authorization mal formatado.');
        return next(new AppError_1.AppError('Token inválido.', 401));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        req.user = {
            id: decoded.sub,
            email: decoded.email,
        };
        logger_1.default.debug('Token JWT validado com sucesso', { userId: decoded.sub });
        next();
    }
    catch (error) {
        logger_1.default.warn('Token JWT inválido.', { error });
        next(new AppError_1.AppError('Token inválido.', 401));
    }
};
exports.authenticateToken = authenticateToken;
//# sourceMappingURL=auth.middleware.js.map