"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const database_1 = require("../database");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
exports.authController = {
    async register(req, res) {
        try {
            const { email, username, display_name, password } = req.body;
            if (!email || !username || !display_name || !password) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'All fields are required.',
                        statusCode: 400,
                    },
                });
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Invalid email format.',
                        statusCode: 400,
                    },
                });
                return;
            }
            if (password.length < 6) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Password must be at least 6 characters long.',
                        statusCode: 400,
                    },
                });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const existingUser = await db('users')
                .where('email', email.toLowerCase())
                .orWhere('username', username.toLowerCase())
                .first();
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    error: {
                        message: existingUser.email === email.toLowerCase()
                            ? 'Email already registered.'
                            : 'Username already taken.',
                        statusCode: 409,
                    },
                });
                return;
            }
            const saltRounds = config_1.config.security.bcryptRounds;
            const passwordHash = await bcryptjs_1.default.hash(password, saltRounds);
            const userId = (0, uuid_1.v4)();
            await db('users').insert({
                id: userId,
                email: email.toLowerCase(),
                username: username.toLowerCase(),
                display_name,
                password_hash: passwordHash,
                role: 'player',
                is_verified: false,
                is_online: false,
                preferences: JSON.stringify({
                    theme: 'dark',
                    notifications: true,
                    soundEnabled: true,
                    autoRollDice: false,
                    showCombatAnimations: true,
                }),
                stats: JSON.stringify({
                    gamesPlayed: 0,
                    totalPlayTime: 0,
                    charactersCreated: 0,
                    achievementsUnlocked: [],
                }),
            });
            logger_1.logger.info(`New user registered: ${email}`);
            res.status(201).json({
                success: true,
                data: {
                    message: 'User registered successfully. Please check your email for verification.',
                    user: {
                        id: userId,
                        email: email.toLowerCase(),
                        username: username.toLowerCase(),
                        display_name,
                        role: 'player',
                    },
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Registration error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Registration failed.',
                    statusCode: 500,
                },
            });
        }
    },
    async login(req, res) {
        try {
            const { email, username, password } = req.body;
            if (!password || (!email && !username)) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Email/username and password are required.',
                        statusCode: 400,
                    },
                });
                return;
            }
            const db = (0, database_1.getDatabase)();
            let query = db('users');
            if (email) {
                query = query.where('email', email.toLowerCase());
            }
            else if (username) {
                query = query.where('username', username.toLowerCase());
            }
            const user = await query.first();
            if (!user) {
                res.status(401).json({
                    success: false,
                    error: {
                        message: 'Invalid credentials.',
                        statusCode: 401,
                    },
                });
                return;
            }
            const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
            if (!isValidPassword) {
                res.status(401).json({
                    success: false,
                    error: {
                        message: 'Invalid credentials.',
                        statusCode: 401,
                    },
                });
                return;
            }
            const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.expiresIn });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, type: 'refresh' }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.refreshExpiresIn });
            const tokenId = (0, uuid_1.v4)();
            const refreshTokenId = (0, uuid_1.v4)();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await db('auth_tokens').insert({
                id: tokenId,
                user_id: user.id,
                token: accessToken,
                type: 'access',
                expires_at: expiresAt,
                is_revoked: false,
            });
            await db('auth_tokens').insert({
                id: refreshTokenId,
                user_id: user.id,
                token: refreshToken,
                type: 'refresh',
                expires_at: refreshExpiresAt,
                is_revoked: false,
            });
            await db('users')
                .where('id', user.id)
                .update({
                last_login_at: new Date(),
                is_online: true,
            });
            logger_1.logger.info(`User logged in: ${user.email}`);
            res.json({
                success: true,
                data: {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    expires_in: 24 * 60 * 60,
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        display_name: user.display_name,
                        role: user.role,
                        is_verified: user.is_verified,
                    },
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Login failed.',
                    statusCode: 500,
                },
            });
        }
    },
    async refresh(req, res) {
        try {
            const { refresh_token } = req.body;
            if (!refresh_token) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Refresh token is required.',
                        statusCode: 400,
                    },
                });
                return;
            }
            const decoded = jsonwebtoken_1.default.verify(refresh_token, config_1.config.jwt.secret);
            if (decoded.type !== 'refresh') {
                res.status(401).json({
                    success: false,
                    error: {
                        message: 'Invalid refresh token.',
                        statusCode: 401,
                    },
                });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const tokenRecord = await db('auth_tokens')
                .where('token', refresh_token)
                .where('user_id', decoded.userId)
                .where('type', 'refresh')
                .where('is_revoked', false)
                .first();
            if (!tokenRecord) {
                res.status(401).json({
                    success: false,
                    error: {
                        message: 'Invalid or expired refresh token.',
                        statusCode: 401,
                    },
                });
                return;
            }
            const user = await db('users')
                .select('id', 'email', 'username', 'display_name', 'role', 'is_verified')
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
            const newAccessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.expiresIn });
            const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await db('auth_tokens')
                .where('id', tokenRecord.id)
                .update({
                token: newAccessToken,
                expires_at: newExpiresAt,
            });
            res.json({
                success: true,
                data: {
                    access_token: newAccessToken,
                    expires_in: 24 * 60 * 60,
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        display_name: user.display_name,
                        role: user.role,
                        is_verified: user.is_verified,
                    },
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Token refresh error:', error);
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                res.status(401).json({
                    success: false,
                    error: {
                        message: 'Refresh token expired.',
                        statusCode: 401,
                    },
                });
                return;
            }
            res.status(500).json({
                success: false,
                error: {
                    message: 'Token refresh failed.',
                    statusCode: 500,
                },
            });
        }
    },
    async logout(req, res) {
        try {
            const authHeader = req.header('Authorization');
            const token = authHeader?.replace('Bearer ', '');
            if (!token || !req.user) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'No active session found.',
                        statusCode: 400,
                    },
                });
                return;
            }
            const db = (0, database_1.getDatabase)();
            await db('auth_tokens')
                .where('token', token)
                .where('user_id', req.user.id)
                .update({ is_revoked: true });
            await db('users')
                .where('id', req.user.id)
                .update({ is_online: false });
            logger_1.logger.info(`User logged out: ${req.user.email}`);
            res.json({
                success: true,
                data: {
                    message: 'Logged out successfully.',
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Logout error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Logout failed.',
                    statusCode: 500,
                },
            });
        }
    },
    async verifyEmail(req, res) {
        try {
            const { token } = req.params;
            res.json({
                success: true,
                data: {
                    message: 'Email verification not yet implemented.',
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Email verification error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Email verification failed.',
                    statusCode: 500,
                },
            });
        }
    },
    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;
            res.json({
                success: true,
                data: {
                    message: 'Password reset not yet implemented.',
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Password reset request error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Password reset request failed.',
                    statusCode: 500,
                },
            });
        }
    },
    async forgotPassword(req, res) {
        return exports.authController.requestPasswordReset(req, res);
    },
    async resetPassword(req, res) {
        try {
            const { token, password } = req.body;
            res.json({
                success: true,
                data: {
                    message: 'Password reset not yet implemented.',
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Password reset error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Password reset failed.',
                    statusCode: 500,
                },
            });
        }
    },
};
//# sourceMappingURL=auth.js.map