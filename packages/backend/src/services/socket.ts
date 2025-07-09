import { Server } from 'socket.io';
import { logger } from '../utils/logger';

export function setupSocketHandlers(io: Server): void {
  logger.info('Setting up Socket.IO handlers');

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Handle user authentication
    socket.on('authenticate', async (data) => {
      try {
        // TODO: Implement JWT token verification
        logger.info(`User authenticated: ${socket.id}`);
        socket.emit('authenticated', { success: true });
      } catch (error) {
        logger.error(`Authentication failed for ${socket.id}:`, error);
        socket.emit('authentication_error', { message: 'Authentication failed' });
      }
    });

    // Handle joining a game session
    socket.on('join_game', async (data) => {
      try {
        const { gameId, userId } = data;
        
        // TODO: Validate user has access to the game
        socket.join(`game:${gameId}`);
        
        // Notify other players in the game
        socket.to(`game:${gameId}`).emit('player_joined', {
          userId,
          message: `Player ${userId} joined the game`,
        });
        
        logger.info(`User ${userId} joined game ${gameId}`);
        socket.emit('joined_game', { gameId, success: true });
      } catch (error) {
        logger.error(`Error joining game:`, error);
        socket.emit('join_game_error', { message: 'Failed to join game' });
      }
    });

    // Handle leaving a game session
    socket.on('leave_game', async (data) => {
      try {
        const { gameId, userId } = data;
        
        socket.leave(`game:${gameId}`);
        
        // Notify other players in the game
        socket.to(`game:${gameId}`).emit('player_left', {
          userId,
          message: `Player ${userId} left the game`,
        });
        
        logger.info(`User ${userId} left game ${gameId}`);
        socket.emit('left_game', { gameId, success: true });
      } catch (error) {
        logger.error(`Error leaving game:`, error);
        socket.emit('leave_game_error', { message: 'Failed to leave game' });
      }
    });

    // Handle game actions (attacks, spells, movement, etc.)
    socket.on('game_action', async (data) => {
      try {
        const { gameId, action, userId } = data;
        
        // TODO: Validate action and update game state
        
        // Broadcast action to all players in the game
        io.to(`game:${gameId}`).emit('game_action_broadcast', {
          action,
          userId,
          timestamp: new Date().toISOString(),
        });
        
        logger.info(`Game action from ${userId} in game ${gameId}:`, action);
      } catch (error) {
        logger.error(`Error handling game action:`, error);
        socket.emit('game_action_error', { message: 'Failed to process action' });
      }
    });

    // Handle dice rolls
    socket.on('dice_roll', async (data) => {
      try {
        const { gameId, diceType, modifier, description, userId } = data;
        
        // TODO: Implement dice rolling logic using shared utilities
        
        // Broadcast dice roll to all players in the game
        io.to(`game:${gameId}`).emit('dice_roll_result', {
          userId,
          diceType,
          modifier,
          description,
          timestamp: new Date().toISOString(),
        });
        
        logger.info(`Dice roll from ${userId} in game ${gameId}: ${diceType}`);
      } catch (error) {
        logger.error(`Error handling dice roll:`, error);
        socket.emit('dice_roll_error', { message: 'Failed to roll dice' });
      }
    });

    // Handle chat messages
    socket.on('chat_message', async (data) => {
      try {
        const { gameId, message, userId, type = 'player' } = data;
        
        // TODO: Validate message content and user permissions
        
        // Broadcast message to all players in the game
        io.to(`game:${gameId}`).emit('chat_message_broadcast', {
          message,
          userId,
          type, // 'player', 'dm', 'system'
          timestamp: new Date().toISOString(),
        });
        
        logger.info(`Chat message from ${userId} in game ${gameId}`);
      } catch (error) {
        logger.error(`Error handling chat message:`, error);
        socket.emit('chat_message_error', { message: 'Failed to send message' });
      }
    });

    // Handle character updates
    socket.on('character_update', async (data) => {
      try {
        const { gameId, characterId, updates, userId } = data;
        
        // TODO: Validate character ownership and update database
        
        // Broadcast character update to all players in the game
        socket.to(`game:${gameId}`).emit('character_update_broadcast', {
          characterId,
          updates,
          userId,
          timestamp: new Date().toISOString(),
        });
        
        logger.info(`Character update from ${userId} in game ${gameId}: ${characterId}`);
      } catch (error) {
        logger.error(`Error handling character update:`, error);
        socket.emit('character_update_error', { message: 'Failed to update character' });
      }
    });

    // Handle token movement on the map
    socket.on('token_move', async (data) => {
      try {
        const { gameId, tokenId, x, y, userId } = data;
        
        // TODO: Validate token ownership and update game state
        
        // Broadcast token movement to all players in the game
        socket.to(`game:${gameId}`).emit('token_move_broadcast', {
          tokenId,
          x,
          y,
          userId,
          timestamp: new Date().toISOString(),
        });
        
        logger.info(`Token moved by ${userId} in game ${gameId}: ${tokenId} to (${x}, ${y})`);
      } catch (error) {
        logger.error(`Error handling token move:`, error);
        socket.emit('token_move_error', { message: 'Failed to move token' });
      }
    });

    // Handle initiative management
    socket.on('initiative_update', async (data) => {
      try {
        const { gameId, initiative, userId } = data;
        
        // TODO: Validate DM permissions and update initiative order
        
        // Broadcast initiative update to all players in the game
        io.to(`game:${gameId}`).emit('initiative_update_broadcast', {
          initiative,
          userId,
          timestamp: new Date().toISOString(),
        });
        
        logger.info(`Initiative updated by ${userId} in game ${gameId}`);
      } catch (error) {
        logger.error(`Error handling initiative update:`, error);
        socket.emit('initiative_update_error', { message: 'Failed to update initiative' });
      }
    });

    // Handle health/status updates
    socket.on('health_update', async (data) => {
      try {
        const { gameId, characterId, health, maxHealth, userId } = data;
        
        // TODO: Validate character ownership or DM permissions
        
        // Broadcast health update to all players in the game
        socket.to(`game:${gameId}`).emit('health_update_broadcast', {
          characterId,
          health,
          maxHealth,
          userId,
          timestamp: new Date().toISOString(),
        });
        
        logger.info(`Health updated by ${userId} in game ${gameId}: ${characterId}`);
      } catch (error) {
        logger.error(`Error handling health update:`, error);
        socket.emit('health_update_error', { message: 'Failed to update health' });
      }
    });

    // Handle turn management
    socket.on('turn_change', async (data) => {
      try {
        const { gameId, currentTurn, userId } = data;
        
        // TODO: Validate DM permissions
        
        // Broadcast turn change to all players in the game
        io.to(`game:${gameId}`).emit('turn_change_broadcast', {
          currentTurn,
          userId,
          timestamp: new Date().toISOString(),
        });
        
        logger.info(`Turn changed by ${userId} in game ${gameId} to ${currentTurn}`);
      } catch (error) {
        logger.error(`Error handling turn change:`, error);
        socket.emit('turn_change_error', { message: 'Failed to change turn' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('Socket.IO handlers setup complete');
}

export default setupSocketHandlers; 