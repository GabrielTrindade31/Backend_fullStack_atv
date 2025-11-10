"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const AppError_1 = require("../errors/AppError");
const user_model_1 = require("../models/user.model");
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../utils/logger"));
const passwordSchema = zod_1.z
    .string()
    .min(8, 'A senha deve possuir pelo menos 8 caracteres.')
    .regex(/[A-Z]/, 'A senha deve possuir ao menos uma letra maiúscula.')
    .regex(/[a-z]/, 'A senha deve possuir ao menos uma letra minúscula.')
    .regex(/\d/, 'A senha deve possuir ao menos um número.')
    .regex(/[^A-Za-z0-9]/, 'A senha deve possuir ao menos um caractere especial.');
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'O nome deve possuir ao menos 3 caracteres.'),
    email: zod_1.z.string().email('E-mail inválido.'),
    password: passwordSchema,
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('E-mail inválido.'),
    password: zod_1.z.string().min(8, 'Senha inválida.'),
});
class AuthService {
    constructor() {
        (0, env_1.validateEnv)();
    }
    async register(input) {
        const payload = registerSchema.parse(input);
        logger_1.default.info('Iniciando registro de usuário', { email: payload.email });
        const existingUser = await user_model_1.userRepository.findByEmail(payload.email);
        if (existingUser) {
            logger_1.default.warn('Tentativa de registro com e-mail existente', { email: payload.email });
            throw new AppError_1.AppError('E-mail já cadastrado.', 422);
        }
        const hashedPassword = await bcryptjs_1.default.hash(payload.password, 10);
        const user = await user_model_1.userRepository.create(payload.name, payload.email, hashedPassword);
        logger_1.default.info('Usuário registrado com sucesso', { userId: user.id });
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        };
    }
    async login(input) {
        const payload = loginSchema.parse(input);
        logger_1.default.info('Tentativa de login recebida', { email: payload.email });
        const user = await user_model_1.userRepository.findByEmail(payload.email);
        if (!user) {
            logger_1.default.warn('Usuário não encontrado durante login', { email: payload.email });
            throw new AppError_1.AppError('Usuário não encontrado.', 404);
        }
        const passwordMatch = await bcryptjs_1.default.compare(payload.password, user.password);
        if (!passwordMatch) {
            logger_1.default.warn('Senha inválida durante login', { email: payload.email });
            throw new AppError_1.AppError('Credenciais inválidas.', 401);
        }
        const token = jsonwebtoken_1.default.sign({
            sub: user.id,
            email: user.email,
        }, env_1.env.jwtSecret, {
            expiresIn: '1h',
        });
        logger_1.default.info('Usuário autenticado com sucesso', { userId: user.id });
        return { token };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map