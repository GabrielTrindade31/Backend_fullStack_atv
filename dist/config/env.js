"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = exports.env = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const resolveDatabaseUrl = () => {
    const env = process.env.NODE_ENV ?? 'development';
    if (env === 'production') {
        return process.env.DATABASE_URL_PROD ?? process.env.DATABASE_URL ?? '';
    }
    return process.env.DATABASE_URL ?? '';
};
const resolveDatabaseSsl = () => {
    const sslValue = process.env.POSTGRES_SSL ?? process.env.DATABASE_SSL ?? '';
    return ['1', 'true', 'enabled', 'require'].includes(sslValue.toLowerCase());
};
exports.env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3333),
    jwtSecret: process.env.JWT_SECRET ?? '',
    jwtAccessExpiresInMinutes: Number(process.env.JWT_ACCESS_EXPIRES_IN_MIN ?? 15),
    refreshTokenExpiresInDays: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? 7),
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
    databaseUrl: resolveDatabaseUrl(),
    databaseSsl: resolveDatabaseSsl(),
};
const validateEnv = () => {
    const missing = [];
    if (!exports.env.databaseUrl) {
        missing.push(exports.env.nodeEnv === 'production' ? 'DATABASE_URL_PROD' : 'DATABASE_URL');
    }
    if (!exports.env.jwtSecret) {
        missing.push('JWT_SECRET');
    }
    if (!exports.env.googleClientId) {
        missing.push('GOOGLE_CLIENT_ID');
    }
    if (missing.length > 0) {
        throw new Error(`Variáveis de ambiente ausentes: ${missing.join(', ')}`);
    }
};
exports.validateEnv = validateEnv;
//# sourceMappingURL=env.js.map