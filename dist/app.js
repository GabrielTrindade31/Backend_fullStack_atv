"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const request_logger_middleware_1 = require("./middlewares/request-logger.middleware");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const createApp = () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    // Desabilite CSP para o Swagger UI (evita página em branco)
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
    app.use(express_1.default.json());
    app.use(request_logger_middleware_1.requestLogger);
    // JSON da spec (útil para debug)
    app.get('/docs.json', (_req, res) => res.json(swagger_1.swaggerSpec));
    // UI
    app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(undefined, {
        swaggerOptions: { url: '/docs.json' },
        explorer: true,
    }));
    app.use(routes_1.default);
    app.use(error_middleware_1.errorMiddleware);
    return app;
};
exports.createApp = createApp;
exports.default = exports.createApp; // ok ter default também
//# sourceMappingURL=app.js.map