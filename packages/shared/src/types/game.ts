import { z } from 'zod';

export const GameStatusSchema = z.enum(['waiting', 'active', 'paused', 'completed']);

export const PlayerSchema = z.object({
  id: z.string(),
  userId: z.string(),
  characterId: z.string(),
  isOnline: z.boolean(),
  joinedAt: z.date(),
  lastActiveAt: z.date(),
});

export const GameActionSchema = z.object({
  id: z.string(),
  type: z.enum(['attack', 'cast_spell', 'move', 'interact', 'dialogue', 'inventory']),
  playerId: z.string(),
  description: z.string(),
  data: z.record(z.any()),
  timestamp: z.date(),
  resolved: z.boolean(),
});

export const GameEventSchema = z.object({
  id: z.string(),
  type: z.enum(['combat_start', 'combat_end', 'level_up', 'item_found', 'npc_interaction', 'story_event']),
  description: z.string(),
  data: z.record(z.any()),
  timestamp: z.date(),
  playersInvolved: z.array(z.string()),
});

export const DiceRollSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  type: z.string(), // e.g., "d20", "2d6", "damage"
  result: z.number(),
  rolls: z.array(z.number()),
  modifier: z.number().default(0),
  description: z.string(),
  timestamp: z.date(),
});

export const GameSessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  dmUserId: z.string(), // For future human DM support
  maxPlayers: z.number().min(1).max(8),
  currentPlayers: z.array(PlayerSchema),
  status: GameStatusSchema,
  currentMapId: z.string().optional(),
  gameState: z.record(z.any()), // Flexible storage for game state
  actions: z.array(GameActionSchema),
  events: z.array(GameEventSchema),
  diceRolls: z.array(DiceRollSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastActiveAt: z.date(),
});

export const GameInviteSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  inviterId: z.string(),
  inviteeId: z.string(),
  status: z.enum(['pending', 'accepted', 'declined', 'expired']),
  createdAt: z.date(),
  expiresAt: z.date(),
});

export type GameStatus = z.infer<typeof GameStatusSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type GameAction = z.infer<typeof GameActionSchema>;
export type GameEvent = z.infer<typeof GameEventSchema>;
export type DiceRoll = z.infer<typeof DiceRollSchema>;
export type GameSession = z.infer<typeof GameSessionSchema>;
export type GameInvite = z.infer<typeof GameInviteSchema>; 