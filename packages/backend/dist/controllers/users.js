"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const database_1 = require("../database");
const logger_1 = require("../utils/logger");
exports.userController = {
    async getProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: { message: 'Authentication required.', statusCode: 401 },
                });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const user = await db('users')
                .select('id', 'email', 'username', 'display_name', 'role', 'preferences', 'stats', 'created_at')
                .where('id', req.user.id)
                .first();
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: { message: 'User not found.', statusCode: 404 },
                });
                return;
            }
            res.json({
                success: true,
                data: { user },
            });
        }
        catch (error) {
            logger_1.logger.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to get profile.', statusCode: 500 },
            });
        }
    },
    async updateProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: { message: 'Authentication required.', statusCode: 401 },
                });
                return;
            }
            const { display_name, preferences } = req.body;
            const db = (0, database_1.getDatabase)();
            await db('users')
                .where('id', req.user.id)
                .update({
                display_name,
                preferences: preferences ? JSON.stringify(preferences) : undefined,
                updated_at: new Date(),
            });
            res.json({
                success: true,
                data: { message: 'Profile updated successfully.' },
            });
        }
        catch (error) {
            logger_1.logger.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to update profile.', statusCode: 500 },
            });
        }
    },
    async getFriends(req, res) {
        try {
            res.json({
                success: true,
                data: { friends: [], message: 'Friends system not yet implemented.' },
            });
        }
        catch (error) {
            logger_1.logger.error('Get friends error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to get friends.', statusCode: 500 },
            });
        }
    },
    async deleteProfile(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Profile deletion not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Delete profile error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to delete profile.', statusCode: 500 },
            });
        }
    },
    async getStats(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'User statistics not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Get stats error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to get stats.', statusCode: 500 },
            });
        }
    },
    async sendFriendRequest(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Friend requests not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Send friend request error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to send friend request.', statusCode: 500 },
            });
        }
    },
    async acceptFriendRequest(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Friend requests not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Accept friend request error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to accept friend request.', statusCode: 500 },
            });
        }
    },
    async declineFriendRequest(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Friend requests not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Decline friend request error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to decline friend request.', statusCode: 500 },
            });
        }
    },
    async removeFriend(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Friend removal not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Remove friend error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to remove friend.', statusCode: 500 },
            });
        }
    },
    async getSettings(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Settings management not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Get settings error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to get settings.', statusCode: 500 },
            });
        }
    },
    async updateSettings(req, res) {
        try {
            res.status(501).json({
                success: false,
                error: { message: 'Settings management not yet implemented.', statusCode: 501 },
            });
        }
        catch (error) {
            logger_1.logger.error('Update settings error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to update settings.', statusCode: 500 },
            });
        }
    },
};
//# sourceMappingURL=users.js.map