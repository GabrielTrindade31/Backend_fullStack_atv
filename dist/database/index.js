"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.connectDatabase = exports.pool = void 0;
const pg_1 = require("pg");
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../utils/logger"));
exports.pool = new pg_1.Pool({
    connectionString: env_1.env.databaseUrl,
    ssl: env_1.env.databaseSsl ? { rejectUnauthorized: false } : false,
});
let isConnected = false;
const connectDatabase = async () => {
    if (isConnected) {
        logger_1.default.debug('Conexão com PostgreSQL já estabelecida.');
        return;
    }
    try {
        await exports.pool.query('SELECT 1');
        isConnected = true;
        logger_1.default.info('Conectado ao PostgreSQL com sucesso.');
    }
    catch (error) {
        logger_1.default.error('Erro ao conectar ao PostgreSQL', { error });
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
    if (!isConnected) {
        return;
    }
    await exports.pool.end();
    isConnected = false;
    logger_1.default.info('Conexão com PostgreSQL encerrada.');
};
exports.disconnectDatabase = disconnectDatabase;
//# sourceMappingURL=index.js.map