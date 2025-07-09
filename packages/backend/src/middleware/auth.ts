import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getDatabase } from '../database';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
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

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // Check if token exists in database (for logout functionality)
    const db = getDatabase();
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

    // Get user details
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

    // Skip email verification for development
    // if (!user.is_verified) {
    //   res.status(401).json({
    //     success: false,
    //     error: {
    //       message: 'Please verify your email address.',
    //       statusCode: 401,
    //     },
    //   });
    //   return;
    // }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Token expired.',
          statusCode: 401,
        },
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
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

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(['admin'])(req, res, next);
}

export function requireDM(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(['dm', 'admin'])(req, res, next);
} 