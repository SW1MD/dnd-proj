"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("./config");
const database_1 = require("./database");
const routes_1 = require("./routes");
const socket_1 = require("./services/socket");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
async function startServer() {
    try {
        await (0, database_1.initializeDatabase)();
        const app = (0, express_1.default)();
        const server = (0, http_1.createServer)(app);
        const io = new socket_io_1.Server(server, {
            cors: {
                origin: config_1.config.socket.corsOrigin,
                methods: ['GET', 'POST'],
            },
        });
        app.use((0, helmet_1.default)());
        app.use((0, cors_1.default)({
            origin: config_1.config.corsOrigin,
            credentials: true,
        }));
        app.use((0, compression_1.default)());
        app.use((0, morgan_1.default)('combined', {
            stream: {
                write: (message) => logger_1.logger.info(message.trim()),
            },
        }));
        app.use(rateLimiter_1.rateLimiterMiddleware);
        app.use(express_1.default.json({ limit: '10mb' }));
        app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        const uploadDir = path_1.default.join(__dirname, '../uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        app.use('/uploads', express_1.default.static(uploadDir));
        app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                environment: config_1.config.nodeEnv,
                uptime: process.uptime(),
            });
        });
        (0, routes_1.setupRoutes)(app);
        (0, socket_1.setupSocketHandlers)(io);
        app.use(errorHandler_1.errorHandler);
        server.listen(config_1.config.port, () => {
            logger_1.logger.info(`🚀 Server running on port ${config_1.config.port}`);
            logger_1.logger.info(`📁 Environment: ${config_1.config.nodeEnv}`);
            logger_1.logger.info(`🎲 D&D AI Game Backend started successfully`);
        });
        process.on('SIGTERM', () => {
            logger_1.logger.info('SIGTERM received, shutting down gracefully');
            server.close(() => {
                logger_1.logger.info('Server closed');
                process.exit(0);
            });
        });
        process.on('SIGINT', () => {
            logger_1.logger.info('SIGINT received, shutting down gracefully');
            server.close(() => {
                logger_1.logger.info('Server closed');
                process.exit(0);
            });
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=index.js.map