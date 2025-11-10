"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const zod_1 = require("zod");
const AppError_1 = require("../errors/AppError");
const logger_1 = __importDefault(require("../utils/logger"));
const errorMiddleware = (error, _req, res, _next) => {
    if (error instanceof AppError_1.AppError) {
        logger_1.default.error(error.message, { statusCode: error.statusCode, details: error.details });
        return res.status(error.statusCode).json({
            message: error.message,
            details: error.details,
        });
    }
    if (error instanceof zod_1.ZodError) {
        logger_1.default.warn('Erro de validação', { issues: error.issues });
        return res.status(422).json({
            message: 'Erro de validação',
            issues: error.issues,
        });
    }
    logger_1.default.error('Erro interno não tratado', { error });
    return res.status(500).json({ message: 'Erro interno do servidor.' });
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map