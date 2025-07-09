import { rollDice, DiceRollResult } from './base';

/**
 * Roll a 10-sided die
 */
export function rollD10(count: number = 1, modifier: number = 0): DiceRollResult {
  return rollDice(10, count, modifier);
}

/**
 * Common d10 use cases in D&D
 */

// Hit point rolling for d10 hit die classes
export function rollHitPointsD10(constitution: number, level: number): number {
  let hp = 10; // First level gets max HP for d10 classes
  
  for (let i = 2; i <= level; i++) {
    hp += rollD10().total;
  }
  
  hp += getModifier(constitution) * level;
  return Math.max(1, hp);
}

// Damage rolls that commonly use d10
export function rollGreatswordDamage(modifier: number = 0): DiceRollResult {
  const result = rollD10(2, modifier); // 2d6 actually, but some variants use 2d10
  return {
    ...result,
    description: `Greatsword damage: ${result.description}`,
  };
}

export function rollHeavyCrossbowDamage(modifier: number = 0): DiceRollResult {
  const result = rollD10(1, modifier);
  return {
    ...result,
    description: `Heavy Crossbow damage: ${result.description}`,
  };
}

export function rollPikeDamage(modifier: number = 0): DiceRollResult {
  const result = rollD10(1, modifier);
  return {
    ...result,
    description: `Pike damage: ${result.description}`,
  };
}

export function rollGlaiveDamage(modifier: number = 0): DiceRollResult {
  const result = rollD10(1, modifier);
  return {
    ...result,
    description: `Glaive damage: ${result.description}`,
  };
}

// Spell damage that commonly uses d10
export function rollEldritchBlastDamage(level: number = 1): DiceRollResult {
  const diceCount = Math.ceil(level / 5); // Scales at 5th, 11th, 17th level
  const result = rollD10(diceCount);
  return {
    ...result,
    description: `Eldritch Blast damage (${diceCount}d10): ${result.total}`,
  };
}

export function rollHarmDamage(): DiceRollResult {
  const result = rollD10(14); // Harm spell: 14d10
  return {
    ...result,
    description: `Harm damage: ${result.description}`,
  };
}

export function rollConeOfColdDamage(level: number = 5): DiceRollResult {
  const result = rollD10(level + 3); // Base 8d10, +1d10 per slot level above 5th
  return {
    ...result,
    description: `Cone of Cold damage (${level + 3}d10): ${result.total}`,
  };
}

// Percentile rolls (using d10 for tens digit)
export function rollPercentileTens(): DiceRollResult {
  const result = rollD10();
  const tensValue = (result.total === 10) ? 0 : result.total - 1; // 1-9 becomes 0-8, 10 becomes 0
  
  return {
    total: tensValue * 10,
    rolls: [result.total],
    modifier: 0,
    description: `Percentile tens: ${tensValue}0`,
  };
}

// Random encounter strength
export function rollEncounterDifficulty(): DiceRollResult {
  const result = rollD10();
  const difficulties = [
    'Trivial', 'Easy', 'Easy', 'Medium', 'Medium', 
    'Medium', 'Hard', 'Hard', 'Deadly', 'Legendary'
  ];
  
  return {
    ...result,
    description: `Encounter Difficulty: ${difficulties[result.total - 1]}`,
  };
}

// Treasure quantity
export function rollTreasureQuantity(): DiceRollResult {
  const result = rollD10();
  return {
    ...result,
    description: `Treasure Quantity: ${result.total} items`,
  };
}

// Magic item rarity determination
export function rollMagicItemRarity(): DiceRollResult {
  const result = rollD10();
  let rarity = 'Common';
  
  if (result.total <= 6) rarity = 'Common';
  else if (result.total <= 8) rarity = 'Uncommon';
  else if (result.total === 9) rarity = 'Rare';
  else rarity = 'Very Rare';
  
  return {
    ...result,
    description: `Magic Item Rarity: ${rarity}`,
  };
}

// Distance (in various units)
export function rollDistance(): DiceRollResult {
  const result = rollD10();
  return {
    ...result,
    description: `Distance: ${result.total} miles`,
  };
}

export function rollDistanceFeet(): DiceRollResult {
  const result = rollD10(2); // 2d10
  return {
    ...result,
    description: `Distance: ${result.total * 5} feet`,
  };
}

// Helper function for ability modifiers
function getModifier(abilityScore: number): number {
  return Math.floor((abilityScore - 10) / 2);
} 