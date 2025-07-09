"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerUtils = exports.httpLogStream = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../config");
const logsDir = path_1.default.join(__dirname, '../../logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({
    format: 'HH:mm:ss',
}), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
}));
exports.logger = winston_1.default.createLogger({
    level: config_1.config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'dnd-backend' },
    transports: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'app.log'),
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ],
});
if (config_1.config.nodeEnv !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: consoleFormat,
    }));
}
exports.httpLogStream = {
    write: (message) => {
        exports.logger.info(message.trim());
    },
};
exports.loggerUtils = {
    logUserAction: (userId, action, details) => {
        exports.logger.info('User action', {
            userId,
            action,
            details,
            timestamp: new Date().toISOString(),
        });
    },
    logApiRequest: (method, url, userId, statusCode, responseTime) => {
        exports.logger.info('API request', {
            method,
            url,
            userId,
            statusCode,
            responseTime,
            timestamp: new Date().toISOString(),
        });
    },
    logDatabaseOperation: (operation, table, success, error) => {
        const level = success ? 'info' : 'error';
        exports.logger[level]('Database operation', {
            operation,
            table,
            success,
            error: error?.message || error,
            timestamp: new Date().toISOString(),
        });
    },
    logAuthEvent: (event, userId, email, success = true, error) => {
        const level = success ? 'info' : 'warn';
        exports.logger[level]('Authentication event', {
            event,
            userId,
            email,
            success,
            error: error?.message || error,
            timestamp: new Date().toISOString(),
        });
    },
    logSocketEvent: (event, socketId, userId, data) => {
        exports.logger.info('Socket event', {
            event,
            socketId,
            userId,
            data,
            timestamp: new Date().toISOString(),
        });
    },
    logPerformance: (operation, duration, details) => {
        exports.logger.info('Performance metric', {
            operation,
            duration,
            details,
            timestamp: new Date().toISOString(),
        });
    },
    logSecurityEvent: (event, severity, details) => {
        const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
        exports.logger[level]('Security event', {
            event,
            severity,
            details,
            timestamp: new Date().toISOString(),
        });
    },
};
exports.logger.exceptions.handle(new winston_1.default.transports.File({
    filename: path_1.default.join(logsDir, 'exceptions.log'),
    maxsize: 5242880,
    maxFiles: 5,
}));
process.on('unhandledRejection', (reason, promise) => {
    exports.logger.error('Unhandled Rejection at:', {
        promise,
        reason,
        timestamp: new Date().toISOString(),
    });
});
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map