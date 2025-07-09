"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialController = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../database");
const logger_1 = require("../utils/logger");
exports.socialController = {
    async getFriends(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const userId = req.user.id;
            const friendships = await db('friendships')
                .select([
                'friendships.*',
                'requester.username as requester_username',
                'requester.display_name as requester_display_name',
                'requester.email as requester_email',
                'receiver.username as receiver_username',
                'receiver.display_name as receiver_display_name',
                'receiver.email as receiver_email'
            ])
                .leftJoin('users as requester', 'friendships.requester_id', 'requester.id')
                .leftJoin('users as receiver', 'friendships.receiver_id', 'receiver.id')
                .where(function () {
                this.where('requester_id', userId).orWhere('receiver_id', userId);
            })
                .where('status', 'accepted');
            const friends = friendships.map(friendship => {
                const isRequester = friendship.requester_id === userId;
                const friend = isRequester ? {
                    id: friendship.receiver_id,
                    username: friendship.receiver_username,
                    display_name: friendship.receiver_display_name,
                    email: friendship.receiver_email
                } : {
                    id: friendship.requester_id,
                    username: friendship.requester_username,
                    display_name: friendship.requester_display_name,
                    email: friendship.requester_email
                };
                return {
                    friendship_id: friendship.id,
                    friend,
                    since: friendship.created_at
                };
            });
            res.json({
                success: true,
                data: { friends }
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting friends:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to get friends.', statusCode: 500 } });
        }
    },
    async sendFriendRequest(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { username } = req.body;
            const requesterId = req.user.id;
            if (!username) {
                res.status(400).json({ success: false, error: { message: 'Username is required.', statusCode: 400 } });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const targetUser = await db('users').where('username', username).first();
            if (!targetUser) {
                res.status(404).json({ success: false, error: { message: 'User not found.', statusCode: 404 } });
                return;
            }
            if (targetUser.id === requesterId) {
                res.status(400).json({ success: false, error: { message: 'Cannot send friend request to yourself.', statusCode: 400 } });
                return;
            }
            const existingFriendship = await db('friendships')
                .where(function () {
                this.where({ requester_id: requesterId, receiver_id: targetUser.id })
                    .orWhere({ requester_id: targetUser.id, receiver_id: requesterId });
            })
                .first();
            if (existingFriendship) {
                const status = existingFriendship.status;
                if (status === 'accepted') {
                    res.status(400).json({ success: false, error: { message: 'You are already friends.', statusCode: 400 } });
                    return;
                }
                else if (status === 'pending') {
                    if (existingFriendship.requester_id === requesterId) {
                        res.status(400).json({ success: false, error: { message: 'Friend request already sent.', statusCode: 400 } });
                        return;
                    }
                    else {
                        await db('friendships')
                            .where('id', existingFriendship.id)
                            .update({
                            status: 'accepted',
                            updated_at: new Date()
                        });
                        logger_1.logger.info(`Mutual friend request auto-accepted: ${req.user.username} <-> ${username}`);
                        res.status(200).json({
                            success: true,
                            data: {
                                message: `You and ${targetUser.display_name || targetUser.username} are now friends! 🎉`,
                                friendship_id: existingFriendship.id,
                                auto_accepted: true
                            }
                        });
                        return;
                    }
                }
            }
            const friendshipId = (0, uuid_1.v4)();
            await db('friendships').insert({
                id: friendshipId,
                requester_id: requesterId,
                receiver_id: targetUser.id,
                status: 'pending'
            });
            logger_1.logger.info(`Friend request sent: ${req.user.username} -> ${username}`);
            res.status(201).json({
                success: true,
                data: {
                    message: `Friend request sent to ${targetUser.display_name}`,
                    friendship_id: friendshipId
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error sending friend request:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to send friend request.', statusCode: 500 } });
        }
    },
    async getFriendRequests(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const userId = req.user.id;
            const receivedRequests = await db('friendships')
                .select([
                'friendships.*',
                'requester.username as requester_username',
                'requester.display_name as requester_display_name'
            ])
                .leftJoin('users as requester', 'friendships.requester_id', 'requester.id')
                .where('receiver_id', userId)
                .where('status', 'pending');
            const sentRequests = await db('friendships')
                .select([
                'friendships.*',
                'receiver.username as receiver_username',
                'receiver.display_name as receiver_display_name'
            ])
                .leftJoin('users as receiver', 'friendships.receiver_id', 'receiver.id')
                .where('requester_id', userId)
                .where('status', 'pending');
            res.json({
                success: true,
                data: {
                    received: receivedRequests.map(req => ({
                        id: req.id,
                        from: {
                            id: req.requester_id,
                            username: req.requester_username,
                            display_name: req.requester_display_name
                        },
                        created_at: req.created_at
                    })),
                    sent: sentRequests.map(req => ({
                        id: req.id,
                        to: {
                            id: req.receiver_id,
                            username: req.receiver_username,
                            display_name: req.receiver_display_name
                        },
                        created_at: req.created_at
                    }))
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting friend requests:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to get friend requests.', statusCode: 500 } });
        }
    },
    async respondToFriendRequest(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { requestId } = req.params;
            const { action } = req.body;
            if (!['accept', 'reject'].includes(action)) {
                res.status(400).json({ success: false, error: { message: 'Action must be accept or reject.', statusCode: 400 } });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const userId = req.user.id;
            const friendship = await db('friendships')
                .where('id', requestId)
                .where('receiver_id', userId)
                .where('status', 'pending')
                .first();
            if (!friendship) {
                res.status(404).json({ success: false, error: { message: 'Friend request not found.', statusCode: 404 } });
                return;
            }
            if (action === 'accept') {
                await db('friendships')
                    .where('id', requestId)
                    .update({
                    status: 'accepted',
                    updated_at: new Date()
                });
                logger_1.logger.info(`Friend request accepted: ${requestId}`);
                res.json({
                    success: true,
                    data: { message: 'Friend request accepted!' }
                });
            }
            else {
                await db('friendships').where('id', requestId).delete();
                logger_1.logger.info(`Friend request rejected: ${requestId}`);
                res.json({
                    success: true,
                    data: { message: 'Friend request rejected.' }
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error responding to friend request:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to respond to friend request.', statusCode: 500 } });
        }
    },
    async removeFriend(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { friendshipId } = req.params;
            const db = (0, database_1.getDatabase)();
            const userId = req.user.id;
            const friendship = await db('friendships')
                .where('id', friendshipId)
                .where(function () {
                this.where('requester_id', userId).orWhere('receiver_id', userId);
            })
                .first();
            if (!friendship) {
                res.status(404).json({ success: false, error: { message: 'Friendship not found.', statusCode: 404 } });
                return;
            }
            await db('friendships').where('id', friendshipId).delete();
            logger_1.logger.info(`Friendship removed: ${friendshipId}`);
            res.json({
                success: true,
                data: { message: 'Friend removed successfully.' }
            });
        }
        catch (error) {
            logger_1.logger.error('Error removing friend:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to remove friend.', statusCode: 500 } });
        }
    },
    async getConversations(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const userId = req.user.id;
            const conversations = await db.raw(`
        SELECT 
          CASE 
            WHEN sender_id = ? THEN receiver_id 
            ELSE sender_id 
          END as partner_id,
          MAX(created_at) as last_message_at,
          (SELECT content FROM direct_messages dm2 
            WHERE (dm2.sender_id = ? AND dm2.receiver_id = (CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END)) 
               OR (dm2.receiver_id = ? AND dm2.sender_id = (CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END))
            ORDER BY created_at DESC LIMIT 1) as last_message,
          COUNT(CASE WHEN receiver_id = ? AND is_read = false THEN 1 END) as unread_count
        FROM direct_messages 
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY partner_id
        ORDER BY last_message_at DESC
      `, [userId, userId, userId, userId, userId, userId, userId, userId]);
            const conversationRows = conversations.rows || conversations;
            const partnerIds = conversationRows.map((conv) => conv.partner_id);
            const partners = await db('users')
                .select('id', 'username', 'display_name')
                .whereIn('id', partnerIds);
            const partnerMap = partners.reduce((acc, partner) => {
                acc[partner.id] = partner;
                return acc;
            }, {});
            const conversationsWithPartners = conversationRows.map((conv) => ({
                partner: partnerMap[conv.partner_id],
                last_message: conv.last_message,
                last_message_at: conv.last_message_at,
                unread_count: parseInt(conv.unread_count) || 0
            }));
            res.json({
                success: true,
                data: { conversations: conversationsWithPartners }
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting conversations:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to get conversations.', statusCode: 500 } });
        }
    },
    async getMessages(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { partnerId } = req.params;
            const db = (0, database_1.getDatabase)();
            const userId = req.user.id;
            const messages = await db('direct_messages')
                .select([
                'direct_messages.*',
                'sender.username as sender_username',
                'sender.display_name as sender_display_name'
            ])
                .leftJoin('users as sender', 'direct_messages.sender_id', 'sender.id')
                .where(function () {
                this.where({ sender_id: userId, receiver_id: partnerId })
                    .orWhere({ sender_id: partnerId, receiver_id: userId });
            })
                .orderBy('created_at', 'asc');
            await db('direct_messages')
                .where({ sender_id: partnerId, receiver_id: userId, is_read: false })
                .update({
                is_read: true,
                read_at: new Date()
            });
            res.json({
                success: true,
                data: { messages }
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting messages:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to get messages.', statusCode: 500 } });
        }
    },
    async sendMessage(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { receiverId, content } = req.body;
            const senderId = req.user.id;
            if (!receiverId || !content) {
                res.status(400).json({ success: false, error: { message: 'Receiver ID and content are required.', statusCode: 400 } });
                return;
            }
            if (receiverId === senderId) {
                res.status(400).json({ success: false, error: { message: 'Cannot send message to yourself.', statusCode: 400 } });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const receiver = await db('users').where('id', receiverId).first();
            if (!receiver) {
                res.status(404).json({ success: false, error: { message: 'Receiver not found.', statusCode: 404 } });
                return;
            }
            const friendship = await db('friendships')
                .where(function () {
                this.where({ requester_id: senderId, receiver_id: receiverId })
                    .orWhere({ requester_id: receiverId, receiver_id: senderId });
            })
                .where('status', 'accepted')
                .first();
            if (!friendship) {
                res.status(403).json({ success: false, error: { message: 'You can only message friends.', statusCode: 403 } });
                return;
            }
            const messageId = (0, uuid_1.v4)();
            await db('direct_messages').insert({
                id: messageId,
                sender_id: senderId,
                receiver_id: receiverId,
                content: content.trim()
            });
            logger_1.logger.info(`Direct message sent from ${req.user.username} to ${receiver.username}`);
            res.status(201).json({
                success: true,
                data: {
                    message_id: messageId,
                    message: 'Message sent successfully!'
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error sending message:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to send message.', statusCode: 500 } });
        }
    },
    async sendGameInvitation(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { gameId, friendId, message } = req.body;
            const inviterId = req.user.id;
            if (!gameId || !friendId) {
                res.status(400).json({ success: false, error: { message: 'Game ID and friend ID are required.', statusCode: 400 } });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const game = await db('game_sessions').where('id', gameId).first();
            if (!game) {
                res.status(404).json({ success: false, error: { message: 'Game not found.', statusCode: 404 } });
                return;
            }
            if (game.dm_user_id !== inviterId) {
                res.status(403).json({ success: false, error: { message: 'Only the DM can send game invitations.', statusCode: 403 } });
                return;
            }
            const friendship = await db('friendships')
                .where(function () {
                this.where({ requester_id: inviterId, receiver_id: friendId })
                    .orWhere({ requester_id: friendId, receiver_id: inviterId });
            })
                .where('status', 'accepted')
                .first();
            if (!friendship) {
                res.status(403).json({ success: false, error: { message: 'Can only invite friends to games.', statusCode: 403 } });
                return;
            }
            const existingInvitation = await db('game_invitations')
                .where({ game_id: gameId, invitee_id: friendId })
                .where('status', 'pending')
                .first();
            if (existingInvitation) {
                res.status(400).json({ success: false, error: { message: 'Invitation already sent.', statusCode: 400 } });
                return;
            }
            const invitationId = (0, uuid_1.v4)();
            await db('game_invitations').insert({
                id: invitationId,
                game_id: gameId,
                inviter_id: inviterId,
                invitee_id: friendId,
                message: message || null,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });
            logger_1.logger.info(`Game invitation sent: ${req.user.username} invited friend to ${game.name}`);
            res.status(201).json({
                success: true,
                data: {
                    invitation_id: invitationId,
                    message: 'Game invitation sent!'
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error sending game invitation:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to send game invitation.', statusCode: 500 } });
        }
    },
    async getGameInvitations(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const userId = req.user.id;
            const invitations = await db('game_invitations')
                .select([
                'game_invitations.*',
                'game_sessions.name as game_name',
                'game_sessions.description as game_description',
                'game_sessions.max_players',
                'inviter.username as inviter_username',
                'inviter.display_name as inviter_display_name'
            ])
                .leftJoin('game_sessions', 'game_invitations.game_id', 'game_sessions.id')
                .leftJoin('users as inviter', 'game_invitations.inviter_id', 'inviter.id')
                .where('game_invitations.invitee_id', userId)
                .where('game_invitations.status', 'pending')
                .where('game_invitations.expires_at', '>', new Date())
                .orderBy('game_invitations.created_at', 'desc');
            res.json({
                success: true,
                data: { invitations }
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting game invitations:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to get game invitations.', statusCode: 500 } });
        }
    },
    async respondToGameInvitation(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { invitationId } = req.params;
            const { action } = req.body;
            if (!['accept', 'decline'].includes(action)) {
                res.status(400).json({ success: false, error: { message: 'Action must be accept or decline.', statusCode: 400 } });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const userId = req.user.id;
            const invitation = await db('game_invitations')
                .where('id', invitationId)
                .where('invitee_id', userId)
                .where('status', 'pending')
                .first();
            if (!invitation) {
                res.status(404).json({ success: false, error: { message: 'Game invitation not found.', statusCode: 404 } });
                return;
            }
            if (new Date() > new Date(invitation.expires_at)) {
                await db('game_invitations')
                    .where('id', invitationId)
                    .update({ status: 'expired' });
                res.status(400).json({ success: false, error: { message: 'Invitation has expired.', statusCode: 400 } });
                return;
            }
            if (action === 'accept') {
                await db('game_invitations')
                    .where('id', invitationId)
                    .update({
                    status: 'accepted',
                    responded_at: new Date()
                });
                logger_1.logger.info(`Game invitation accepted: ${invitationId}`);
                res.json({
                    success: true,
                    data: {
                        message: 'Game invitation accepted! You can now join the game.',
                        game_id: invitation.game_id
                    }
                });
            }
            else {
                await db('game_invitations')
                    .where('id', invitationId)
                    .update({
                    status: 'declined',
                    responded_at: new Date()
                });
                logger_1.logger.info(`Game invitation declined: ${invitationId}`);
                res.json({
                    success: true,
                    data: { message: 'Game invitation declined.' }
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error responding to game invitation:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to respond to game invitation.', statusCode: 500 } });
        }
    },
    async getUserProfile(req, res) {
        try {
            const { userId } = req.params;
            const viewerId = req.user?.id;
            const db = (0, database_1.getDatabase)();
            const user = await db('users')
                .select([
                'id', 'username', 'display_name', 'bio', 'avatar_url',
                'banner_url', 'location', 'interests', 'social_links',
                'privacy_level', 'created_at', 'profile_updated_at', 'stats'
            ])
                .where('id', userId)
                .first();
            if (!user) {
                res.status(404).json({ success: false, error: { message: 'User not found.', statusCode: 404 } });
                return;
            }
            if (user.privacy_level === 'private' && viewerId !== userId) {
                res.status(403).json({ success: false, error: { message: 'Profile is private.', statusCode: 403 } });
                return;
            }
            if (user.privacy_level === 'friends' && viewerId !== userId) {
                const friendship = await db('friendships')
                    .where(function () {
                    this.where({ requester_id: viewerId, receiver_id: userId })
                        .orWhere({ requester_id: userId, receiver_id: viewerId });
                })
                    .where('status', 'accepted')
                    .first();
                if (!friendship) {
                    res.status(403).json({ success: false, error: { message: 'Profile is friends-only.', statusCode: 403 } });
                    return;
                }
            }
            user.interests = JSON.parse(user.interests || '[]');
            user.social_links = JSON.parse(user.social_links || '{}');
            user.stats = JSON.parse(user.stats || '{}');
            res.json({
                success: true,
                data: { user }
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting user profile:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to get user profile.', statusCode: 500 } });
        }
    },
    async updateUserProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { bio, avatar_url, banner_url, location, interests, social_links, privacy_level } = req.body;
            const db = (0, database_1.getDatabase)();
            const userId = req.user.id;
            const updateData = {
                profile_updated_at: new Date()
            };
            if (bio !== undefined)
                updateData.bio = bio;
            if (avatar_url !== undefined)
                updateData.avatar_url = avatar_url;
            if (banner_url !== undefined)
                updateData.banner_url = banner_url;
            if (location !== undefined)
                updateData.location = location;
            if (interests !== undefined)
                updateData.interests = JSON.stringify(interests);
            if (social_links !== undefined)
                updateData.social_links = JSON.stringify(social_links);
            if (privacy_level !== undefined)
                updateData.privacy_level = privacy_level;
            await db('users')
                .where('id', userId)
                .update(updateData);
            logger_1.logger.info(`Profile updated: ${req.user.username}`);
            res.json({
                success: true,
                data: { message: 'Profile updated successfully!' }
            });
        }
        catch (error) {
            logger_1.logger.error('Error updating user profile:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to update profile.', statusCode: 500 } });
        }
    },
    async getPostsFeed(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { page = 1, limit = 20 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const db = (0, database_1.getDatabase)();
            const userId = req.user.id;
            const friendships = await db('friendships')
                .where(function () {
                this.where('requester_id', userId).orWhere('receiver_id', userId);
            })
                .where('status', 'accepted');
            const friendIds = friendships.map(f => f.requester_id === userId ? f.receiver_id : f.requester_id);
            friendIds.push(userId);
            const posts = await db('user_posts')
                .select([
                'user_posts.*',
                'users.username as author_username',
                'users.display_name as author_display_name',
                'users.avatar_url as author_avatar',
                'game_sessions.name as attached_game_name',
                'game_sessions.system as attached_game_system',
                'game_sessions.status as attached_game_status',
                'game_sessions.max_players as attached_game_max_players',
                'game_sessions.dm_user_id as attached_game_dm_id'
            ])
                .leftJoin('users', 'user_posts.user_id', 'users.id')
                .leftJoin('game_sessions', 'user_posts.attached_game_id', 'game_sessions.id')
                .whereIn('user_posts.user_id', friendIds)
                .where('user_posts.is_public', true)
                .orderBy('user_posts.created_at', 'desc')
                .limit(Number(limit))
                .offset(offset);
            const postsWithParsedData = posts.map(post => ({
                ...post,
                media_urls: JSON.parse(post.media_urls || '[]'),
                metadata: JSON.parse(post.metadata || '{}')
            }));
            res.json({
                success: true,
                data: {
                    posts: postsWithParsedData,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        hasMore: posts.length === Number(limit)
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting posts feed:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to get posts feed.', statusCode: 500 } });
        }
    },
    async createPost(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { content, media_urls, post_type, metadata, is_public, attached_game_id } = req.body;
            if (!content) {
                res.status(400).json({ success: false, error: { message: 'Content is required.', statusCode: 400 } });
                return;
            }
            const db = (0, database_1.getDatabase)();
            const postId = (0, uuid_1.v4)();
            if (attached_game_id) {
                const game = await db('game_sessions').where('id', attached_game_id).first();
                if (!game) {
                    res.status(400).json({ success: false, error: { message: 'Attached game not found.', statusCode: 400 } });
                    return;
                }
                const isPlayerInGame = await db('game_players')
                    .where('game_id', attached_game_id)
                    .where('user_id', req.user.id)
                    .first();
                if (game.dm_user_id !== req.user.id && !isPlayerInGame) {
                    res.status(403).json({ success: false, error: { message: 'You can only attach games you are part of.', statusCode: 403 } });
                    return;
                }
            }
            await db('user_posts').insert({
                id: postId,
                user_id: req.user.id,
                content,
                media_urls: JSON.stringify(media_urls || []),
                post_type: post_type || 'text',
                metadata: JSON.stringify(metadata || {}),
                is_public: is_public !== false,
                attached_game_id: attached_game_id || null
            });
            logger_1.logger.info(`Post created: ${postId} by ${req.user.username}${attached_game_id ? ' with attached game' : ''}`);
            res.status(201).json({
                success: true,
                data: {
                    post_id: postId,
                    message: 'Post created successfully!'
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating post:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to create post.', statusCode: 500 } });
        }
    },
    async getNotifications(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { page = 1, limit = 50 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const db = (0, database_1.getDatabase)();
            const userId = req.user.id;
            const notifications = await db('notifications')
                .where('user_id', userId)
                .orderBy('created_at', 'desc')
                .limit(Number(limit))
                .offset(offset);
            const notificationsWithParsedData = notifications.map(notification => ({
                ...notification,
                data: JSON.parse(notification.data || '{}')
            }));
            const unreadCount = await db('notifications')
                .where('user_id', userId)
                .where('is_read', false)
                .count('id as count')
                .first();
            res.json({
                success: true,
                data: {
                    notifications: notificationsWithParsedData,
                    unread_count: Number(unreadCount?.['count'] || 0),
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        hasMore: notifications.length === Number(limit)
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting notifications:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to get notifications.', statusCode: 500 } });
        }
    },
    async markNotificationsAsRead(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
                return;
            }
            const { notification_ids } = req.body;
            const db = (0, database_1.getDatabase)();
            const userId = req.user.id;
            let query = db('notifications')
                .where('user_id', userId)
                .where('is_read', false);
            if (notification_ids && Array.isArray(notification_ids)) {
                query = query.whereIn('id', notification_ids);
            }
            await query.update({
                is_read: true,
                read_at: new Date()
            });
            res.json({
                success: true,
                data: { message: 'Notifications marked as read.' }
            });
        }
        catch (error) {
            logger_1.logger.error('Error marking notifications as read:', error);
            res.status(500).json({ success: false, error: { message: 'Failed to mark notifications as read.', statusCode: 500 } });
        }
    }
};
//# sourceMappingURL=social.js.map