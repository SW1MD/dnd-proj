import { rollDice, DiceRollResult } from './base';

/**
 * Roll an 8-sided die
 */
export function rollD8(count: number = 1, modifier: number = 0): DiceRollResult {
  return rollDice(8, count, modifier);
}

/**
 * Common d8 use cases in D&D
 */

// Hit point rolling for d8 hit die classes (most common)
export function rollHitPointsD8(constitution: number, level: number): number {
  let hp = 8; // First level gets max HP for d8 classes
  
  for (let i = 2; i <= level; i++) {
    hp += rollD8().total;
  }
  
  hp += getModifier(constitution) * level;
  return Math.max(1, hp);
}

// Damage rolls that commonly use d8
export function rollLongswordDamage(modifier: number = 0): DiceRollResult {
  const result = rollD8(1, modifier);
  return {
    ...result,
    description: `Longsword damage: ${result.description}`,
  };
}

export function rollLongbowDamage(modifier: number = 0): DiceRollResult {
  const result = rollD8(1, modifier);
  return {
    ...result,
    description: `Longbow damage: ${result.description}`,
  };
}

export function rollBattleaxeDamage(modifier: number = 0): DiceRollResult {
  const result = rollD8(1, modifier);
  return {
    ...result,
    description: `Battleaxe damage: ${result.description}`,
  };
}

export function rollWarhammer(modifier: number = 0): DiceRollResult {
  const result = rollD8(1, modifier);
  return {
    ...result,
    description: `Warhammer damage: ${result.description}`,
  };
}

// Spell damage that commonly uses d8
export function rollInflictWounds(level: number = 1): DiceRollResult {
  const result = rollD8(level + 2); // Base 3d8, +1d8 per slot level above 1st
  return {
    ...result,
    description: `Inflict Wounds damage (${level + 2}d8): ${result.total}`,
  };
}

export function rollGuardingBondHealing(): DiceRollResult {
  const result = rollD8(1);
  return {
    ...result,
    description: `Guarding Bond healing: ${result.description}`,
  };
}

export function rollSacredFlameDamage(level: number = 1): DiceRollResult {
  const diceCount = Math.ceil(level / 5); // Scales at 5th, 11th, 17th level
  const result = rollD8(diceCount);
  return {
    ...result,
    description: `Sacred Flame damage (${diceCount}d8): ${result.total}`,
  };
}

// Random tables and exploration
export function rollDirectionD8(): DiceRollResult {
  const result = rollD8();
  const directions = [
    'North', 'Northeast', 'East', 'Southeast', 
    'South', 'Southwest', 'West', 'Northwest'
  ];
  
  return {
    ...result,
    description: `Direction (8-way): ${directions[result.total - 1]}`,
  };
}

export function rollDungeonFeature(): DiceRollResult {
  const result = rollD8();
  const features = [
    'Empty Room',
    'Monster Lair',
    'Trap',
    'Treasure',
    'Puzzle',
    'Secret Door',
    'Special Feature',
    'Stairs/Exit'
  ];
  
  return {
    ...result,
    description: `Dungeon Feature: ${features[result.total - 1]}`,
  };
}

export function rollNPCMood(): DiceRollResult {
  const result = rollD8();
  const moods = [
    'Hostile',
    'Aggressive',
    'Unfriendly',
    'Neutral',
    'Indifferent',
    'Friendly',
    'Helpful',
    'Enthusiastic'
  ];
  
  return {
    ...result,
    description: `NPC Mood: ${moods[result.total - 1]}`,
  };
}

// Wilderness exploration
export function rollWeatherCondition(): DiceRollResult {
  const result = rollD8();
  const conditions = [
    'Clear Skies',
    'Light Clouds',
    'Overcast',
    'Light Rain',
    'Heavy Rain',
    'Fog',
    'Wind',
    'Storm'
  ];
  
  return {
    ...result,
    description: `Weather: ${conditions[result.total - 1]}`,
  };
}

// Helper function for ability modifiers
function getModifier(abilityScore: number): number {
  return Math.floor((abilityScore - 10) / 2);
} 