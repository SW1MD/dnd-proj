"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = exports.authRateLimiterMiddleware = exports.rateLimiterMiddleware = void 0;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const rateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    points: config_1.config.rateLimit.maxRequests,
    duration: config_1.config.rateLimit.windowMs / 1000,
    blockDuration: 60,
});
const rateLimiterMiddleware = async (req, res, next) => {
    try {
        const key = req.ip || req.connection.remoteAddress || 'unknown';
        await rateLimiter.consume(key);
        next();
    }
    catch (rejRes) {
        logger_1.logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
            userAgent: req.get('User-Agent'),
        });
        const remainingPoints = rejRes.remainingPoints || 0;
        const msBeforeNext = rejRes.msBeforeNext || 0;
        const totalHits = rejRes.totalHits || 0;
        res.set({
            'Retry-After': Math.round(msBeforeNext / 1000) || 1,
            'X-RateLimit-Limit': config_1.config.rateLimit.maxRequests,
            'X-RateLimit-Remaining': remainingPoints,
            'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext).toISOString(),
        });
        res.status(429).json({
            success: false,
            error: {
                message: 'Too many requests, please try again later.',
                statusCode: 429,
                retryAfter: Math.round(msBeforeNext / 1000) || 1,
            },
        });
    }
};
exports.rateLimiterMiddleware = rateLimiterMiddleware;
exports.rateLimiter = exports.rateLimiterMiddleware;
const authRateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    points: 5,
    duration: 900,
    blockDuration: 900,
});
const authRateLimiterMiddleware = async (req, res, next) => {
    try {
        const key = req.ip || req.connection.remoteAddress || 'unknown';
        await authRateLimiter.consume(key);
        next();
    }
    catch (rejRes) {
        logger_1.logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
        });
        const msBeforeNext = rejRes.msBeforeNext || 0;
        res.set({
            'Retry-After': Math.round(msBeforeNext / 1000) || 1,
        });
        res.status(429).json({
            success: false,
            error: {
                message: 'Too many authentication attempts, please try again later.',
                statusCode: 429,
                retryAfter: Math.round(msBeforeNext / 1000) || 1,
            },
        });
    }
};
exports.authRateLimiterMiddleware = authRateLimiterMiddleware;
exports.default = exports.rateLimiterMiddleware;
//# sourceMappingURL=rateLimiter.js.map