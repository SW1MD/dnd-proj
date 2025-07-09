import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

// Game status types
type GameStatus = 'waiting' | 'active' | 'paused' | 'completed' | 'cancelled';

export const gameController = {
  // Get available games
  async getGames(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const db = getDatabase();
      const games = await db('game_sessions')
        .select('*')
        .where('status', '!=', 'cancelled')
        .orderBy('created_at', 'desc');

      // Get player counts for each game
      const gameWithPlayerCounts = await Promise.all(
        games.map(async (game) => {
          const playerCount = await db('game_players')
            .where('game_id', game.id)
            .count('id as count')
            .first();

          return {
            ...game,
            current_players: playerCount?.['count'] || 0,
            game_state: JSON.parse(game.game_state || '{}'),
            ai_settings: JSON.parse(game.ai_settings || '{}'),
          };
        })
      );

      res.json({
        success: true,
        data: { games: gameWithPlayerCounts },
      });
    } catch (error) {
      logger.error('Get games error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get games.', statusCode: 500 },
      });
    }
  },

  // Create new game
  async createGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const {
        name,
        description,
        max_players = 6,
        is_public = true,
        password,
        ai_settings = {},
        game_state = {},
      } = req.body;

      if (!name) {
        res.status(400).json({ success: false, error: { message: 'Game name is required.', statusCode: 400 } });
        return;
      }

      const gameId = uuidv4();
      const db = getDatabase();

      // Create game session
      await db('game_sessions').insert({
        id: gameId,
        name,
        description: description || null,
        dm_user_id: req.user.id,
        max_players,
        status: 'waiting',
        is_public,
        password_hash: password ? await bcrypt.hash(password, 10) : null,
        game_state: JSON.stringify(game_state),
        ai_settings: JSON.stringify(ai_settings),
      });

      // Add creator as DM to game players (DM doesn't need a character)
      await db('game_players').insert({
        id: uuidv4(),
        game_id: gameId,
        user_id: req.user.id,
        role: 'player', // Using 'player' since 'dm' is not in the enum
        character_id: null, // DMs don't need characters
      });

      const newGame = await db('game_sessions')
        .where('id', gameId)
        .first();

      logger.info(`Game created: ${name} (ID: ${gameId}) by user ${req.user.email}`);

      res.status(201).json({
        success: true,
        data: {
          game: {
            ...newGame,
            game_state: JSON.parse(newGame.game_state || '{}'),
            ai_settings: JSON.parse(newGame.ai_settings || '{}'),
            current_players: 1,
          },
        },
      });
    } catch (error) {
      logger.error('Create game error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to create game.', statusCode: 500 },
      });
    }
  },

  // Get game by ID
  async getGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const db = getDatabase();

      const game = await db('game_sessions')
        .where('id', id)
        .first();

      if (!game) {
        res.status(404).json({ success: false, error: { message: 'Game not found.', statusCode: 404 } });
        return;
      }

      // Get players
      const players = await db('game_players')
        .select('game_players.*', 'users.username', 'users.display_name', 'characters.name as character_name')
        .leftJoin('users', 'game_players.user_id', 'users.id')
        .leftJoin('characters', 'game_players.character_id', 'characters.id')
        .where('game_players.game_id', id);

      // Check if current user is a player
      const isPlayer = req.user ? players.some(player => player.user_id === req.user!.id) : false;
      const isDM = req.user ? game.dm_user_id === req.user.id : false;

      if (!isPlayer && !isDM && !game.is_public) {
        res.status(403).json({ success: false, error: { message: 'Access denied.', statusCode: 403 } });
        return;
      }

      res.json({
        success: true,
        data: {
          game: {
            ...game,
            game_state: JSON.parse(game.game_state || '{}'),
            ai_settings: JSON.parse(game.ai_settings || '{}'),
            players,
            current_players: players.length,
            is_player: isPlayer,
            is_dm: isDM,
          },
        },
      });
    } catch (error) {
      logger.error('Get game error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get game.', statusCode: 500 },
      });
    }
  },

  // Join game
  async joinGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const { character_id, password } = req.body;
      const db = getDatabase();

      const game = await db('game_sessions')
        .where('id', id)
        .first();

      if (!game) {
        res.status(404).json({ success: false, error: { message: 'Game not found.', statusCode: 404 } });
        return;
      }

      // Allow joining waiting and active games, but not completed/cancelled ones
      if (game.status === 'completed' || game.status === 'cancelled') {
        res.status(400).json({ success: false, error: { message: 'Cannot join a completed or cancelled game.', statusCode: 400 } });
        return;
      }

      // Check if already a player
      const existingPlayer = await db('game_players')
        .where('game_id', id)
        .where('user_id', req.user.id)
        .first();

      if (existingPlayer) {
        res.status(400).json({ success: false, error: { message: 'Already joined this game.', statusCode: 400 } });
        return;
      }

      // Check player count
      const playerCount = await db('game_players')
        .where('game_id', id)
        .count('id as count')
        .first();

      if (playerCount && Number(playerCount['count']) >= game.max_players) {
        res.status(400).json({ success: false, error: { message: 'Game is full.', statusCode: 400 } });
        return;
      }

      // Check password if game is private
      if (game.password_hash && password) {
        const isValidPassword = await bcrypt.compare(password, game.password_hash);
        if (!isValidPassword) {
          res.status(401).json({ success: false, error: { message: 'Invalid password.', statusCode: 401 } });
          return;
        }
      } else if (game.password_hash) {
        res.status(401).json({ success: false, error: { message: 'Password required.', statusCode: 401 } });
        return;
      }

      // Character is required for joining as player
      if (!character_id) {
        res.status(400).json({ success: false, error: { message: 'Character selection is required.', statusCode: 400 } });
        return;
      }

      // Verify character ownership
      const character = await db('characters')
        .where('id', character_id)
        .where('user_id', req.user.id)
        .first();

      if (!character) {
        res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
        return;
      }

      // Add player to game
      await db('game_players').insert({
        id: uuidv4(),
        game_id: id,
        user_id: req.user.id,
        role: 'player',
        character_id: character_id,
      });

      logger.info(`Player joined game: ${req.user.email} joined ${game.name} (ID: ${id})`);

      res.json({
        success: true,
        data: {
          message: 'Successfully joined game.',
          game_id: id,
          character_id: character_id,
          game_status: game.status, // Include current game status
        },
      });
    } catch (error) {
      logger.error('Join game error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to join game.', statusCode: 500 },
      });
    }
  },

  // Leave game
  async leaveGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const db = getDatabase();

      const game = await db('game_sessions')
        .where('id', id)
        .first();

      if (!game) {
        res.status(404).json({ success: false, error: { message: 'Game not found.', statusCode: 404 } });
        return;
      }

      // Check if user is the DM
      if (game.dm_user_id === req.user.id) {
        // DMs can leave but we should warn them or handle this differently
        // For now, allow it but log a warning
        logger.warn(`DM is leaving game: ${req.user.email} left ${game.name} (ID: ${id})`);
      }

      // Remove player from game
      const deleted = await db('game_players')
        .where('game_id', id)
        .where('user_id', req.user.id)
        .del();

      if (!deleted) {
        res.status(404).json({ success: false, error: { message: 'You are not a player in this game.', statusCode: 404 } });
        return;
      }

      // If it was an active game and now has no players, maybe pause it
      const remainingPlayerCount = await db('game_players')
        .where('game_id', id)
        .count('id as count')
        .first();

      const playerCount = Number(remainingPlayerCount?.['count']) || 0;
      
      // If no players left and game was active, pause it
      if (playerCount === 0 && game.status === 'active') {
        await db('game_sessions')
          .where('id', id)
          .update({ 
            status: 'paused',
            updated_at: db.fn.now()
          });
        logger.info(`Game paused due to no remaining players: ${game.name} (ID: ${id})`);
      }

      logger.info(`Player left game: ${req.user.email} left ${game.name} (ID: ${id}), ${playerCount} players remaining`);

      res.json({
        success: true,
        data: {
          message: 'Successfully left game.',
          remaining_players: playerCount,
        },
      });
    } catch (error) {
      logger.error('Leave game error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to leave game.', statusCode: 500 },
      });
    }
  },

  // Additional game management methods (stubs)
  async updateGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        error: { message: 'Update game not yet implemented.', statusCode: 501 },
      });
    } catch (error) {
      logger.error('Update game error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to update game.', statusCode: 500 },
      });
    }
  },

  async deleteGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        error: { message: 'Delete game not yet implemented.', statusCode: 501 },
      });
    } catch (error) {
      logger.error('Delete game error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to delete game.', statusCode: 500 },
      });
    }
  },

  async startGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const db = getDatabase();

      const game = await db('game_sessions')
        .where('id', id)
        .first();

      if (!game) {
        res.status(404).json({ success: false, error: { message: 'Game not found.', statusCode: 404 } });
        return;
      }

      // Only the DM can start the game
      if (game.dm_user_id !== req.user.id) {
        res.status(403).json({ success: false, error: { message: 'Only the Dungeon Master can start this game.', statusCode: 403 } });
        return;
      }

      // Can only start games that are waiting or paused
      if (game.status !== 'waiting' && game.status !== 'paused') {
        res.status(400).json({ success: false, error: { message: `Cannot start a ${game.status} game.`, statusCode: 400 } });
        return;
      }

      // Check if there are any players (optional - DM can play solo)
      const playerCount = await db('game_players')
        .where('game_id', id)
        .count('id as count')
        .first();

      const totalPlayers = Number(playerCount?.['count']) || 0;

      // Update game status to active
      await db('game_sessions')
        .where('id', id)
        .update({
          status: 'active',
          updated_at: db.fn.now()
        });

      logger.info(`Game started: ${game.name} (ID: ${id}) by DM ${req.user.email}, ${totalPlayers} players`);

      res.json({
        success: true,
        data: {
          message: 'Game started successfully!',
          game_id: id,
          status: 'active',
          player_count: totalPlayers
        },
      });
    } catch (error) {
      logger.error('Start game error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to start game.', statusCode: 500 },
      });
    }
  },

  async pauseGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        error: { message: 'Pause game not yet implemented.', statusCode: 501 },
      });
    } catch (error) {
      logger.error('Pause game error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to pause game.', statusCode: 500 },
      });
    }
  },

  async resumeGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        error: { message: 'Resume game not yet implemented.', statusCode: 501 },
      });
    } catch (error) {
      logger.error('Resume game error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to resume game.', statusCode: 500 },
      });
    }
  },

  async endGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        error: { message: 'End game not yet implemented.', statusCode: 501 },
      });
    } catch (error) {
      logger.error('End game error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to end game.', statusCode: 500 },
      });
    }
  },

  // Game actions methods (stubs)
  async getActions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        error: { message: 'Get actions not yet implemented.', statusCode: 501 },
      });
    } catch (error) {
      logger.error('Get actions error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get actions.', statusCode: 500 },
      });
    }
  },

  async createAction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        error: { message: 'Create action not yet implemented.', statusCode: 501 },
      });
    } catch (error) {
      logger.error('Create action error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to create action.', statusCode: 500 },
      });
    }
  },

  async updateAction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        error: { message: 'Update action not yet implemented.', statusCode: 501 },
      });
    } catch (error) {
      logger.error('Update action error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to update action.', statusCode: 500 },
      });
    }
  },

  // Game events methods (stubs)
  async getEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        error: { message: 'Get events not yet implemented.', statusCode: 501 },
      });
    } catch (error) {
      logger.error('Get events error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get events.', statusCode: 500 },
      });
    }
  },

  async createEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        error: { message: 'Create event not yet implemented.', statusCode: 501 },
      });
    } catch (error) {
      logger.error('Create event error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to create event.', statusCode: 500 },
      });
    }
  },

  // Dice rolls methods
  async getDiceRolls(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const db = getDatabase();

      // Verify user is part of the game
      const gamePlayer = await db('game_players')
        .where('game_id', id)
        .where('user_id', req.user.id)
        .first();

      if (!gamePlayer) {
        res.status(403).json({ success: false, error: { message: 'You are not part of this game.', statusCode: 403 } });
        return;
      }

      // Get recent dice rolls for this game
      const diceRolls = await db('dice_rolls')
        .select('dice_rolls.*', 'users.username', 'users.display_name', 'characters.name as character_name')
        .leftJoin('users', 'dice_rolls.user_id', 'users.id')
        .leftJoin('characters', 'dice_rolls.character_id', 'characters.id')
        .where('dice_rolls.game_id', id)
        .orderBy('dice_rolls.created_at', 'desc')
        .limit(50);

      const parsedRolls = diceRolls.map(roll => ({
        ...roll,
        dice_config: JSON.parse(roll.dice_config || '{}'),
        results: JSON.parse(roll.results || '[]'),
      }));

      res.json({
        success: true,
        data: {
          dice_rolls: parsedRolls,
        },
      });
    } catch (error) {
      logger.error('Get dice rolls error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get dice rolls.', statusCode: 500 },
      });
    }
  },

  async rollDice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const { dice_type, count = 1, modifier = 0, character_id, roll_type = 'general', game_id } = req.body;
      const db = getDatabase();

      // Get the game ID from either params or body
      const gameId = id || game_id;

      // If we have a game ID, verify user is part of the game
      if (gameId) {
        const gamePlayer = await db('game_players')
          .where('game_id', gameId)
          .where('user_id', req.user.id)
          .first();

        if (!gamePlayer) {
          res.status(403).json({ success: false, error: { message: 'You are not part of this game.', statusCode: 403 } });
          return;
        }
      }

      // Verify character ownership if provided
      if (character_id) {
        const character = await db('characters')
          .where('id', character_id)
          .where('user_id', req.user.id)
          .first();

        if (!character) {
          res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
          return;
        }
      }

      // Validate dice type
      const validDiceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
      if (!validDiceTypes.includes(dice_type)) {
        res.status(400).json({ success: false, error: { message: 'Invalid dice type.', statusCode: 400 } });
        return;
      }

      // Simple dice rolling logic (can be enhanced with the shared dice utilities)
      const sides = parseInt(dice_type.substring(1));
      const results = [];
      let total = 0;

      for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * sides) + 1;
        results.push(roll);
        total += roll;
      }

      const finalTotal = total + modifier;
      const rollId = uuidv4();

      // Store dice roll in database only if we have a game ID
      if (gameId) {
        await db('dice_rolls').insert({
          id: rollId,
          game_id: gameId,
          user_id: req.user.id,
          character_id: character_id || null,
          dice_config: JSON.stringify({
            dice_type,
            count,
            modifier,
            sides,
          }),
          results: JSON.stringify(results),
          total: finalTotal,
          roll_type,
        });

        const diceRoll = await db('dice_rolls')
          .select('dice_rolls.*', 'users.username', 'users.display_name', 'characters.name as character_name')
          .leftJoin('users', 'dice_rolls.user_id', 'users.id')
          .leftJoin('characters', 'dice_rolls.character_id', 'characters.id')
          .where('dice_rolls.id', rollId)
          .first();

        logger.info(`Dice rolled: ${req.user.email} rolled ${count}${dice_type}+${modifier} in game ${gameId}`);

        res.json({
          success: true,
          data: {
            dice_roll: {
              ...diceRoll,
              dice_config: JSON.parse(diceRoll.dice_config),
              results: JSON.parse(diceRoll.results),
            },
            summary: {
              dice_type,
              count,
              modifier,
              individual_rolls: results,
              roll_total: total,
              final_total: finalTotal,
            },
          },
        });
      } else {
        // For standalone dice rolls (not associated with a game)
        logger.info(`Dice rolled: ${req.user.email} rolled ${count}${dice_type}+${modifier} (standalone)`);

        res.json({
          success: true,
          data: {
            summary: {
              dice_type,
              count,
              modifier,
              individual_rolls: results,
              roll_total: total,
              final_total: finalTotal,
            },
          },
        });
      }
    } catch (error) {
      logger.error('Roll dice error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to roll dice.', statusCode: 500 },
      });
    }
  },

  // Chat methods
  async getChatMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const db = getDatabase();

      // Verify user is part of the game
      const gamePlayer = await db('game_players')
        .where('game_id', id)
        .where('user_id', req.user.id)
        .first();

      if (!gamePlayer) {
        res.status(403).json({ success: false, error: { message: 'You are not part of this game.', statusCode: 403 } });
        return;
      }

      // Get chat messages
      const messages = await db('chat_messages')
        .select('chat_messages.*', 'users.username', 'users.display_name')
        .leftJoin('users', 'chat_messages.user_id', 'users.id')
        .where('chat_messages.game_id', id)
        .orderBy('chat_messages.timestamp', 'desc')
        .limit(Number(limit))
        .offset(Number(offset));

      res.json({
        success: true,
        data: {
          messages: messages.reverse(), // Reverse to show oldest first
          has_more: messages.length === Number(limit),
        },
      });
    } catch (error) {
      logger.error('Get chat messages error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get chat messages.', statusCode: 500 },
      });
    }
  },

  async sendChatMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const { message, message_type = 'player' } = req.body;
      const db = getDatabase();

      if (!message || message.trim().length === 0) {
        res.status(400).json({ success: false, error: { message: 'Message cannot be empty.', statusCode: 400 } });
        return;
      }

      // Verify user is part of the game
      const gamePlayer = await db('game_players')
        .where('game_id', id)
        .where('user_id', req.user.id)
        .first();

      if (!gamePlayer) {
        res.status(403).json({ success: false, error: { message: 'You are not part of this game.', statusCode: 403 } });
        return;
      }

      const messageId = uuidv4();

      // Store message in database
      await db('chat_messages').insert({
        id: messageId,
        game_id: id,
        user_id: req.user.id,
        message: message.trim(),
        type: message_type,
      });

      const savedMessage = await db('chat_messages')
        .select('chat_messages.*', 'users.username', 'users.display_name')
        .leftJoin('users', 'chat_messages.user_id', 'users.id')
        .where('chat_messages.id', messageId)
        .first();

      logger.info(`Chat message sent: ${req.user.email} sent message in game ${id}`);

      res.status(201).json({
        success: true,
        data: {
          message: savedMessage,
        },
      });
    } catch (error) {
      logger.error('Send chat message error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to send chat message.', statusCode: 500 },
      });
    }
  },

  async deleteChatMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const { messageId } = req.body;
      const db = getDatabase();

      if (!messageId) {
        res.status(400).json({ success: false, error: { message: 'Message ID is required.', statusCode: 400 } });
        return;
      }

      // Get the message to verify ownership
      const message = await db('chat_messages')
        .where('id', messageId)
        .where('game_id', id)
        .first();

      if (!message) {
        res.status(404).json({ success: false, error: { message: 'Message not found.', statusCode: 404 } });
        return;
      }

      // Check if user owns the message or is the DM
      const game = await db('game_sessions')
        .where('id', id)
        .first();

      const canDelete = message.user_id === req.user.id || game.dm_user_id === req.user.id;

      if (!canDelete) {
        res.status(403).json({ success: false, error: { message: 'You can only delete your own messages.', statusCode: 403 } });
        return;
      }

      // Delete the message
      await db('chat_messages')
        .where('id', messageId)
        .del();

      logger.info(`Chat message deleted: ${req.user.email} deleted message ${messageId} in game ${id}`);

      res.json({
        success: true,
        data: {
          message: 'Message deleted successfully.',
        },
      });
    } catch (error) {
      logger.error('Delete chat message error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to delete chat message.', statusCode: 500 },
      });
    }
  },
}; 