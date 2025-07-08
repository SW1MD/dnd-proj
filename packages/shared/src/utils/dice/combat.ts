import { rollDice, rollD20, DiceRollResult } from './base';
import { getModifier, getProficiencyBonus } from './character';

export function rollInitiative(dexterity: number): DiceRollResult {
  return rollD20(getModifier(dexterity));
}

export function rollAttack(attackBonus: number): DiceRollResult {
  return rollD20(attackBonus);
}

export function rollAttackWithAdvantage(attackBonus: number): DiceRollResult {
  const roll1 = rollD20(attackBonus);
  const roll2 = rollD20(attackBonus);
  
  const higherRoll = roll1.total > roll2.total ? roll1 : roll2;
  
  return {
    ...higherRoll,
    description: `${higherRoll.description} (Advantage)`,
  };
}

export function rollAttackWithDisadvantage(attackBonus: number): DiceRollResult {
  const roll1 = rollD20(attackBonus);
  const roll2 = rollD20(attackBonus);
  
  const lowerRoll = roll1.total < roll2.total ? roll1 : roll2;
  
  return {
    ...lowerRoll,
    description: `${lowerRoll.description} (Disadvantage)`,
  };
}

export function rollDamage(damageDice: string, modifier: number = 0): DiceRollResult {
  const match = damageDice.match(/(\d+)d(\d+)/);
  if (!match) {
    throw new Error('Invalid damage dice format');
  }
  
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  
  return rollDice(sides, count, modifier);
}

export function rollCriticalDamage(damageDice: string, modifier: number = 0): DiceRollResult {
  const match = damageDice.match(/(\d+)d(\d+)/);
  if (!match) {
    throw new Error('Invalid damage dice format');
  }
  
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  
  // Double the dice for critical hits
  const result = rollDice(sides, count * 2, modifier);
  return {
    ...result,
    description: `${result.description} (Critical)`,
  };
}

export function rollSavingThrow(abilityScore: number, proficient: boolean = false, level: number = 1): DiceRollResult {
  const modifier = getModifier(abilityScore);
  const proficiencyBonus = proficient ? getProficiencyBonus(level) : 0;
  return rollD20(modifier + proficiencyBonus);
}

export function rollSkillCheck(abilityScore: number, proficient: boolean = false, level: number = 1): DiceRollResult {
  const modifier = getModifier(abilityScore);
  const proficiencyBonus = proficient ? getProficiencyBonus(level) : 0;
  return rollD20(modifier + proficiencyBonus);
}

export function rollSkillCheckWithAdvantage(abilityScore: number, proficient: boolean = false, level: number = 1): DiceRollResult {
  const modifier = getModifier(abilityScore);
  const proficiencyBonus = proficient ? getProficiencyBonus(level) : 0;
  const totalModifier = modifier + proficiencyBonus;
  
  const roll1 = rollD20(totalModifier);
  const roll2 = rollD20(totalModifier);
  
  const higherRoll = roll1.total > roll2.total ? roll1 : roll2;
  
  return {
    ...higherRoll,
    description: `${higherRoll.description} (Advantage)`,
  };
}

export function rollDeathSave(): DiceRollResult {
  const result = rollD20();
  const isSuccess = result.total >= 10;
  const isCritical = result.total === 20;
  
  let description = 'Death Save';
  if (isCritical) {
    description += ' (Critical Success - Regain 1 HP)';
  } else if (isSuccess) {
    description += ' (Success)';
  } else {
    description += ' (Failure)';
  }
  
  return {
    ...result,
    description,
  };
}

export function rollConcentrationSave(constitutionScore: number, damage: number, proficient: boolean = false, level: number = 1): DiceRollResult {
  const dc = Math.max(10, Math.floor(damage / 2));
  const save = rollSavingThrow(constitutionScore, proficient, level);
  
  return {
    ...save,
    description: `Concentration Save (DC ${dc}) - ${save.total >= dc ? 'Success' : 'Failure'}`,
  };
}

export function rollHealingDice(healingDice: string, modifier: number = 0): DiceRollResult {
  return rollDamage(healingDice, modifier);
}

export function rollRandomEncounter(): DiceRollResult {
  return rollDice(100);
}

export function rollMorale(): DiceRollResult {
  return rollDice(20);
}

export function rollReaction(): DiceRollResult {
  const result = rollDice(20);
  let description = 'Reaction: ';
  
  if (result.total <= 4) {
    description += 'Hostile';
  } else if (result.total <= 8) {
    description += 'Unfriendly';
  } else if (result.total <= 12) {
    description += 'Neutral';
  } else if (result.total <= 16) {
    description += 'Friendly';
  } else {
    description += 'Helpful';
  }
  
  return {
    ...result,
    description,
  };
} 