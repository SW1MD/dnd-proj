import { rollDice } from './base';

export function rollAbilityScore(): number {
  // Roll 4d6, drop lowest
  const rolls = [rollDice(6).total, rollDice(6).total, rollDice(6).total, rollDice(6).total];
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

export function rollHitPoints(hitDie: number, constitution: number, level: number): number {
  let hp = hitDie; // First level gets max HP
  
  for (let i = 2; i <= level; i++) {
    hp += rollDice(hitDie).total;
  }
  
  hp += getModifier(constitution) * level;
  return Math.max(1, hp);
}

export function rollHitPointsAtLevel(hitDie: number, constitution: number): number {
  return rollDice(hitDie).total + getModifier(constitution);
}

export function getModifier(abilityScore: number): number {
  return Math.floor((abilityScore - 10) / 2);
}

export function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function rollStartingGold(characterClass: string): number {
  const goldDice: Record<string, { count: number; sides: number; multiplier: number }> = {
    barbarian: { count: 2, sides: 4, multiplier: 10 },
    bard: { count: 3, sides: 4, multiplier: 10 },
    cleric: { count: 5, sides: 4, multiplier: 10 },
    druid: { count: 2, sides: 4, multiplier: 10 },
    fighter: { count: 5, sides: 4, multiplier: 10 },
    monk: { count: 5, sides: 4, multiplier: 1 },
    paladin: { count: 5, sides: 4, multiplier: 10 },
    ranger: { count: 5, sides: 4, multiplier: 10 },
    rogue: { count: 4, sides: 4, multiplier: 10 },
    sorcerer: { count: 3, sides: 4, multiplier: 10 },
    warlock: { count: 4, sides: 4, multiplier: 10 },
    wizard: { count: 4, sides: 4, multiplier: 10 },
  };

  const dice = goldDice[characterClass] || goldDice.fighter;
  const result = rollDice(dice.sides, dice.count);
  return result.total * dice.multiplier;
}

export function rollHeight(race: string, gender: string): number {
  // Simplified height rolling - in a full implementation, you'd have detailed tables
  const baseHeight = 60; // inches
  const modifier = rollDice(10, 2).total - 2; // 0-18
  return baseHeight + modifier;
}

export function rollWeight(race: string, gender: string, height: number): number {
  // Simplified weight rolling
  const baseWeight = 120; // pounds
  const modifier = rollDice(6, 2).total * 5; // 10-60
  return baseWeight + modifier;
} 