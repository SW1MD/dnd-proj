import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  // Server Configuration
  port: parseInt(process.env['PORT'] || '3000'),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  corsOrigin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
  
  // Database Configuration
  database: {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    name: process.env['DB_NAME'] || 'dnd_game',
    user: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || 'password',
    ssl: process.env['DB_SSL'] === 'true',
    client: process.env['DB_CLIENT'] || 'sqlite3',
    filename: process.env['DB_FILENAME'] || './data/database.db',
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  },
  
  // OpenAI Configuration
  openai: {
    apiKey: process.env['OPENAI_API_KEY'] || '',
    model: process.env['OPENAI_MODEL'] || 'gpt-4',
    maxTokens: parseInt(process.env['OPENAI_MAX_TOKENS'] || '2000'),
  },
  
  // File Upload Configuration
  upload: {
    directory: process.env['UPLOAD_DIR'] || './uploads',
    maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760'), // 10MB
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
    maxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  },
  
  // Logging
  logging: {
    level: process.env['LOG_LEVEL'] || 'info',
    file: process.env['LOG_FILE'] || './logs/app.log',
  },
  
  // Socket.IO Configuration
  socket: {
    corsOrigin: process.env['SOCKET_CORS_ORIGIN']?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
  },
  
  // Security
  security: {
    bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12'),
    sessionSecret: process.env['SESSION_SECRET'] || 'your-session-secret-key-change-this-in-production',
  },
  
  // Redis Configuration (for future use)
  redis: {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379'),
    password: process.env['REDIS_PASSWORD'] || '',
  },
};

export default config; 