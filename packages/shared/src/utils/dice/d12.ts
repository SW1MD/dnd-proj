import { rollDice, DiceRollResult } from './base';

/**
 * Roll a 12-sided die
 */
export function rollD12(count: number = 1, modifier: number = 0): DiceRollResult {
  return rollDice(12, count, modifier);
}

/**
 * Common d12 use cases in D&D
 */

// Hit point rolling for d12 hit die classes (Barbarian)
export function rollHitPointsD12(constitution: number, level: number): number {
  let hp = 12; // First level gets max HP for d12 classes
  
  for (let i = 2; i <= level; i++) {
    hp += rollD12().total;
  }
  
  hp += getModifier(constitution) * level;
  return Math.max(1, hp);
}

// Damage rolls that commonly use d12
export function rollGreataxeDamage(modifier: number = 0): DiceRollResult {
  const result = rollD12(1, modifier);
  return {
    ...result,
    description: `Greataxe damage: ${result.description}`,
  };
}

export function rollLanceDamage(modifier: number = 0): DiceRollResult {
  const result = rollD12(1, modifier);
  return {
    ...result,
    description: `Lance damage: ${result.description}`,
  };
}

export function rollBarbarianRageDamage(level: number): number {
  // Rage damage bonus increases with level
  if (level < 9) return 2;
  if (level < 16) return 3;
  return 4;
}

// Spell damage that commonly uses d12
export function rollPoisonSprayDamage(level: number = 1): DiceRollResult {
  const diceCount = Math.ceil(level / 5); // Scales at 5th, 11th, 17th level
  const result = rollD12(diceCount);
  return {
    ...result,
    description: `Poison Spray damage (${diceCount}d12): ${result.total}`,
  };
}

export function rollHealingWordDamage(level: number = 1): DiceRollResult {
  const result = rollD12(level); // 1d4 + spellcasting modifier actually, but using d12 for stronger variant
  return {
    ...result,
    description: `Healing Word (Greater) (${level}d12): ${result.total}`,
  };
}

// Time-based rolls (12 hours, months, etc.)
export function rollTimeOfDay(): DiceRollResult {
  const result = rollD12();
  const times = [
    '12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM',
    '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM'
  ];
  
  return {
    ...result,
    description: `Time of Day: ${times[result.total - 1]}`,
  };
}

export function rollMonth(): DiceRollResult {
  const result = rollD12();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return {
    ...result,
    description: `Month: ${months[result.total - 1]}`,
  };
}

// Random personality traits
export function rollPersonalityTrait(): DiceRollResult {
  const result = rollD12();
  const traits = [
    'Brave', 'Cautious', 'Curious', 'Generous', 'Gruff', 'Honest',
    'Impulsive', 'Loyal', 'Mysterious', 'Optimistic', 'Pessimistic', 'Witty'
  ];
  
  return {
    ...result,
    description: `Personality Trait: ${traits[result.total - 1]}`,
  };
}

// Random magical phenomena
export function rollMagicalPhenomena(): DiceRollResult {
  const result = rollD12();
  const phenomena = [
    'Glowing Aura', 'Floating Objects', 'Temperature Drop', 'Whispers',
    'Color Change', 'Sparkles', 'Humming Sound', 'Scent of Flowers',
    'Temporary Flight', 'Illusion', 'Time Slowdown', 'Telepathy'
  ];
  
  return {
    ...result,
    description: `Magical Phenomena: ${phenomena[result.total - 1]}`,
  };
}

// Random room contents
export function rollRoomContents(): DiceRollResult {
  const result = rollD12();
  const contents = [
    'Empty', 'Furniture', 'Books/Scrolls', 'Weapons', 'Armor',
    'Coins', 'Gems', 'Art', 'Tools', 'Food', 'Clothing', 'Magic Items'
  ];
  
  return {
    ...result,
    description: `Room Contents: ${contents[result.total - 1]}`,
  };
}

// Wild magic surge table entry (simplified)
export function rollWildMagicType(): DiceRollResult {
  const result = rollD12();
  const magicTypes = [
    'Transformation', 'Teleportation', 'Illusion', 'Evocation',
    'Enchantment', 'Divination', 'Necromancy', 'Transmutation',
    'Conjuration', 'Abjuration', 'Beneficial', 'Chaotic'
  ];
  
  return {
    ...result,
    description: `Wild Magic Type: ${magicTypes[result.total - 1]}`,
  };
}

// Barbarian rage duration (turns)
export function rollRageDuration(): DiceRollResult {
  const result = rollD12();
  return {
    ...result,
    description: `Rage Duration: ${result.total} rounds`,
  };
}

// Helper function for ability modifiers
function getModifier(abilityScore: number): number {
  return Math.floor((abilityScore - 10) / 2);
} 