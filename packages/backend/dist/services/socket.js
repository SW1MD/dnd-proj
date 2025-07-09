"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = setupSocketHandlers;
const logger_1 = require("../utils/logger");
function setupSocketHandlers(io) {
    logger_1.logger.info('Setting up Socket.IO handlers');
    io.on('connection', (socket) => {
        logger_1.logger.info(`User connected: ${socket.id}`);
        socket.on('authenticate', async (data) => {
            try {
                logger_1.logger.info(`User authenticated: ${socket.id}`);
                socket.emit('authenticated', { success: true });
            }
            catch (error) {
                logger_1.logger.error(`Authentication failed for ${socket.id}:`, error);
                socket.emit('authentication_error', { message: 'Authentication failed' });
            }
        });
        socket.on('join_game', async (data) => {
            try {
                const { gameId, userId } = data;
                socket.join(`game:${gameId}`);
                socket.to(`game:${gameId}`).emit('player_joined', {
                    userId,
                    message: `Player ${userId} joined the game`,
                });
                logger_1.logger.info(`User ${userId} joined game ${gameId}`);
                socket.emit('joined_game', { gameId, success: true });
            }
            catch (error) {
                logger_1.logger.error(`Error joining game:`, error);
                socket.emit('join_game_error', { message: 'Failed to join game' });
            }
        });
        socket.on('leave_game', async (data) => {
            try {
                const { gameId, userId } = data;
                socket.leave(`game:${gameId}`);
                socket.to(`game:${gameId}`).emit('player_left', {
                    userId,
                    message: `Player ${userId} left the game`,
                });
                logger_1.logger.info(`User ${userId} left game ${gameId}`);
                socket.emit('left_game', { gameId, success: true });
            }
            catch (error) {
                logger_1.logger.error(`Error leaving game:`, error);
                socket.emit('leave_game_error', { message: 'Failed to leave game' });
            }
        });
        socket.on('game_action', async (data) => {
            try {
                const { gameId, action, userId } = data;
                io.to(`game:${gameId}`).emit('game_action_broadcast', {
                    action,
                    userId,
                    timestamp: new Date().toISOString(),
                });
                logger_1.logger.info(`Game action from ${userId} in game ${gameId}:`, action);
            }
            catch (error) {
                logger_1.logger.error(`Error handling game action:`, error);
                socket.emit('game_action_error', { message: 'Failed to process action' });
            }
        });
        socket.on('dice_roll', async (data) => {
            try {
                const { gameId, diceType, modifier, description, userId } = data;
                io.to(`game:${gameId}`).emit('dice_roll_result', {
                    userId,
                    diceType,
                    modifier,
                    description,
                    timestamp: new Date().toISOString(),
                });
                logger_1.logger.info(`Dice roll from ${userId} in game ${gameId}: ${diceType}`);
            }
            catch (error) {
                logger_1.logger.error(`Error handling dice roll:`, error);
                socket.emit('dice_roll_error', { message: 'Failed to roll dice' });
            }
        });
        socket.on('chat_message', async (data) => {
            try {
                const { gameId, message, userId, type = 'player' } = data;
                io.to(`game:${gameId}`).emit('chat_message_broadcast', {
                    message,
                    userId,
                    type,
                    timestamp: new Date().toISOString(),
                });
                logger_1.logger.info(`Chat message from ${userId} in game ${gameId}`);
            }
            catch (error) {
                logger_1.logger.error(`Error handling chat message:`, error);
                socket.emit('chat_message_error', { message: 'Failed to send message' });
            }
        });
        socket.on('character_update', async (data) => {
            try {
                const { gameId, characterId, updates, userId } = data;
                socket.to(`game:${gameId}`).emit('character_update_broadcast', {
                    characterId,
                    updates,
                    userId,
                    timestamp: new Date().toISOString(),
                });
                logger_1.logger.info(`Character update from ${userId} in game ${gameId}: ${characterId}`);
            }
            catch (error) {
                logger_1.logger.error(`Error handling character update:`, error);
                socket.emit('character_update_error', { message: 'Failed to update character' });
            }
        });
        socket.on('disconnect', () => {
            logger_1.logger.info(`User disconnected: ${socket.id}`);
        });
        socket.on('error', (error) => {
            logger_1.logger.error(`Socket error for ${socket.id}:`, error);
        });
    });
    logger_1.logger.info('Socket.IO handlers setup complete');
}
exports.default = setupSocketHandlers;
//# sourceMappingURL=socket.js.map