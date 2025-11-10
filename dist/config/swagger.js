"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const path_1 = __importDefault(require("path"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
exports.swaggerSpec = (0, swagger_jsdoc_1.default)({
    definition: {
        openapi: '3.0.0',
        info: { title: 'Mini Projeto Fullstack API', version: '1.0.0' },
        components: {
            securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
        },
        security: [{ bearerAuth: [] }],
        servers: [{ url: '/' }],
    },
    // globs absolutos para funcionar no runtime serverless
    apis: [
        path_1.default.resolve(process.cwd(), 'src/routes/*.ts'),
        path_1.default.resolve(process.cwd(), 'src/routes/*.js'),
    ],
});
//# sourceMappingURL=swagger.js.map