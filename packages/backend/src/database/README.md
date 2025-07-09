# Database Schema Documentation

This document describes the database schema for the D&D AI Game backend.

## 🗄️ Database Overview

The database is designed to support a multiplayer D&D game with AI integration. It uses PostgreSQL for production and SQLite for development, managed through Knex.js migrations.

## 📋 Tables

### 1. Users (`users`)
Core user account information and preferences.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | VARCHAR(255) | Unique email address |
| `username` | VARCHAR(50) | Unique username |
| `display_name` | VARCHAR(100) | Display name |
| `password_hash` | VARCHAR(255) | Bcrypt hashed password |
| `role` | ENUM | User role: 'player', 'dm', 'admin' |
| `is_verified` | BOOLEAN | Email verification status |
| `is_online` | BOOLEAN | Online status |
| `last_login_at` | TIMESTAMP | Last login timestamp |
| `preferences` | JSON | User preferences object |
| `stats` | JSON | User statistics object |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

### 2. Characters (`characters`)
D&D character sheets with stats, inventory, and spells.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users |
| `name` | VARCHAR(100) | Character name |
| `class` | ENUM | D&D class (barbarian, bard, etc.) |
| `race` | ENUM | D&D race (human, elf, etc.) |
| `level` | INTEGER | Character level (1-20) |
| `experience` | INTEGER | Experience points |
| `hp_current` | INTEGER | Current hit points |
| `hp_maximum` | INTEGER | Maximum hit points |
| `hp_temporary` | INTEGER | Temporary hit points |
| `armor_class` | INTEGER | Armor class |
| `proficiency_bonus` | INTEGER | Proficiency bonus |
| `speed` | INTEGER | Movement speed |
| `strength` | INTEGER | Strength ability score |
| `dexterity` | INTEGER | Dexterity ability score |
| `constitution` | INTEGER | Constitution ability score |
| `intelligence` | INTEGER | Intelligence ability score |
| `wisdom` | INTEGER | Wisdom ability score |
| `charisma` | INTEGER | Charisma ability score |
| `skills` | JSON | Skill proficiencies and bonuses |
| `inventory` | JSON | Array of items |
| `spells` | JSON | Array of spells |
| `background` | VARCHAR(100) | Character background |
| `alignment` | VARCHAR(50) | Character alignment |
| `personality_traits` | TEXT | Personality traits |
| `ideals` | TEXT | Character ideals |
| `bonds` | TEXT | Character bonds |
| `flaws` | TEXT | Character flaws |
| `avatar_url` | VARCHAR | Character avatar image URL |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

### 3. Game Sessions (`game_sessions`)
Active and completed game sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(200) | Session name |
| `description` | TEXT | Session description |
| `dm_user_id` | UUID | Foreign key to DM user |
| `max_players` | INTEGER | Maximum number of players |
| `status` | ENUM | Session status: 'waiting', 'active', 'paused', 'completed' |
| `current_map_id` | UUID | Foreign key to current map |
| `game_state` | JSON | Current game state |
| `is_public` | BOOLEAN | Whether session is public |
| `password_hash` | VARCHAR | Password for private sessions |
| `session_duration` | INTEGER | Duration in minutes |
| `ai_settings` | JSON | AI configuration |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |
| `last_active_at` | TIMESTAMP | Last activity timestamp |

### 4. Game Players (`game_players`)
Junction table for players in game sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `game_id` | UUID | Foreign key to game sessions |
| `user_id` | UUID | Foreign key to users |
| `character_id` | UUID | Foreign key to characters |
| `is_online` | BOOLEAN | Player online status |
| `joined_at` | TIMESTAMP | When player joined |
| `last_active_at` | TIMESTAMP | Last activity timestamp |
| `role` | ENUM | Player role: 'player', 'co_dm', 'observer' |
| `game_settings` | JSON | Player-specific settings |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

### 5. Maps (`maps`)
Game maps and dungeons with tile data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(200) | Map name |
| `description` | TEXT | Map description |
| `type` | ENUM | Map type: 'dungeon', 'overworld', 'building', etc. |
| `width` | INTEGER | Map width in tiles |
| `height` | INTEGER | Map height in tiles |
| `theme` | VARCHAR(100) | Map theme |
| `difficulty` | ENUM | Difficulty: 'easy', 'medium', 'hard', 'deadly' |
| `recommended_level` | INTEGER | Recommended player level |
| `tiles` | JSON | 2D array of tile data |
| `rooms` | JSON | Array of room objects |
| `npcs` | JSON | Array of NPC objects |
| `starting_position` | JSON | Starting position coordinates |
| `ai_generation_prompt` | TEXT | AI generation prompt |
| `ai_metadata` | JSON | AI generation metadata |
| `is_public` | BOOLEAN | Whether map is public |
| `created_by` | UUID | Foreign key to creator |
| `thumbnail_url` | VARCHAR | Thumbnail image URL |
| `full_image_url` | VARCHAR | Full image URL |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

### 6. Game Actions (`game_actions`)
Player actions within game sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `game_id` | UUID | Foreign key to game sessions |
| `player_id` | UUID | Foreign key to game players |
| `type` | ENUM | Action type: 'attack', 'cast_spell', 'move', etc. |
| `description` | VARCHAR(500) | Action description |
| `data` | JSON | Action-specific data |
| `resolved` | BOOLEAN | Whether action is resolved |
| `result` | JSON | Action result |
| `timestamp` | TIMESTAMP | Action timestamp |
| `ai_processed` | BOOLEAN | Whether AI has processed |
| `ai_response` | TEXT | AI response to action |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

### 7. Game Events (`game_events`)
Significant events in game sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `game_id` | UUID | Foreign key to game sessions |
| `type` | ENUM | Event type: 'combat_start', 'level_up', etc. |
| `description` | VARCHAR(500) | Event description |
| `data` | JSON | Event-specific data |
| `timestamp` | TIMESTAMP | Event timestamp |
| `players_involved` | JSON | Array of involved player IDs |
| `is_public` | BOOLEAN | Event visibility |
| `visible_to_players` | JSON | Specific player visibility |
| `ai_narrative` | TEXT | AI-generated narrative |
| `ai_metadata` | JSON | AI metadata |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

### 8. Dice Rolls (`dice_rolls`)
All dice rolls in game sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `game_id` | UUID | Foreign key to game sessions |
| `player_id` | UUID | Foreign key to game players |
| `type` | VARCHAR(50) | Dice type (e.g., "d20", "2d6") |
| `result` | INTEGER | Final result |
| `rolls` | JSON | Array of individual rolls |
| `modifier` | INTEGER | Applied modifier |
| `description` | VARCHAR(200) | Roll description |
| `timestamp` | TIMESTAMP | Roll timestamp |
| `context` | VARCHAR(100) | Roll context |
| `related_action_id` | UUID | Related action ID |
| `is_critical` | BOOLEAN | Whether roll was critical |
| `has_advantage` | BOOLEAN | Whether roll had advantage |
| `has_disadvantage` | BOOLEAN | Whether roll had disadvantage |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

### 9. Chat Messages (`chat_messages`)
In-game chat messages.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `game_id` | UUID | Foreign key to game sessions |
| `user_id` | UUID | Foreign key to users |
| `message` | TEXT | Message content |
| `type` | ENUM | Message type: 'player', 'dm', 'system', etc. |
| `timestamp` | TIMESTAMP | Message timestamp |
| `metadata` | JSON | Message metadata |
| `is_deleted` | BOOLEAN | Whether message is deleted |
| `deleted_at` | TIMESTAMP | Deletion timestamp |
| `whisper_to_user_id` | UUID | Whisper target user |
| `is_private` | BOOLEAN | Whether message is private |
| `trigger_ai_response` | BOOLEAN | Whether to trigger AI |
| `ai_response` | TEXT | AI response |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

### 10. Auth Tokens (`auth_tokens`)
Authentication and refresh tokens.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users |
| `token` | VARCHAR(500) | Token string |
| `type` | ENUM | Token type: 'access', 'refresh', etc. |
| `expires_at` | TIMESTAMP | Token expiration |
| `is_revoked` | BOOLEAN | Whether token is revoked |
| `revoked_at` | TIMESTAMP | Revocation timestamp |
| `device_info` | VARCHAR(500) | Device information |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

## 🔗 Relationships

### Primary Relationships
- **Users** → **Characters** (1:N)
- **Users** → **Game Sessions** (1:N as DM)
- **Game Sessions** → **Game Players** (1:N)
- **Game Sessions** → **Maps** (N:1)
- **Game Sessions** → **Game Actions** (1:N)
- **Game Sessions** → **Game Events** (1:N)
- **Game Sessions** → **Dice Rolls** (1:N)
- **Game Sessions** → **Chat Messages** (1:N)

### Junction Tables
- **Game Players** connects Users, Characters, and Game Sessions
- **Auth Tokens** connects Users with authentication tokens

## 🎯 Key Features

### 1. **UUID Primary Keys**
All tables use UUID primary keys for better distribution and security.

### 2. **JSON Columns**
Flexible JSON columns store complex data structures:
- User preferences and statistics
- Character skills, inventory, and spells
- Game state and settings
- Action and event data

### 3. **Soft Deletes**
Chat messages support soft deletion with `is_deleted` flag.

### 4. **Timestamps**
All tables include `created_at` and `updated_at` timestamps.

### 5. **Indexes**
Strategic indexes on frequently queried columns for performance.

### 6. **Enum Constraints**
Enum columns ensure data integrity for status fields.

## 🚀 Usage

### Running Migrations
```bash
# Run all migrations
npm run migrate

# Rollback last migration
npm run rollback

# Run seeds (development data)
npm run seed
```

### Development Data
The seed file creates:
- 4 demo users (admin, DM, 2 players)
- 2 demo characters (Strider, Gandalf)
- 1 demo map (Goblin Cave)
- 1 demo game session

### Database Clients
- **Development**: SQLite (file-based)
- **Production**: PostgreSQL
- **Testing**: SQLite (in-memory)

## 🔧 Maintenance

### Performance Considerations
- Use indexes on frequently queried columns
- JSON columns should be used judiciously
- Consider pagination for large result sets
- Monitor query performance in production

### Backup Strategy
- Regular automated backups of production database
- Point-in-time recovery capabilities
- Test restore procedures regularly 