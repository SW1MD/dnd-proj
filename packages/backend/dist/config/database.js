"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const config = {
    development: {
        client: 'sqlite3',
        connection: {
            filename: path_1.default.join(__dirname, '../../data/database.db'),
        },
        useNullAsDefault: true,
        migrations: {
            directory: path_1.default.join(__dirname, '../database/migrations'),
        },
        seeds: {
            directory: path_1.default.join(__dirname, '../database/seeds'),
        },
    },
    production: {
        client: 'pg',
        connection: {
            host: process.env['DB_HOST'] || 'localhost',
            port: parseInt(process.env['DB_PORT'] || '5432'),
            database: process.env['DB_NAME'] || 'dnd_game',
            user: process.env['DB_USER'] || 'postgres',
            password: process.env['DB_PASSWORD'] || 'password',
            ssl: process.env['DB_SSL'] === 'true' ? { rejectUnauthorized: false } : false,
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: path_1.default.join(__dirname, '../database/migrations'),
        },
        seeds: {
            directory: path_1.default.join(__dirname, '../database/seeds'),
        },
    },
    test: {
        client: 'sqlite3',
        connection: ':memory:',
        useNullAsDefault: true,
        migrations: {
            directory: path_1.default.join(__dirname, '../database/migrations'),
        },
        seeds: {
            directory: path_1.default.join(__dirname, '../database/seeds'),
        },
    },
};
exports.default = config;
//# sourceMappingURL=database.js.map