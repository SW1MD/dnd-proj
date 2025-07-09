import { Request, Response } from 'express';
import { getDatabase } from '../database';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

export const userController = {
  // Get user profile
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required.', statusCode: 401 },
        });
        return;
      }

      const db = getDatabase();
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
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get profile.', statusCode: 500 },
      });
    }
  },

  // Get public profile (safe profile view for other users)
  async getPublicProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required.', statusCode: 401 },
        });
        return;
      }

      const { userId } = req.params;
      const db = getDatabase();

      // Get basic user info (excluding sensitive data)
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

      // Get character count
      const characterCount = await db('characters')
        .count('* as count')
        .where('user_id', userId)
        .first();

      // Get game count (both as DM and player)
      const dmGameCount = await db('game_sessions')
        .count('* as count')
        .where('dm_user_id', userId)
        .first();

      const playerGameCount = await db('game_players')
        .count('* as count')
        .where('user_id', userId)
        .first();

      // Check friendship status
      const currentUserId = req.user.id;
      let is_friend = false;
      let friend_request_sent = false;

      if (currentUserId !== userId) {
        const friendship = await db('friendships')
          .where(function() {
            this.where('requester_id', currentUserId).andWhere('receiver_id', userId);
          })
          .orWhere(function() {
            this.where('requester_id', userId).andWhere('receiver_id', currentUserId);
          })
          .first();

        if (friendship) {
          if (friendship.status === 'accepted') {
            is_friend = true;
          } else if (friendship.status === 'pending' && friendship.requester_id === currentUserId) {
            friend_request_sent = true;
          }
        }
      }

      // Parse preferences for additional profile data
      let preferences: any = {};
      try {
        preferences = user.preferences ? JSON.parse(user.preferences) : {};
      } catch (e) {
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
    } catch (error) {
      logger.error('Get public profile error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get public profile.', statusCode: 500 },
      });
    }
  },

  // Update user profile
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required.', statusCode: 401 },
        });
        return;
      }

      const { display_name, username, bio, location, interests, preferences } = req.body;
      const db = getDatabase();

      // Build preferences object
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
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to update profile.', statusCode: 500 },
      });
    }
  },

  // Get user's friends (placeholder)
  async getFriends(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: { friends: [], message: 'Friends system not yet implemented.' },
      });
    } catch (error) {
      logger.error('Get friends error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get friends.', statusCode: 500 },
      });
    }
  },

  // Delete user profile
  async deleteProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        error: { message: 'Profile deletion not yet implemented.', statusCode: 501 },
      });
    } catch (error) {
      logger.error('Delete profile error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to delete profile.', statusCode: 500 },
      });
    }
  },

  // Get user statistics
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        error: { message: 'User statistics not yet implemented.', statusCode: 501 },
      });
    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get stats.', statusCode: 500 },
      });
    }
  },

  // Friend management methods
  async sendFriendRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required.', statusCode: 401 },
        });
        return;
      }

      const { user_id, username } = req.body;
      const db = getDatabase();
      const currentUserId = req.user.id;

      let targetUserId = user_id;

      // If username provided instead of user_id, look up the user
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

      // Prevent self-friendship
      if (targetUserId === currentUserId) {
        res.status(400).json({
          success: false,
          error: { message: 'Cannot send friend request to yourself.', statusCode: 400 },
        });
        return;
      }

      // Check if friendship already exists
      const existingFriendship = await db('friendships')
        .where(function() {
          this.where('requester_id', currentUserId).andWhere('receiver_id', targetUserId);
        })
        .orWhere(function() {
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
        } else if (existingFriendship.status === 'pending') {
          res.status(400).json({
            success: false,
            error: { message: 'Friend request already sent.', statusCode: 400 },
          });
          return;
        }
      }

      // Create friend request
      const { v4: uuidv4 } = await import('uuid');
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
    } catch (error) {
      logger.error('Send friend request error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to send friend request.', statusCode: 500 },
      });
    }
  },

  async acceptFriendRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required.', statusCode: 401 },
        });
        return;
      }

      const { requestId } = req.params;
      const db = getDatabase();
      const currentUserId = req.user.id;

      // Find the friend request
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

      // Accept the request
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
    } catch (error) {
      logger.error('Accept friend request error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to accept friend request.', statusCode: 500 },
      });
    }
  },

  async declineFriendRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required.', statusCode: 401 },
        });
        return;
      }

      const { requestId } = req.params;
      const db = getDatabase();
      const currentUserId = req.user.id;

      // Find and delete the friend request
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
    } catch (error) {
      logger.error('Decline friend request error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to decline friend request.', statusCode: 500 },
      });
    }
  },

  async removeFriend(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Authentication required.', statusCode: 401 },
        });
        return;
      }

      const { friendId } = req.params;
      const db = getDatabase();
      const currentUserId = req.user.id;

      // Remove the friendship (works both ways)
      const deletedCount = await db('friendships')
        .where(function() {
          this.where('requester_id', currentUserId).andWhere('receiver_id', friendId);
        })
        .orWhere(function() {
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
    } catch (error) {
      logger.error('Remove friend error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to remove friend.', statusCode: 500 },
      });
    }
  },

  // Settings management
  async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        error: { message: 'Settings management not yet implemented.', statusCode: 501 },
      });
    } catch (error) {
      logger.error('Get settings error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get settings.', statusCode: 500 },
      });
    }
  },

  async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        error: { message: 'Settings management not yet implemented.', statusCode: 501 },
      });
    } catch (error) {
      logger.error('Update settings error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to update settings.', statusCode: 500 },
      });
    }
  },
}; 