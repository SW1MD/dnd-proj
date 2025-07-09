# D&D AI Game Backend

This is the backend API for the D&D AI Game, providing authentication, game management, real-time communication, and AI integration.

## 🚀 Features

- **Authentication & Authorization**: JWT-based user authentication with role-based access control
- **Real-time Communication**: WebSocket-based multiplayer game sessions using Socket.IO
- **Database Management**: SQLite for development, PostgreSQL for production
- **AI Integration**: OpenAI API integration for DM and map generation
- **Rate Limiting**: Protection against abuse and spam
- **File Upload**: Character avatars and map assets
- **Comprehensive Logging**: Winston-based logging system
- **Error Handling**: Centralized error handling with proper HTTP responses

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Knex.js with SQLite (dev) / PostgreSQL (prod)
- **Real-time**: Socket.IO
- **Authentication**: JWT + bcrypt
- **AI**: OpenAI API
- **Logging**: Winston
- **Validation**: Joi
- **Testing**: Jest

## 📦 Installation

```bash
# Install dependencies
npm install

# or if using yarn
yarn install
```

## ⚙️ Configuration

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:19006

# Database Configuration
DB_CLIENT=sqlite3
DB_FILENAME=./data/database.db

# For PostgreSQL in production:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=dnd_game
# DB_USER=postgres
# DB_PASSWORD=password
# DB_SSL=false

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## 🗄️ Database Setup

The backend uses Knex.js for database management with migrations and seeds.

```bash
# Run migrations
npm run migrate

# Run seeds (development data)
npm run seed

# Rollback migrations
npm run rollback
```

## 🏃‍♂️ Running the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start

# Run tests
npm test
```

## 📁 Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route handlers
├── database/         # Database migrations and seeds
├── middleware/       # Express middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
└── index.ts         # Main entry point
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - User logout

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/friends` - Get user's friends

### Characters
- `GET /api/v1/characters` - Get user's characters
- `POST /api/v1/characters` - Create new character
- `GET /api/v1/characters/:id` - Get character details
- `PUT /api/v1/characters/:id` - Update character
- `DELETE /api/v1/characters/:id` - Delete character

### Games
- `GET /api/v1/games` - Get available games
- `POST /api/v1/games` - Create new game session
- `GET /api/v1/games/:id` - Get game details
- `PUT /api/v1/games/:id` - Update game
- `POST /api/v1/games/:id/join` - Join game
- `POST /api/v1/games/:id/leave` - Leave game

### Maps
- `GET /api/v1/maps` - Get available maps
- `POST /api/v1/maps/generate` - Generate new map with AI
- `GET /api/v1/maps/:id` - Get map details

## 🔄 WebSocket Events

### Connection Events
- `authenticate` - Authenticate user via JWT
- `join_game` - Join a game session
- `leave_game` - Leave a game session

### Game Events
- `game_action` - Player actions (attack, cast spell, move, etc.)
- `dice_roll` - Dice rolling with results
- `chat_message` - In-game chat messages
- `character_update` - Character stat updates

### System Events
- `player_joined` - Player joined notification
- `player_left` - Player left notification
- `game_state_update` - Game state changes

## 🤖 AI Integration

The backend integrates with OpenAI's API for:

1. **AI Dungeon Master**: Generates story content, NPC dialogues, and manages game flow
2. **Map Generation**: Creates dungeon layouts and environments
3. **Content Generation**: Items, quests, and encounters

## 🔒 Security Features

- JWT-based authentication
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet.js security headers
- Input validation with Joi
- SQL injection prevention with parameterized queries

## 📊 Logging

The backend uses Winston for comprehensive logging:

- **Console**: Colored output for development
- **File**: Persistent logs in `logs/app.log`
- **Error**: Separate error logs in `logs/error.log`
- **Request**: HTTP request logging with response times

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker (Future)
```bash
docker build -t dnd-backend .
docker run -p 3000:3000 dnd-backend
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `JWT_SECRET` | JWT signing secret | Required |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `DB_CLIENT` | Database client | `sqlite3` |
| `LOG_LEVEL` | Logging level | `info` |

## 🤝 Contributing

1. Follow TypeScript best practices
2. Write tests for new features
3. Use conventional commit messages
4. Update documentation for API changes

## 📄 License

MIT License - see LICENSE file for details 