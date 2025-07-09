const path = require('path');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, 'data/database.db'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'dist/database/migrations'),
      extension: 'js',
    },
    seeds: {
      directory: path.join(__dirname, 'dist/database/seeds'),
      extension: 'js',
    },
  },
  
  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'dnd_game',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: path.join(__dirname, 'dist/database/migrations'),
      extension: 'js',
    },
    seeds: {
      directory: path.join(__dirname, 'dist/database/seeds'),
      extension: 'js',
    },
  },
  
  test: {
    client: 'sqlite3',
    connection: ':memory:',
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'dist/database/migrations'),
      extension: 'js',
    },
    seeds: {
      directory: path.join(__dirname, 'dist/database/seeds'),
      extension: 'js',
    },
  },
}; 