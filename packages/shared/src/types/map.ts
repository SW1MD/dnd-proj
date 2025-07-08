import { z } from 'zod';

export const TerrainTypeSchema = z.enum([
  'floor',
  'wall',
  'door',
  'stairs',
  'trap',
  'water',
  'lava',
  'pit',
  'chest',
  'altar',
  'pillar',
]);

export const MapTileSchema = z.object({
  x: z.number(),
  y: z.number(),
  terrain: TerrainTypeSchema,
  isPassable: z.boolean(),
  isVisible: z.boolean(),
  hasBeenExplored: z.boolean(),
  description: z.string().optional(),
  items: z.array(z.string()).optional(), // Item IDs
  npcs: z.array(z.string()).optional(), // NPC IDs
});

export const NPCSchema = z.object({
  id: z.string(),
  name: z.string(),
  race: z.string(),
  class: z.string().optional(),
  level: z.number().min(1),
  hitPoints: z.object({
    current: z.number().min(0),
    maximum: z.number().min(1),
  }),
  armorClass: z.number().min(1),
  abilities: z.object({
    strength: z.number().min(1).max(30),
    dexterity: z.number().min(1).max(30),
    constitution: z.number().min(1).max(30),
    intelligence: z.number().min(1).max(30),
    wisdom: z.number().min(1).max(30),
    charisma: z.number().min(1).max(30),
  }),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  disposition: z.enum(['hostile', 'neutral', 'friendly']),
  dialogue: z.array(z.string()).optional(),
  questGiver: z.boolean().default(false),
  description: z.string(),
  aiPersonality: z.string().optional(), // AI prompt for personality
});

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['chamber', 'corridor', 'entrance', 'treasure', 'boss', 'puzzle', 'trap']),
  bounds: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  connections: z.array(z.string()), // Connected room IDs
  npcs: z.array(z.string()), // NPC IDs in this room
  items: z.array(z.string()), // Item IDs in this room
  hasBeenVisited: z.boolean().default(false),
  lightLevel: z.enum(['bright', 'dim', 'dark']),
  ambientSound: z.string().optional(),
  specialFeatures: z.array(z.string()).optional(),
});

export const MapSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['dungeon', 'overworld', 'building', 'cave', 'forest', 'city']),
  width: z.number().min(10),
  height: z.number().min(10),
  tiles: z.array(z.array(MapTileSchema)),
  rooms: z.array(RoomSchema),
  npcs: z.array(NPCSchema),
  startingPosition: z.object({
    x: z.number(),
    y: z.number(),
  }),
  theme: z.string(), // e.g., "ancient tomb", "goblin lair", "wizard tower"
  difficulty: z.enum(['easy', 'medium', 'hard', 'deadly']),
  recommendedLevel: z.number().min(1).max(20),
  aiGenerationPrompt: z.string().optional(), // Prompt used to generate this map
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const LocationSchema = z.object({
  id: z.string(),
  mapId: z.string(),
  name: z.string(),
  description: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  type: z.enum(['poi', 'spawn', 'exit', 'shop', 'inn', 'temple', 'quest']),
  isActive: z.boolean(),
  requirements: z.record(z.any()).optional(), // Requirements to access this location
});

export type TerrainType = z.infer<typeof TerrainTypeSchema>;
export type MapTile = z.infer<typeof MapTileSchema>;
export type NPC = z.infer<typeof NPCSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type Map = z.infer<typeof MapSchema>;
export type Location = z.infer<typeof LocationSchema>; 