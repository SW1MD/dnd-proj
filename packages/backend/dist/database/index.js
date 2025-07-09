"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
const knex_1 = __importDefault(require("knex"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
let db;
async function initializeDatabase() {
    try {
        if (config_1.config.database.client === 'sqlite3') {
            const dataDir = path_1.default.join(__dirname, '../../data');
            if (!fs_1.default.existsSync(dataDir)) {
                fs_1.default.mkdirSync(dataDir, { recursive: true });
            }
        }
        const dbConfig = {
            client: config_1.config.database.client,
            connection: config_1.config.database.client === 'sqlite3'
                ? { filename: config_1.config.database.filename }
                : {
                    host: config_1.config.database.host,
                    port: config_1.config.database.port,
                    database: config_1.config.database.name,
                    user: config_1.config.database.user,
                    password: config_1.config.database.password,
                    ssl: config_1.config.database.ssl ? { rejectUnauthorized: false } : false,
                },
            useNullAsDefault: config_1.config.database.client === 'sqlite3',
            migrations: {
                directory: path_1.default.join(__dirname, './migrations'),
                extension: 'ts',
            },
            seeds: {
                directory: path_1.default.join(__dirname, './seeds'),
                extension: 'ts',
            },
            pool: {
                min: 2,
                max: 10,
                acquireTimeoutMillis: 60000,
                idleTimeoutMillis: 30000,
            },
        };
        db = (0, knex_1.default)(dbConfig);
        await db.raw('SELECT 1');
        logger_1.logger.info('✅ Database connected successfully');
        await db.migrate.latest();
        logger_1.logger.info('✅ Database migrations completed');
        if (config_1.config.nodeEnv === 'development') {
            await db.seed.run();
            logger_1.logger.info('✅ Database seeded successfully');
        }
    }
    catch (error) {
        logger_1.logger.error('❌ Database initialization failed:', error);
        throw error;
    }
}
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}
async function closeDatabase() {
    if (db) {
        await db.destroy();
        logger_1.logger.info('✅ Database connection closed');
    }
}
//# sourceMappingURL=index.js.map