"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectedController = exports.ProtectedController = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class ProtectedController {
    async getProtectedMessage(req, res) {
        logger_1.default.debug('Retornando conteúdo protegido para usuário autenticado.', {
            userId: req.user?.id,
        });
        return res.status(200).json({
            message: 'Acesso autorizado.',
            user: req.user,
            permissions: {
                role: req.user?.role,
            },
        });
    }
}
exports.ProtectedController = ProtectedController;
exports.protectedController = new ProtectedController();
//# sourceMappingURL=protected.controller.js.map