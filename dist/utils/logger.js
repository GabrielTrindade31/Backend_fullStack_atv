"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const { combine, timestamp, printf, colorize } = winston_1.default.format;
const logFormat = printf(({ level, message, timestamp: time, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${time}] ${level}: ${message}${metaString}`;
});
const logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(timestamp(), logFormat),
    transports: [new winston_1.default.transports.Console()],
});
if (process.env.NODE_ENV !== 'production') {
    logger.configure({
        level: 'debug',
        format: combine(colorize(), timestamp(), logFormat),
    });
}
exports.default = logger;
//# sourceMappingURL=logger.js.map