"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.characterController = void 0;
const database_1 = require("../database");
const logger_1 = require("../utils/logger");
exports.characterController = {
    async getCharacters(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const characters = await db('characters')
                .where('user_id', req.user.id)
                .orderBy('created_at', 'desc');
            res.json({ success: true, data: { characters } });
        }
        catch (error) {
            logger_1.logger.error('Get characters error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to get characters.', statusCode: 500 } });
        }
    },
    async createCharacter(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            res.status(501).json({ success: false, error: { message: 'Character creation not yet implemented.', statusCode: 501 } });
        }
        catch (error) {
            logger_1.logger.error('Create character error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to create character.', statusCode: 500 } });
        }
    },
    async getCharacter(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { id } = req.params;
            const db = (0, database_1.getDatabase)();
            const character = await db('characters')
                .where('id', id)
                .where('user_id', req.user.id)
                .first();
            if (!character) {
                res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
                return;
            }
            res.json({ success: true, data: { character } });
        }
        catch (error) {
            logger_1.logger.error('Get character error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to get character.', statusCode: 500 } });
        }
    },
    async updateCharacter(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            res.status(501).json({ success: false, error: { message: 'Character update not yet implemented.', statusCode: 501 } });
        }
        catch (error) {
            logger_1.logger.error('Update character error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to update character.', statusCode: 500 } });
        }
    },
    async deleteCharacter(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { id } = req.params;
            const db = (0, database_1.getDatabase)();
            const deleted = await db('characters')
                .where('id', id)
                .where('user_id', req.user.id)
                .del();
            if (!deleted) {
                res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
                return;
            }
            res.json({ success: true, data: { message: 'Character deleted successfully.' } });
        }
        catch (error) {
            logger_1.logger.error('Delete character error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to delete character.', statusCode: 500 } });
        }
    },
    async levelUp(req, res) {
        try {
            res.status(501).json({ success: false, error: { message: 'Level up not yet implemented.', statusCode: 501 } });
        }
        catch (error) {
            logger_1.logger.error('Level up error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to level up character.', statusCode: 500 } });
        }
    },
    async rest(req, res) {
        try {
            res.status(501).json({ success: false, error: { message: 'Rest not yet implemented.', statusCode: 501 } });
        }
        catch (error) {
            logger_1.logger.error('Rest error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to rest character.', statusCode: 500 } });
        }
    },
    async heal(req, res) {
        try {
            res.status(501).json({ success: false, error: { message: 'Heal not yet implemented.', statusCode: 501 } });
        }
        catch (error) {
            logger_1.logger.error('Heal error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to heal character.', statusCode: 500 } });
        }
    },
    async takeDamage(req, res) {
        try {
            res.status(501).json({ success: false, error: { message: 'Take damage not yet implemented.', statusCode: 501 } });
        }
        catch (error) {
            logger_1.logger.error('Take damage error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to apply damage.', statusCode: 500 } });
        }
    },
    async getInventory(req, res) {
        try {
            res.status(501).json({ success: false, error: { message: 'Inventory management not yet implemented.', statusCode: 501 } });
        }
        catch (error) {
            logger_1.logger.error('Get inventory error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to get inventory.', statusCode: 500 } });
        }
    },
    async addItem(req, res) {
        try {
            res.status(501).json({ success: false, error: { message: 'Add item not yet implemented.', statusCode: 501 } });
        }
        catch (error) {
            logger_1.logger.error('Add item error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to add item.', statusCode: 500 } });
        }
    },
    async updateItem(req, res) {
        try {
            res.status(501).json({ success: false, error: { message: 'Update item not yet implemented.', statusCode: 501 } });
        }
        catch (error) {
            logger_1.logger.error('Update item error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to update item.', statusCode: 500 } });
        }
    },
    async removeItem(req, res) {
        try {
            res.status(501).json({ success: false, error: { message: 'Remove item not yet implemented.', statusCode: 501 } });
        }
        catch (error) {
            logger_1.logger.error('Remove item error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to remove item.', statusCode: 500 } });
        }
    },
    async getSpells(req, res) {
        try {
            res.status(501).json({ success: false, error: { message: 'Spell management not yet implemented.', statusCode: 501 } });
        }
        catch (error) {
            logger_1.logger.error('Get spells error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to get spells.', statusCode: 500 } });
        }
    },
    async addSpell(req, res) {
        try {
            res.status(501).json({ success: false, error: { message: 'Add spell not yet implemented.', statusCode: 501 } });
        }
        catch (error) {
            logger_1.logger.error('Add spell error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to add spell.', statusCode: 500 } });
        }
    },
    async removeSpell(req, res) {
        try {
            res.status(501).json({ success: false, error: { message: 'Remove spell not yet implemented.', statusCode: 501 } });
        }
        catch (error) {
            logger_1.logger.error('Remove spell error:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to remove spell.', statusCode: 500 } });
        }
    },
};
//# sourceMappingURL=characters.js.map