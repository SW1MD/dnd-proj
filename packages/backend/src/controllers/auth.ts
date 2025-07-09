import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

interface RegisterRequest {
  email: string;
  username: string;
  display_name: string;
  password: string;
}

interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
}

interface RefreshTokenRequest {
  refresh_token: string;
}

export const authController = {
  // Register a new user
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, display_name, password }: RegisterRequest = req.body;

      // Basic validation
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

      // Email validation
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

      // Password validation
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

      const db = getDatabase();

      // Check if user already exists
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

      // Hash password
      const saltRounds = config.security.bcryptRounds;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = uuidv4();
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

      logger.info(`New user registered: ${email}`);

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
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Registration failed.',
          statusCode: 500,
        },
      });
    }
  },

  // Login user
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, password }: LoginRequest = req.body;

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

      const db = getDatabase();

      // Find user by email or username
      let query = db('users');
      if (email) {
        query = query.where('email', email.toLowerCase());
      } else if (username) {
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

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
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

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
      );

      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
      );

      // Store tokens in database (separate entries for access and refresh tokens)
      const tokenId = uuidv4();
      const refreshTokenId = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

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

      // Update last login
      await db('users')
        .where('id', user.id)
        .update({ 
          last_login_at: new Date(),
          is_online: true,
        });

      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 24 * 60 * 60, // 24 hours in seconds
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
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Login failed.',
          statusCode: 500,
        },
      });
    }
  },

  // Refresh access token
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refresh_token }: RefreshTokenRequest = req.body;

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

      // Verify refresh token
      const decoded = jwt.verify(refresh_token, config.jwt.secret) as any;

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

      const db = getDatabase();

      // Check if refresh token exists and is active
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

      // Get user
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

      // Generate new access token
      const newAccessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
      );

      // Update token in database
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
    } catch (error) {
      logger.error('Token refresh error:', error);
      
      if (error instanceof jwt.TokenExpiredError) {
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

  // Logout user
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const db = getDatabase();

      // Deactivate token
      await db('auth_tokens')
        .where('token', token)
        .where('user_id', req.user.id)
        .update({ is_revoked: true });

      // Update user online status
      await db('users')
        .where('id', req.user.id)
        .update({ is_online: false });

      logger.info(`User logged out: ${req.user.email}`);

      res.json({
        success: true,
        data: {
          message: 'Logged out successfully.',
        },
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Logout failed.',
          statusCode: 500,
        },
      });
    }
  },

  // Verify email (placeholder for email verification)
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      // TODO: Implement email verification logic
      res.json({
        success: true,
        data: {
          message: 'Email verification not yet implemented.',
        },
      });
    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Email verification failed.',
          statusCode: 500,
        },
      });
    }
  },

  // Request password reset (placeholder)
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      // TODO: Implement password reset logic
      res.json({
        success: true,
        data: {
          message: 'Password reset not yet implemented.',
        },
      });
    } catch (error) {
      logger.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Password reset request failed.',
          statusCode: 500,
        },
      });
    }
  },

  // Forgot password (alias for requestPasswordReset)
  async forgotPassword(req: Request, res: Response): Promise<void> {
    return authController.requestPasswordReset(req, res);
  },

  // Reset password (placeholder)
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      // TODO: Implement password reset logic
      res.json({
        success: true,
        data: {
          message: 'Password reset not yet implemented.',
        },
      });
    } catch (error) {
      logger.error('Password reset error:', error);
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