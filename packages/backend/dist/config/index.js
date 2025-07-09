"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
exports.config = {
    port: parseInt(process.env['PORT'] || '3000'),
    nodeEnv: process.env['NODE_ENV'] || 'development',
    corsOrigin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
    database: {
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '5432'),
        name: process.env['DB_NAME'] || 'dnd_game',
        user: process.env['DB_USER'] || 'postgres',
        password: process.env['DB_PASSWORD'] || 'password',
        ssl: process.env['DB_SSL'] === 'true',
        client: process.env['DB_CLIENT'] || 'sqlite3',
        filename: process.env['DB_FILENAME'] || './data/database.db',
    },
    jwt: {
        secret: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-this-in-production',
        expiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
        refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
    },
    openai: {
        apiKey: process.env['OPENAI_API_KEY'] || '',
        model: process.env['OPENAI_MODEL'] || 'gpt-4',
        maxTokens: parseInt(process.env['OPENAI_MAX_TOKENS'] || '2000'),
    },
    upload: {
        directory: process.env['UPLOAD_DIR'] || './uploads',
        maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760'),
    },
    rateLimit: {
        windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
        maxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
    },
    logging: {
        level: process.env['LOG_LEVEL'] || 'info',
        file: process.env['LOG_FILE'] || './logs/app.log',
    },
    socket: {
        corsOrigin: process.env['SOCKET_CORS_ORIGIN']?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
    },
    security: {
        bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12'),
        sessionSecret: process.env['SESSION_SECRET'] || 'your-session-secret-key-change-this-in-production',
    },
    redis: {
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379'),
        password: process.env['REDIS_PASSWORD'] || '',
    },
};
exports.default = exports.config;
//# sourceMappingURL=index.js.map