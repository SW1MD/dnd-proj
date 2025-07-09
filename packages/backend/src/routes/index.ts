import { Express } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import characterRoutes from './characters';
import gameRoutes from './games';
import mapRoutes from './maps';
import { notFoundHandler } from '../middleware/errorHandler';

export function setupRoutes(app: Express): void {
  // API base path
  const apiVersion = '/api/v1';

  // Health check (already defined in main server)
  // app.get('/health', healthCheck);

  // Authentication routes
  app.use(`${apiVersion}/auth`, authRoutes);

  // User routes
  app.use(`${apiVersion}/users`, userRoutes);

  // Character routes
  app.use(`${apiVersion}/characters`, characterRoutes);

  // Game session routes
  app.use(`${apiVersion}/games`, gameRoutes);

  // Map routes
  app.use(`${apiVersion}/maps`, mapRoutes);

  // 404 handler for undefined routes
  app.use('*', notFoundHandler);
}

export default setupRoutes; 