import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode: err.statusCode || 500,
  });

  // Set default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Don't leak error details in production
  if (config.nodeEnv === 'production' && !err.isOperational) {
    message = 'Something went wrong';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    },
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      statusCode: 404,
    },
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 