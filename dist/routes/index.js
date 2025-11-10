"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const protected_routes_1 = __importDefault(require("./protected.routes"));
const health_routes_1 = __importDefault(require("./health.routes"));
const task_routes_1 = __importDefault(require("./task.routes"));
const router = (0, express_1.Router)();
// GET /health -> {"status":"ok",...}
router.use('/health', health_routes_1.default);
// /register, /login
router.use(auth_routes_1.default);
// /protected
router.use(protected_routes_1.default);
// /tasks
router.use(task_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map