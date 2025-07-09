"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.requireAdmin = requireAdmin;
exports.requireDM = requireDM;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const database_1 = require("../database");
const logger_1 = require("../utils/logger");
async function authenticate(req, res, next) {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Access denied. No token provided.',
                    statusCode: 401,
                },
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        const db = (0, database_1.getDatabase)();
        const tokenRecord = await db('auth_tokens')
            .where('token', token)
            .where('user_id', decoded.userId)
            .where('type', 'access')
            .where('is_revoked', false)
            .where('expires_at', '>', new Date())
            .first();
        if (!tokenRecord) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid or expired token.',
                    statusCode: 401,
                },
            });
            return;
        }
        const user = await db('users')
            .select('id', 'email', 'username', 'role', 'is_verified')
            .where('id', decoded.userId)
            .first();
        if (!user) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'User not found.',
                    statusCode: 401,
                },
            });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication error:', error);
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Token expired.',
                    statusCode: 401,
                },
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid token.',
                    statusCode: 401,
                },
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: {
                message: 'Authentication failed.',
                statusCode: 500,
            },
        });
    }
}
function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required.',
                    statusCode: 401,
                },
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: {
                    message: 'Insufficient permissions.',
                    statusCode: 403,
                },
            });
            return;
        }
        next();
    };
}
function requireAdmin(req, res, next) {
    requireRole(['admin'])(req, res, next);
}
function requireDM(req, res, next) {
    requireRole(['dm', 'admin'])(req, res, next);
}
//# sourceMappingURL=auth.js.map