"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameController = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../database");
const logger_1 = require("../utils/logger");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.gameController = {
    async getGames(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const games = await db('game_sessions')
                .select('*')
                .where('status', '!=', 'cancelled')
                .orderBy('created_at', 'desc');
            const gameWithPlayerCounts = await Promise.all(games.map(async (game) => {
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
            }));
            res.json({
                success: true,
                data: { games: gameWithPlayerCounts },
            });
        }
        catch (error) {
            logger_1.logger.error('Get games error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to get games.', statusCode: 500 },
            });
        }
    },
    async createGame(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { name, description, max_players = 6, is_public = true, password, ai_settings = {}, game_state = {}, } = req.body;
            if (!name) {
                res.status(400).json({ success: false, error: { message: 'Game name is required.', statusCode: 400 } });
                return;
            }
            const gameId = (0, uuid_1.v4)();
            const db = (0, database_1.getDatabase)();
            await db('game_sessions').insert({
                id: gameId,
                name,
                description: description || null,
                dm_user_id: req.user.id,
                max_players,
                status: 'waiting',
                is_public,
                password_hash: password ? await bcryptjs_1.default.hash(password, 10) : null,
                game_state: JSON.stringify(game_state),
                ai_settings: JSON.stringify(ai_settings),
            });
            await db('game_players').insert({
                id: (0, uuid_1.v4)(),
                game_id: gameId,
                user_id: req.user.id,
                role: 'player',
                character_id: null,
            });
            const newGame = await db('game_sessions')
                .where('id', gameId)
                .first();
            logger_1.logger.info(`Game created: ${name} (ID: ${gameId}) by user ${req.user.email}`);
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
        }
        catch (error) {
            logger_1.logger.error('Create game error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to create game.', statusCode: 500 },
            });
        }
    },
    async getGame(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { id } = req.params;
            const db = (0, database_1.getDatabase)();
            const game = await db('game_sessions')
                .where('id', id)
                .first();
            if (!game) {
                res.status(404).json({ success: false, error: { message: 'Game not found.', statusCode: 404 } });
                return;
            }
            const players = await db('game_players')
                .select('game_players.*', 'users.username', 'users.display_name', 'characters.name as character_name')
                .leftJoin('users', 'game_players.user_id', 'users.id')
                .leftJoin('characters', 'game_players.character_id', 'characters.id')
                .where('game_players.game_id', id);
            const isPlayer = req.user ? players.some(player => player.user_id === req.user.id) : false;
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
        }
        catch (error) {
            logger_1.logger.error('Get game error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to get game.', statusCode: 500 },
            });
        }
    },
    async joinGame(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { id } = req.params;
            const { character_id, password } = req.body;
            const db = (0, database_1.getDatabase)();
            const game = await db('game_sessions')
                .where('id', id)
                .first();
            if (!game) {
                res.status(404).json({ success: false, error: { message: 'Game not found.', statusCode: 404 } });
                return;
            }
            if (game.status === 'completed' || game.status === 'cancelled') {
                res.status(400).json({ success: false, error: { message: 'Cannot join a completed or cancelled game.', statusCode: 400 } });
                return;
            }
            const existingPlayer = await db('game_players')
                .where('game_id', id)
                .where('user_id', req.user.id)
                .first();
            if (existingPlayer) {
                res.status(400).json({ success: false, error: { message: 'Already joined this game.', statusCode: 400 } });
                return;
            }
            const playerCount = await db('game_players')
                .where('game_id', id)
                .count('id as count')
                .first();
            if (playerCount && Number(playerCount['count']) >= game.max_players) {
                res.status(400).json({ success: false, error: { message: 'Game is full.', statusCode: 400 } });
                return;
            }
            if (game.password_hash && password) {
                const isValidPassword = await bcryptjs_1.default.compare(password, game.password_hash);
                if (!isValidPassword) {
                    res.status(401).json({ success: false, error: { message: 'Invalid password.', statusCode: 401 } });
                    return;
                }
            }
            else if (game.password_hash) {
                res.status(401).json({ success: false, error: { message: 'Password required.', statusCode: 401 } });
                return;
            }
            if (!character_id) {
                res.status(400).json({ success: false, error: { message: 'Character selection is required.', statusCode: 400 } });
                return;
            }
            const character = await db('characters')
                .where('id', character_id)
                .where('user_id', req.user.id)
                .first();
            if (!character) {
                res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
                return;
            }
            await db('game_players').insert({
                id: (0, uuid_1.v4)(),
                game_id: id,
                user_id: req.user.id,
                role: 'player',
                character_id: character_id,
            });
            logger_1.logger.info(`Player joined game: ${req.user.email} joined ${game.name} (ID: ${id})`);
            res.json({
                success: true,
                data: {
                    message: 'Successfully joined game.',
                    game_id: id,
                    character_id: character_id,
                    game_status: game.status,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Join game error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to join game.', statusCode: 500 },
            });
        }
    },
    async leaveGame(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { id } = req.params;
            const db = (0, database_1.getDatabase)();
            const game = await db('game_sessions')
                .where('id', id)
                .first();
            if (!game) {
                res.status(404).json({ success: false, error: { message: 'Game not found.', statusCode: 404 } });
                return;
            }
            if (game.dm_user_id === req.user.id) {
                logger_1.logger.warn(`DM is leaving game: ${req.user.email} left ${game.name} (ID: ${id})`);
            }
            const deleted = await db('game_players')
                .where('game_id', id)
                .where('user_id', req.user.id)
                .del();
            if (!deleted) {
                res.status(404).json({ success: false, error: { message: 'You are not a player in this game.', statusCode: 404 } });
                return;
            }
            const remainingPlayerCount = await db('game_players')
                .where('game_id', id)
                .count('id as count')
                .first();
            const playerCount = Number(remainingPlayerCount?.['count']) || 0;
            if (playerCount === 0 && game.status === 'active') {
                await db('game_sessions')
                    .where('id', id)
                    .update({
                    status: 'paused',
                    updated_at: db.fn.now()
                });
                logger_1.logger.info(`Game paused due to no remaining players: ${game.name} (ID: ${id})`);
            }
            logger_1.logger.info(`Player left game: ${req.user.email} left ${game.name} (ID: ${id}), ${playerCount} players remaining`);
            res.json({
                success: true,
                data: {
                    message: 'Successfully left game.',
                    remaining_players: playerCount,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Leave game error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to leave game.', statusCode: 500 },
            });
        }
    },
    async updateGame(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Update game not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Update game error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to update game.', statusCode: 500 },
            });
        }
    },
    async deleteGame(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Delete game not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Delete game error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to delete game.', statusCode: 500 },
            });
        }
    },
    async startGame(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { id } = req.params;
            const db = (0, database_1.getDatabase)();
            const game = await db('game_sessions')
                .where('id', id)
                .first();
            if (!game) {
                res.status(404).json({ success: false, error: { message: 'Game not found.', statusCode: 404 } });
                return;
            }
            if (game.dm_user_id !== req.user.id) {
                res.status(403).json({ success: false, error: { message: 'Only the Dungeon Master can start this game.', statusCode: 403 } });
                return;
            }
            if (game.status !== 'waiting' && game.status !== 'paused') {
                res.status(400).json({ success: false, error: { message: `Cannot start a ${game.status} game.`, statusCode: 400 } });
                return;
            }
            const playerCount = await db('game_players')
                .where('game_id', id)
                .count('id as count')
                .first();
            const totalPlayers = Number(playerCount?.['count']) || 0;
            await db('game_sessions')
                .where('id', id)
                .update({
                status: 'active',
                updated_at: db.fn.now()
            });
            logger_1.logger.info(`Game started: ${game.name} (ID: ${id}) by DM ${req.user.email}, ${totalPlayers} players`);
            res.json({
                success: true,
                data: {
                    message: 'Game started successfully!',
                    game_id: id,
                    status: 'active',
                    player_count: totalPlayers
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Start game error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to start game.', statusCode: 500 },
            });
        }
    },
    async pauseGame(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Pause game not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Pause game error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to pause game.', statusCode: 500 },
            });
        }
    },
    async resumeGame(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Resume game not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Resume game error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to resume game.', statusCode: 500 },
            });
        }
    },
    async endGame(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'End game not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('End game error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to end game.', statusCode: 500 },
            });
        }
    },
    async getActions(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Get actions not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Get actions error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to get actions.', statusCode: 500 },
            });
        }
    },
    async createAction(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Create action not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Create action error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to create action.', statusCode: 500 },
            });
        }
    },
    async updateAction(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Update action not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Update action error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to update action.', statusCode: 500 },
            });
        }
    },
    async getEvents(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Get events not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Get events error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to get events.', statusCode: 500 },
            });
        }
    },
    async createEvent(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Create event not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Create event error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to create event.', statusCode: 500 },
            });
        }
    },
    async getDiceRolls(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { id } = req.params;
            const db = (0, database_1.getDatabase)();
            const gamePlayer = await db('game_players')
                .where('game_id', id)
                .where('user_id', req.user.id)
                .first();
            if (!gamePlayer) {
                res.status(403).json({ success: false, error: { message: 'You are not part of this game.', statusCode: 403 } });
                return;
            }
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
        }
        catch (error) {
            logger_1.logger.error('Get dice rolls error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to get dice rolls.', statusCode: 500 },
            });
        }
    },
    async rollDice(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { id } = req.params;
            const { dice_type, count = 1, modifier = 0, character_id, roll_type = 'general', game_id } = req.body;
            const db = (0, database_1.getDatabase)();
            const gameId = id || game_id;
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
            const validDiceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
            if (!validDiceTypes.includes(dice_type)) {
                res.status(400).json({ success: false, error: { message: 'Invalid dice type.', statusCode: 400 } });
                return;
            }
            const sides = parseInt(dice_type.substring(1));
            const results = [];
            let total = 0;
            for (let i = 0; i < count; i++) {
                const roll = Math.floor(Math.random() * sides) + 1;
                results.push(roll);
                total += roll;
            }
            const finalTotal = total + modifier;
            const rollId = (0, uuid_1.v4)();
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
                logger_1.logger.info(`Dice rolled: ${req.user.email} rolled ${count}${dice_type}+${modifier} in game ${gameId}`);
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
            }
            else {
                logger_1.logger.info(`Dice rolled: ${req.user.email} rolled ${count}${dice_type}+${modifier} (standalone)`);
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
        }
        catch (error) {
            logger_1.logger.error('Roll dice error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to roll dice.', statusCode: 500 },
            });
        }
    },
    async getChatMessages(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { id } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            const db = (0, database_1.getDatabase)();
            const gamePlayer = await db('game_players')
                .where('game_id', id)
                .where('user_id', req.user.id)
                .first();
            if (!gamePlayer) {
                res.status(403).json({ success: false, error: { message: 'You are not part of this game.', statusCode: 403 } });
                return;
            }
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
                    messages: messages.reverse(),
                    has_more: messages.length === Number(limit),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Get chat messages error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to get chat messages.', statusCode: 500 },
            });
        }
    },
    async sendChatMessage(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { id } = req.params;
            const { message, message_type = 'player' } = req.body;
            const db = (0, database_1.getDatabase)();
            if (!message || message.trim().length === 0) {
                res.status(400).json({ success: false, error: { message: 'Message cannot be empty.', statusCode: 400 } });
                return;
            }
            const gamePlayer = await db('game_players')
                .where('game_id', id)
                .where('user_id', req.user.id)
                .first();
            if (!gamePlayer) {
                res.status(403).json({ success: false, error: { message: 'You are not part of this game.', statusCode: 403 } });
                return;
            }
            const messageId = (0, uuid_1.v4)();
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
            logger_1.logger.info(`Chat message sent: ${req.user.email} sent message in game ${id}`);
            res.status(201).json({
                success: true,
                data: {
                    message: savedMessage,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Send chat message error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to send chat message.', statusCode: 500 },
            });
        }
    },
    async deleteChatMessage(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { id } = req.params;
            const { messageId } = req.body;
            const db = (0, database_1.getDatabase)();
            if (!messageId) {
                res.status(400).json({ success: false, error: { message: 'Message ID is required.', statusCode: 400 } });
                return;
            }
            const message = await db('chat_messages')
                .where('id', messageId)
                .where('game_id', id)
                .first();
            if (!message) {
                res.status(404).json({ success: false, error: { message: 'Message not found.', statusCode: 404 } });
                return;
            }
            const game = await db('game_sessions')
                .where('id', id)
                .first();
            const canDelete = message.user_id === req.user.id || game.dm_user_id === req.user.id;
            if (!canDelete) {
                res.status(403).json({ success: false, error: { message: 'You can only delete your own messages.', statusCode: 403 } });
                return;
            }
            await db('chat_messages')
                .where('id', messageId)
                .del();
            logger_1.logger.info(`Chat message deleted: ${req.user.email} deleted message ${messageId} in game ${id}`);
            res.json({
                success: true,
                data: {
                    message: 'Message deleted successfully.',
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Delete chat message error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to delete chat message.', statusCode: 500 },
            });
        }
    },
};
//# sourceMappingURL=games.js.map