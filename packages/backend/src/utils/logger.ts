import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create the logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'dnd-backend' },
  transports: [
    // Write all logs to app.log
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write error logs to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport for development
if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Create a stream object for HTTP request logging
export const httpLogStream = {
  write: (message: string): void => {
    // Remove trailing newline
    logger.info(message.trim());
  },
};

// Utility functions for common logging patterns
export const loggerUtils = {
  // Log user actions
  logUserAction: (userId: string, action: string, details?: any) => {
    logger.info('User action', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  // Log API requests
  logApiRequest: (method: string, url: string, userId?: string, statusCode?: number, responseTime?: number) => {
    logger.info('API request', {
      method,
      url,
      userId,
      statusCode,
      responseTime,
      timestamp: new Date().toISOString(),
    });
  },

  // Log database operations
  logDatabaseOperation: (operation: string, table: string, success: boolean, error?: any) => {
    const level = success ? 'info' : 'error';
    logger[level]('Database operation', {
      operation,
      table,
      success,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
    });
  },

  // Log authentication events
  logAuthEvent: (event: string, userId?: string, email?: string, success: boolean = true, error?: any) => {
    const level = success ? 'info' : 'warn';
    logger[level]('Authentication event', {
      event,
      userId,
      email,
      success,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
    });
  },

  // Log WebSocket events
  logSocketEvent: (event: string, socketId: string, userId?: string, data?: any) => {
    logger.info('Socket event', {
      event,
      socketId,
      userId,
      data,
      timestamp: new Date().toISOString(),
    });
  },

  // Log performance metrics
  logPerformance: (operation: string, duration: number, details?: any) => {
    logger.info('Performance metric', {
      operation,
      duration,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  // Log security events
  logSecurityEvent: (event: string, severity: 'low' | 'medium' | 'high', details: any) => {
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    logger[level]('Security event', {
      event,
      severity,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};

// Handle uncaught exceptions and rejections
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'exceptions.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
);

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason,
    timestamp: new Date().toISOString(),
  });
});

export default logger; 