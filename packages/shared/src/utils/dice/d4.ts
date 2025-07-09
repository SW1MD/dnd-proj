import { rollDice, DiceRollResult } from './base';

/**
 * Roll a 4-sided die
 */
export function rollD4(count: number = 1, modifier: number = 0): DiceRollResult {
  return rollDice(4, count, modifier);
}

/**
 * Common d4 use cases in D&D
 */

// Damage rolls that commonly use d4
export function rollDaggerDamage(modifier: number = 0): DiceRollResult {
  const result = rollD4(1, modifier);
  return {
    ...result,
    description: `Dagger damage: ${result.description}`,
  };
}

export function rollDartDamage(modifier: number = 0): DiceRollResult {
  const result = rollD4(1, modifier);
  return {
    ...result,
    description: `Dart damage: ${result.description}`,
  };
}

export function rollSlingDamage(modifier: number = 0): DiceRollResult {
  const result = rollD4(1, modifier);
  return {
    ...result,
    description: `Sling damage: ${result.description}`,
  };
}

// Healing spells that use d4
export function rollCureWounds(level: number = 1, modifier: number = 0): DiceRollResult {
  const result = rollD4(level, modifier);
  return {
    ...result,
    description: `Cure Wounds (${level}d4${modifier !== 0 ? (modifier > 0 ? '+' : '') + modifier : ''}): ${result.total}`,
  };
}

export function rollHealingPotion(modifier: number = 0): DiceRollResult {
  const result = rollD4(2, modifier + 2); // 2d4+2
  return {
    ...result,
    description: `Healing Potion: ${result.description}`,
  };
}

// Ability score generation (old method - 3d6 uses d6, but some variants use 4d4)
export function rollAbilityScore4d4(): number {
  const rolls = [rollD4().total, rollD4().total, rollD4().total, rollD4().total];
  rolls.sort((a, b) => b - a);
  return rolls[0] + rolls[1] + rolls[2];
}

// Random tables that use d4
export function rollRandomDirection(): DiceRollResult {
  const result = rollD4();
  const directions = ['North', 'East', 'South', 'West'];
  
  return {
    ...result,
    description: `Random Direction: ${directions[result.total - 1]}`,
  };
}

export function rollWeatherIntensity(): DiceRollResult {
  const result = rollD4();
  const intensities = ['Light', 'Moderate', 'Heavy', 'Severe'];
  
  return {
    ...result,
    description: `Weather Intensity: ${intensities[result.total - 1]}`,
  };
} 