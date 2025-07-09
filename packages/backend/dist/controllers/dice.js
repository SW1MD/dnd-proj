"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diceController = void 0;
const logger_1 = require("../utils/logger");
const database_1 = require("../database");
function rollDice(sides, count = 1, modifier = 0) {
    const rolls = [];
    for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
    return {
        total,
        rolls,
        modifier,
        description: `${count}d${sides}${modifier !== 0 ? (modifier > 0 ? '+' : '') + modifier : ''}`,
    };
}
exports.diceController = {
    async rollDice(req, res) {
        try {
            const { sides, count = 1, modifier = 0, character_id, roll_type = 'general' } = req.body;
            if (!sides || sides < 2 || sides > 100) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Invalid number of sides. Must be between 2 and 100.', statusCode: 400 }
                });
                return;
            }
            if (count < 1 || count > 20) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Invalid dice count. Must be between 1 and 20.', statusCode: 400 }
                });
                return;
            }
            if (modifier < -100 || modifier > 100) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Invalid modifier. Must be between -100 and 100.', statusCode: 400 }
                });
                return;
            }
            if (character_id && req.user) {
                const db = (0, database_1.getDatabase)();
                const character = await db('characters')
                    .where('id', character_id)
                    .where('user_id', req.user.id)
                    .first();
                if (!character) {
                    res.status(404).json({
                        success: false,
                        error: { message: 'Character not found.', statusCode: 404 }
                    });
                    return;
                }
            }
            const result = rollDice(sides, count, modifier);
            if (req.user) {
                logger_1.logger.info(`Dice rolled: ${req.user.email} rolled ${count}d${sides}+${modifier} (standalone)`);
            }
            else {
                logger_1.logger.info(`Anonymous dice rolled: ${count}d${sides}+${modifier} (standalone)`);
            }
            res.json({
                success: true,
                data: {
                    total: result.total,
                    rolls: result.rolls,
                    modifier: result.modifier,
                    description: result.description,
                    summary: {
                        dice_type: `d${sides}`,
                        count,
                        modifier,
                        individual_rolls: result.rolls,
                        roll_total: result.rolls.reduce((sum, roll) => sum + roll, 0),
                        final_total: result.total,
                    },
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Roll dice error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to roll dice.', statusCode: 500 },
            });
        }
    },
    async getDiceHistory(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: { message: 'Authentication required.', statusCode: 401 }
                });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const { limit = 50 } = req.query;
            const diceRolls = await db('dice_rolls')
                .select('dice_rolls.*', 'characters.name as character_name', 'game_sessions.name as game_name')
                .leftJoin('characters', 'dice_rolls.character_id', 'characters.id')
                .leftJoin('game_sessions', 'dice_rolls.game_id', 'game_sessions.id')
                .where('dice_rolls.user_id', req.user.id)
                .orderBy('dice_rolls.created_at', 'desc')
                .limit(parseInt(limit));
            const parsedRolls = diceRolls.map(roll => ({
                ...roll,
                dice_config: JSON.parse(roll.dice_config || '{}'),
                results: JSON.parse(roll.results || '[]'),
            }));
            res.json({
                success: true,
                data: {
                    dice_rolls: parsedRolls,
                    total_count: parsedRolls.length,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Get dice history error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to get dice history.', statusCode: 500 },
            });
        }
    },
};
//# sourceMappingURL=dice.js.map