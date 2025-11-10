"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const AppError_1 = require("../errors/AppError");
const user_model_1 = require("../models/user.model");
const refresh_token_model_1 = require("../models/refresh-token.model");
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
const refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(10, 'Refresh token inválido.'),
});
const googleLoginSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(10, 'ID token inválido.'),
});
const ACCESS_TOKEN_TYPE = 'Bearer';
const hashToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
const randomToken = () => crypto_1.default.randomBytes(64).toString('hex');
const sanitizeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    provider: user.provider,
    pictureUrl: user.pictureUrl,
    createdAt: user.createdAt,
});
class AuthService {
    constructor() {
        (0, env_1.validateEnv)();
    }
    async verifyGoogleIdToken(idToken) {
        try {
            const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
            if (!response.ok) {
                const errorBody = await response.text();
                logger_1.default.warn('Falha ao validar token do Google', { status: response.status, errorBody });
                throw new AppError_1.AppError('Token do Google inválido.', 401);
            }
            const payload = (await response.json());
            if (!payload.sub || payload.aud !== env_1.env.googleClientId) {
                logger_1.default.warn('Token do Google com audience inesperada ou sem sub.', { aud: payload.aud });
                throw new AppError_1.AppError('Token do Google inválido.', 401);
            }
            return {
                sub: payload.sub,
                aud: payload.aud,
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                email_verified: payload.email_verified,
            };
        }
        catch (error) {
            if (error instanceof AppError_1.AppError) {
                throw error;
            }
            logger_1.default.error('Erro inesperado ao verificar token do Google', { error });
            throw new AppError_1.AppError('Não foi possível validar o token do Google.', 500);
        }
    }
    async generateTokens(user, context) {
        const expiresInMinutes = env_1.env.jwtAccessExpiresInMinutes;
        const accessToken = jsonwebtoken_1.default.sign({
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            provider: user.provider,
        }, env_1.env.jwtSecret, {
            expiresIn: `${expiresInMinutes}m`,
        });
        const refreshToken = randomToken();
        const expiresAt = new Date(Date.now() + env_1.env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000);
        await refresh_token_model_1.refreshTokenRepository.create({
            userId: user.id,
            tokenHash: hashToken(refreshToken),
            expiresAt,
            userAgent: context?.userAgent ?? null,
            ipAddress: context?.ip ?? null,
        });
        logger_1.default.debug('Tokens gerados para usuário.', { userId: user.id });
        return {
            accessToken,
            refreshToken,
            expiresIn: expiresInMinutes * 60,
            tokenType: ACCESS_TOKEN_TYPE,
            user: sanitizeUser(user),
        };
    }
    async register(input, context) {
        const payload = registerSchema.parse(input);
        logger_1.default.info('Iniciando registro de usuário', { email: payload.email });
        const existingUser = await user_model_1.userRepository.findByEmail(payload.email);
        if (existingUser) {
            logger_1.default.warn('Tentativa de registro com e-mail existente', { email: payload.email });
            throw new AppError_1.AppError('E-mail já cadastrado.', 422);
        }
        const hashedPassword = await bcryptjs_1.default.hash(payload.password, 10);
        const user = await user_model_1.userRepository.create({
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            role: 'customer',
            provider: 'local',
        });
        logger_1.default.info('Usuário registrado com sucesso', { userId: user.id });
        await refresh_token_model_1.refreshTokenRepository.revokeAllForUser(user.id);
        return this.generateTokens(user, context);
    }
    async login(input, context) {
        const payload = loginSchema.parse(input);
        logger_1.default.info('Tentativa de login recebida', { email: payload.email });
        const user = await user_model_1.userRepository.findByEmail(payload.email);
        if (!user) {
            logger_1.default.warn('Usuário não encontrado durante login', { email: payload.email });
            throw new AppError_1.AppError('Usuário não encontrado.', 404);
        }
        if (user.provider !== 'local') {
            logger_1.default.warn('Tentativa de login local para usuário com autenticação externa', {
                email: payload.email,
                provider: user.provider,
            });
            throw new AppError_1.AppError('Use o login social configurado para esta conta.', 400);
        }
        const passwordMatch = await bcryptjs_1.default.compare(payload.password, user.password);
        if (!passwordMatch) {
            logger_1.default.warn('Senha inválida durante login', { email: payload.email });
            throw new AppError_1.AppError('Credenciais inválidas.', 401);
        }
        await refresh_token_model_1.refreshTokenRepository.revokeAllForUser(user.id);
        logger_1.default.info('Usuário autenticado com sucesso', { userId: user.id });
        return this.generateTokens(user, context);
    }
    async loginWithGoogle(input, context) {
        const payload = googleLoginSchema.parse(input);
        logger_1.default.info('Tentativa de login com Google recebida.');
        const googlePayload = await this.verifyGoogleIdToken(payload.idToken);
        const googleId = googlePayload.sub;
        const email = googlePayload.email;
        if (!email) {
            logger_1.default.warn('ID token do Google sem e-mail associado.');
            throw new AppError_1.AppError('Token do Google inválido.', 401);
        }
        let user = await user_model_1.userRepository.findByGoogleId(googleId);
        if (!user) {
            const existingByEmail = await user_model_1.userRepository.findByEmail(email);
            if (existingByEmail) {
                user =
                    (await user_model_1.userRepository.linkGoogleAccount(existingByEmail.id, googleId, googlePayload.picture ?? null)) ??
                        existingByEmail;
            }
            else {
                const randomPassword = await bcryptjs_1.default.hash(randomToken(), 10);
                user = await user_model_1.userRepository.create({
                    name: googlePayload.name ?? 'Usuário Google',
                    email,
                    password: randomPassword,
                    role: 'customer',
                    provider: 'google',
                    googleId,
                    pictureUrl: googlePayload.picture ?? null,
                });
            }
        }
        await refresh_token_model_1.refreshTokenRepository.revokeAllForUser(user.id);
        logger_1.default.info('Usuário autenticado via Google', { userId: user.id });
        return this.generateTokens(user, context);
    }
    async refreshToken(input, context) {
        const payload = refreshSchema.parse(input);
        const hashed = hashToken(payload.refreshToken);
        const storedToken = await refresh_token_model_1.refreshTokenRepository.findActiveByHash(hashed);
        if (!storedToken) {
            logger_1.default.warn('Refresh token não encontrado ou revogado.');
            throw new AppError_1.AppError('Refresh token inválido.', 401);
        }
        if (storedToken.expiresAt.getTime() < Date.now()) {
            logger_1.default.warn('Refresh token expirado.', { tokenId: storedToken.id });
            await refresh_token_model_1.refreshTokenRepository.revokeByHash(hashed);
            throw new AppError_1.AppError('Refresh token expirado.', 401);
        }
        const user = await user_model_1.userRepository.findById(storedToken.userId);
        if (!user) {
            logger_1.default.warn('Usuário não encontrado para refresh token.', { userId: storedToken.userId });
            await refresh_token_model_1.refreshTokenRepository.revokeByHash(hashed);
            throw new AppError_1.AppError('Usuário não encontrado.', 404);
        }
        await refresh_token_model_1.refreshTokenRepository.revokeByHash(hashed);
        return this.generateTokens(user, context);
    }
    async logout(input) {
        const payload = refreshSchema.parse(input);
        await refresh_token_model_1.refreshTokenRepository.revokeByHash(hashToken(payload.refreshToken));
    }
    async getProfile(userId) {
        const user = await user_model_1.userRepository.findById(userId);
        if (!user) {
            throw new AppError_1.AppError('Usuário não encontrado.', 404);
        }
        return sanitizeUser(user);
    }
    async introspectToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
            if (!decoded.sub) {
                throw new AppError_1.AppError('Token inválido.', 401);
            }
            return this.getProfile(decoded.sub);
        }
        catch (error) {
            logger_1.default.warn('Falha ao validar token para introspecção.', { error });
            throw new AppError_1.AppError('Token inválido.', 401);
        }
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map