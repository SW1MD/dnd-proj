import { z } from 'zod';

export const UserRoleSchema = z.enum(['player', 'dm', 'admin']);

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().min(3).max(20),
  displayName: z.string().min(1).max(50),
  role: UserRoleSchema,
  isVerified: z.boolean().default(false),
  isOnline: z.boolean().default(false),
  lastLoginAt: z.date().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).default('dark'),
    notifications: z.boolean().default(true),
    soundEnabled: z.boolean().default(true),
    autoRollDice: z.boolean().default(false),
    showCombatAnimations: z.boolean().default(true),
  }),
  stats: z.object({
    gamesPlayed: z.number().default(0),
    totalPlayTime: z.number().default(0), // in minutes
    charactersCreated: z.number().default(0),
    achievementsUnlocked: z.array(z.string()).default([]),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const AuthTokenSchema = z.object({
  id: z.string(),
  userId: z.string(),
  token: z.string(),
  type: z.enum(['access', 'refresh', 'reset_password', 'verify_email']),
  expiresAt: z.date(),
  createdAt: z.date(),
  isRevoked: z.boolean().default(false),
});

export const UserSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  deviceInfo: z.object({
    platform: z.enum(['web', 'desktop', 'mobile']),
    userAgent: z.string(),
    ipAddress: z.string(),
  }),
  isActive: z.boolean(),
  createdAt: z.date(),
  lastActiveAt: z.date(),
  expiresAt: z.date(),
});

export const FriendRequestSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  status: z.enum(['pending', 'accepted', 'declined', 'blocked']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const FriendshipSchema = z.object({
  id: z.string(),
  userId1: z.string(),
  userId2: z.string(),
  createdAt: z.date(),
});

export type UserRole = z.infer<typeof UserRoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type AuthToken = z.infer<typeof AuthTokenSchema>;
export type UserSession = z.infer<typeof UserSessionSchema>;
export type FriendRequest = z.infer<typeof FriendRequestSchema>;
export type Friendship = z.infer<typeof FriendshipSchema>; 