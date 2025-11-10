"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./database");
const logger_1 = __importDefault(require("./utils/logger"));
const startServer = async () => {
    try {
        await (0, database_1.connectDatabase)();
        const app = (0, app_1.default)();
        app.listen(env_1.env.port, () => {
            logger_1.default.info(`Servidor rodando na porta ${env_1.env.port}`);
        });
    }
    catch (error) {
        logger_1.default.error('Falha ao iniciar o servidor', { error });
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map