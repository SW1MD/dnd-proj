import { z } from 'zod';

export const AbilityScoreSchema = z.object({
  strength: z.number().min(1).max(30),
  dexterity: z.number().min(1).max(30),
  constitution: z.number().min(1).max(30),
  intelligence: z.number().min(1).max(30),
  wisdom: z.number().min(1).max(30),
  charisma: z.number().min(1).max(30),
});

export const SkillSchema = z.object({
  acrobatics: z.number().optional(),
  animalHandling: z.number().optional(),
  arcana: z.number().optional(),
  athletics: z.number().optional(),
  deception: z.number().optional(),
  history: z.number().optional(),
  insight: z.number().optional(),
  intimidation: z.number().optional(),
  investigation: z.number().optional(),
  medicine: z.number().optional(),
  nature: z.number().optional(),
  perception: z.number().optional(),
  performance: z.number().optional(),
  persuasion: z.number().optional(),
  religion: z.number().optional(),
  sleightOfHand: z.number().optional(),
  stealth: z.number().optional(),
  survival: z.number().optional(),
});

export const CharacterClassSchema = z.enum([
  'barbarian',
  'bard',
  'cleric',
  'druid',
  'fighter',
  'monk',
  'paladin',
  'ranger',
  'rogue',
  'sorcerer',
  'warlock',
  'wizard',
]);

export const CharacterRaceSchema = z.enum([
  'human',
  'elf',
  'dwarf',
  'halfling',
  'dragonborn',
  'gnome',
  'half-elf',
  'half-orc',
  'tiefling',
]);

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  quantity: z.number().min(0),
  weight: z.number().min(0),
  value: z.number().min(0),
  rarity: z.enum(['common', 'uncommon', 'rare', 'very_rare', 'legendary']),
  type: z.enum(['weapon', 'armor', 'consumable', 'tool', 'misc']),
});

export const SpellSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().min(0).max(9),
  school: z.enum(['abjuration', 'conjuration', 'divination', 'enchantment', 'evocation', 'illusion', 'necromancy', 'transmutation']),
  castingTime: z.string(),
  range: z.string(),
  components: z.array(z.enum(['V', 'S', 'M'])),
  duration: z.string(),
  description: z.string(),
  higherLevel: z.string().optional(),
});

export const CharacterSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  class: CharacterClassSchema,
  race: CharacterRaceSchema,
  level: z.number().min(1).max(20),
  experience: z.number().min(0),
  hitPoints: z.object({
    current: z.number().min(0),
    maximum: z.number().min(1),
    temporary: z.number().min(0).default(0),
  }),
  armorClass: z.number().min(1),
  proficiencyBonus: z.number().min(2),
  speed: z.number().min(0),
  abilities: AbilityScoreSchema,
  skills: SkillSchema,
  inventory: z.array(ItemSchema),
  spells: z.array(SpellSchema),
  background: z.string(),
  alignment: z.string(),
  personalityTraits: z.string().optional(),
  ideals: z.string().optional(),
  bonds: z.string().optional(),
  flaws: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AbilityScore = z.infer<typeof AbilityScoreSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type CharacterClass = z.infer<typeof CharacterClassSchema>;
export type CharacterRace = z.infer<typeof CharacterRaceSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Spell = z.infer<typeof SpellSchema>;
export type Character = z.infer<typeof CharacterSchema>; 