import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { config } from '../config';
import { logger } from '../utils/logger';

// Create rate limiter instance
const rateLimiter = new RateLimiterMemory({
  points: config.rateLimit.maxRequests, // Number of requests
  duration: config.rateLimit.windowMs / 1000, // Per duration in seconds
  blockDuration: 60, // Block for 60 seconds if limit exceeded
});

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Use IP address as key
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    
    await rateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    // Rate limit exceeded
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
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
      'X-RateLimit-Limit': config.rateLimit.maxRequests,
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

// Special rate limiter for authentication endpoints
const authRateLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 900, // Per 15 minutes
  blockDuration: 900, // Block for 15 minutes
});

export const authRateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    await authRateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
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

export { rateLimiterMiddleware as rateLimiter };
export default rateLimiterMiddleware; 