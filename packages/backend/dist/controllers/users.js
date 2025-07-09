"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    async getPublicProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: { message: 'Authentication required.', statusCode: 401 },
                });
                return;
            }
            const { userId } = req.params;
            const db = (0, database_1.getDatabase)();
            const user = await db('users')
                .select('id', 'username', 'display_name', 'created_at', 'preferences')
                .where('id', userId)
                .first();
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: { message: 'User not found.', statusCode: 404 },
                });
                return;
            }
            const characterCount = await db('characters')
                .count('* as count')
                .where('user_id', userId)
                .first();
            const dmGameCount = await db('game_sessions')
                .count('* as count')
                .where('dm_user_id', userId)
                .first();
            const playerGameCount = await db('game_players')
                .count('* as count')
                .where('user_id', userId)
                .first();
            const currentUserId = req.user.id;
            let is_friend = false;
            let friend_request_sent = false;
            if (currentUserId !== userId) {
                const friendship = await db('friendships')
                    .where(function () {
                    this.where('requester_id', currentUserId).andWhere('receiver_id', userId);
                })
                    .orWhere(function () {
                    this.where('requester_id', userId).andWhere('receiver_id', currentUserId);
                })
                    .first();
                if (friendship) {
                    if (friendship.status === 'accepted') {
                        is_friend = true;
                    }
                    else if (friendship.status === 'pending' && friendship.requester_id === currentUserId) {
                        friend_request_sent = true;
                    }
                }
            }
            let preferences = {};
            try {
                preferences = user.preferences ? JSON.parse(user.preferences) : {};
            }
            catch (e) {
                preferences = {};
            }
            const publicUser = {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                created_at: user.created_at,
                character_count: Number(characterCount?.['count'] || 0),
                game_count: Number(dmGameCount?.['count'] || 0) + Number(playerGameCount?.['count'] || 0),
                is_friend,
                friend_request_sent,
                bio: preferences.bio || 'No bio provided',
                location: preferences.location || 'Not specified',
                favorite_system: preferences.favorite_system || 'Not specified',
            };
            res.json({
                success: true,
                data: { user: publicUser },
            });
        }
        catch (error) {
            logger_1.logger.error('Get public profile error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Failed to get public profile.', statusCode: 500 },
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
            const { display_name, username, bio, location, interests, preferences } = req.body;
            const db = (0, database_1.getDatabase)();
            const updatedPreferences = {
                bio: bio || '',
                location: location || '',
                favorite_system: interests || '',
                ...(preferences || {})
            };
            await db('users')
                .where('id', req.user.id)
                .update({
                display_name,
                username,
                preferences: JSON.stringify(updatedPreferences),
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
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: { message: 'Authentication required.', statusCode: 401 },
                });
                return;
            }
            const { user_id, username } = req.body;
            const db = (0, database_1.getDatabase)();
            const currentUserId = req.user.id;
            let targetUserId = user_id;
            if (!targetUserId && username) {
                const targetUser = await db('users')
                    .select('id')
                    .where('username', username)
                    .first();
                if (!targetUser) {
                    res.status(404).json({
                        success: false,
                        error: { message: 'User not found.', statusCode: 404 },
                    });
                    return;
                }
                targetUserId = targetUser.id;
            }
            if (!targetUserId) {
                res.status(400).json({
                    success: false,
                    error: { message: 'User ID or username required.', statusCode: 400 },
                });
                return;
            }
            if (targetUserId === currentUserId) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Cannot send friend request to yourself.', statusCode: 400 },
                });
                return;
            }
            const existingFriendship = await db('friendships')
                .where(function () {
                this.where('requester_id', currentUserId).andWhere('receiver_id', targetUserId);
            })
                .orWhere(function () {
                this.where('requester_id', targetUserId).andWhere('receiver_id', currentUserId);
            })
                .first();
            if (existingFriendship) {
                if (existingFriendship.status === 'accepted') {
                    res.status(400).json({
                        success: false,
                        error: { message: 'You are already friends with this user.', statusCode: 400 },
                    });
                    return;
                }
                else if (existingFriendship.status === 'pending') {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Friend request already sent.', statusCode: 400 },
                    });
                    return;
                }
            }
            const { v4: uuidv4 } = await Promise.resolve().then(() => __importStar(require('uuid')));
            await db('friendships').insert({
                id: uuidv4(),
                requester_id: currentUserId,
                receiver_id: targetUserId,
                status: 'pending',
                created_at: new Date(),
                updated_at: new Date(),
            });
            res.json({
                success: true,
                data: { message: 'Friend request sent successfully.' },
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
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: { message: 'Authentication required.', statusCode: 401 },
                });
                return;
            }
            const { requestId } = req.params;
            const db = (0, database_1.getDatabase)();
            const currentUserId = req.user.id;
            const friendRequest = await db('friendships')
                .where('id', requestId)
                .andWhere('receiver_id', currentUserId)
                .andWhere('status', 'pending')
                .first();
            if (!friendRequest) {
                res.status(404).json({
                    success: false,
                    error: { message: 'Friend request not found.', statusCode: 404 },
                });
                return;
            }
            await db('friendships')
                .where('id', requestId)
                .update({
                status: 'accepted',
                updated_at: new Date(),
            });
            res.json({
                success: true,
                data: { message: 'Friend request accepted.' },
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
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: { message: 'Authentication required.', statusCode: 401 },
                });
                return;
            }
            const { requestId } = req.params;
            const db = (0, database_1.getDatabase)();
            const currentUserId = req.user.id;
            const deletedCount = await db('friendships')
                .where('id', requestId)
                .andWhere('receiver_id', currentUserId)
                .andWhere('status', 'pending')
                .del();
            if (deletedCount === 0) {
                res.status(404).json({
                    success: false,
                    error: { message: 'Friend request not found.', statusCode: 404 },
                });
                return;
            }
            res.json({
                success: true,
                data: { message: 'Friend request declined.' },
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
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: { message: 'Authentication required.', statusCode: 401 },
                });
                return;
            }
            const { friendId } = req.params;
            const db = (0, database_1.getDatabase)();
            const currentUserId = req.user.id;
            const deletedCount = await db('friendships')
                .where(function () {
                this.where('requester_id', currentUserId).andWhere('receiver_id', friendId);
            })
                .orWhere(function () {
                this.where('requester_id', friendId).andWhere('receiver_id', currentUserId);
            })
                .andWhere('status', 'accepted')
                .del();
            if (deletedCount === 0) {
                res.status(404).json({
                    success: false,
                    error: { message: 'Friendship not found.', statusCode: 404 },
                });
                return;
            }
            res.json({
                success: true,
                data: { message: 'Friend removed successfully.' },
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