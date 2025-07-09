import { rollDice, DiceRollResult } from './base';

/**
 * Roll a 6-sided die
 */
export function rollD6(count: number = 1, modifier: number = 0): DiceRollResult {
  return rollDice(6, count, modifier);
}

/**
 * Common d6 use cases in D&D
 */

// Ability score generation (standard method)
export function rollAbilityScore(): number {
  // Roll 4d6, drop lowest
  const rolls = [rollD6().total, rollD6().total, rollD6().total, rollD6().total];
  rolls.sort((a, b) => b - a);
  return rolls[0] + rolls[1] + rolls[2];
}

export function rollAbilityScoreArray(): number[] {
  const abilities = [];
  for (let i = 0; i < 6; i++) {
    abilities.push(rollAbilityScore());
  }
  return abilities;
}

// Hit point rolling for d6 hit die classes
export function rollHitPointsD6(constitution: number, level: number): number {
  let hp = 6; // First level gets max HP for d6 classes
  
  for (let i = 2; i <= level; i++) {
    hp += rollD6().total;
  }
  
  hp += getModifier(constitution) * level;
  return Math.max(1, hp);
}

// Damage rolls that commonly use d6
export function rollShortswordDamage(modifier: number = 0): DiceRollResult {
  const result = rollD6(1, modifier);
  return {
    ...result,
    description: `Shortsword damage: ${result.description}`,
  };
}

export function rollShortbowDamage(modifier: number = 0): DiceRollResult {
  const result = rollD6(1, modifier);
  return {
    ...result,
    description: `Shortbow damage: ${result.description}`,
  };
}

export function rollFireboltDamage(level: number = 1): DiceRollResult {
  const diceCount = Math.ceil(level / 5); // Scales at 5th, 11th, 17th level
  const result = rollD6(diceCount);
  return {
    ...result,
    description: `Fire Bolt damage (${diceCount}d6): ${result.total}`,
  };
}

// Spell damage that commonly uses d6
export function rollFireballDamage(): DiceRollResult {
  const result = rollD6(8); // 8d6
  return {
    ...result,
    description: `Fireball damage: ${result.description}`,
  };
}

export function rollBurningHandsDamage(level: number = 1): DiceRollResult {
  const result = rollD6(level + 2); // Base 3d6, +1d6 per slot level above 1st
  return {
    ...result,
    description: `Burning Hands damage (${level + 2}d6): ${result.total}`,
  };
}

// Starting gold by class (commonly uses d6)
export function rollStartingGold(characterClass: string): number {
  const goldDice: Record<string, { count: number; multiplier: number }> = {
    barbarian: { count: 2, multiplier: 10 }, // 2d4 × 10
    bard: { count: 3, multiplier: 10 }, // 3d4 × 10
    cleric: { count: 5, multiplier: 10 }, // 5d4 × 10
    druid: { count: 2, multiplier: 10 }, // 2d4 × 10
    fighter: { count: 5, multiplier: 10 }, // 5d4 × 10
    monk: { count: 5, multiplier: 1 }, // 5d4 gp
    paladin: { count: 5, multiplier: 10 }, // 5d4 × 10
    ranger: { count: 5, multiplier: 10 }, // 5d4 × 10
    rogue: { count: 4, multiplier: 10 }, // 4d4 × 10
    sorcerer: { count: 3, multiplier: 10 }, // 3d4 × 10
    warlock: { count: 4, multiplier: 10 }, // 4d4 × 10
    wizard: { count: 4, multiplier: 10 }, // 4d4 × 10
  };

  const dice = goldDice[characterClass] || goldDice.fighter;
  const result = rollD6(dice.count); // Using d6 for variety
  return result.total * dice.multiplier;
}

// Random encounters and tables
export function rollRandomEncounter(): DiceRollResult {
  const result = rollD6();
  const encounters = [
    'Bandits',
    'Wild Animals',
    'Travelers',
    'Merchant Caravan',
    'Patrol Guards',
    'Mysterious Stranger'
  ];
  
  return {
    ...result,
    description: `Random Encounter: ${encounters[result.total - 1]}`,
  };
}

export function rollTreasureType(): DiceRollResult {
  const result = rollD6();
  const treasureTypes = [
    'Coins',
    'Gems',
    'Jewelry',
    'Art Object',
    'Magic Item',
    'Ancient Relic'
  ];
  
  return {
    ...result,
    description: `Treasure Type: ${treasureTypes[result.total - 1]}`,
  };
}

// Helper function for ability modifiers
function getModifier(abilityScore: number): number {
  return Math.floor((abilityScore - 10) / 2);
} 