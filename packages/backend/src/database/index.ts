import knex, { Knex } from 'knex';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { logger } from '../utils/logger';

let db: Knex | undefined;

export async function initializeDatabase(): Promise<void> {
  try {
    // Create data directory if using SQLite
    if (config.database.client === 'sqlite3') {
      const dataDir = path.join(__dirname, '../../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    }

    // Database configuration
    const dbConfig: Knex.Config = {
      client: config.database.client,
      connection: config.database.client === 'sqlite3' 
        ? { filename: config.database.filename }
        : {
            host: config.database.host,
            port: config.database.port,
            database: config.database.name,
            user: config.database.user,
            password: config.database.password,
            ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
          },
      useNullAsDefault: config.database.client === 'sqlite3',
      migrations: {
        directory: path.join(__dirname, './migrations'),
        extension: 'ts',
      },
      seeds: {
        directory: path.join(__dirname, './seeds'),
        extension: 'ts',
      },
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 60000,
        idleTimeoutMillis: 30000,
      },
    };

    // Initialize Knex instance
    db = knex(dbConfig);

    // Test database connection
    await db.raw('SELECT 1');
    logger.info('✅ Database connected successfully');

    // Run migrations
    await db.migrate.latest();
    logger.info('✅ Database migrations completed');

    // Only run seeds if database is empty (no users exist)
    if (config.nodeEnv === 'development') {
      const userCount = await db('users').count('id as count').first();
      const hasUsers = userCount && parseInt(userCount['count'] as string) > 0;
      
      if (!hasUsers) {
        await db.seed.run();
        logger.info('✅ Database seeded successfully');
      } else {
        logger.info('✅ Database already has data, skipping seeds');
      }
    }

  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export function getDatabase(): Knex {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
    logger.info('✅ Database connection closed');
  }
}

// Export removed - use getDatabase() function instead 