"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health = (0, express_1.Router)();
health.get('/', (_req, res) => res.json({ status: 'ok', service: 'mini-projeto-fullstack' }));
exports.default = health;
//# sourceMappingURL=health.routes.js.map