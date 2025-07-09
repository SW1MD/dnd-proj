import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';

import { config } from './config';
import { initializeDatabase } from './database';
import { setupRoutes } from './routes';
import { setupSocketHandlers } from './services/socket';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiterMiddleware } from './middleware/rateLimiter';

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Create Express app
    const app = express();
    const server = createServer(app);
    
    // Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: config.socket.corsOrigin,
        methods: ['GET', 'POST'],
      },
    });
    
    // Security middleware - configured for development
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          scriptSrcAttr: ["'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    }));
    app.use(cors({
      origin: config.corsOrigin,
      credentials: true,
    }));
    
    // Compression middleware
    app.use(compression());
    
    // Logging middleware
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    }));
    
    // Rate limiting middleware
    app.use(rateLimiterMiddleware);
    
    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Serve static files
    app.use('/uploads', express.static(uploadDir));
    
    // Serve frontend at root path
    app.get('/', (req, res) => {
      const frontendPath = path.join(__dirname, '../../desktop/index.html');
      if (fs.existsSync(frontendPath)) {
        res.sendFile(frontendPath);
      } else {
        res.status(404).json({ 
          error: 'Frontend not found',
          message: 'The test frontend is not available. Please check the desktop package.',
        });
      }
    });
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        uptime: process.uptime(),
      });
    });
    
    // Setup API routes
    setupRoutes(app);
    
    // Setup Socket.IO handlers
    setupSocketHandlers(io);
    
    // Error handling middleware (should be last)
    app.use(errorHandler);
    
    // Start server
    server.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📁 Environment: ${config.nodeEnv}`);
      logger.info(`🎲 D&D AI Game Backend started successfully`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 