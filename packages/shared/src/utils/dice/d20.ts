import { rollDice, DiceRollResult } from './base';

/**
 * Roll a 20-sided die
 */
export function rollD20(modifier: number = 0): DiceRollResult {
  return rollDice(20, 1, modifier);
}

/**
 * Common d20 use cases in D&D - the core mechanic die
 */

// Core D&D mechanics
export function rollAttack(attackBonus: number): DiceRollResult {
  const result = rollD20(attackBonus);
  const isCritical = result.rolls[0] === 20;
  const isCriticalMiss = result.rolls[0] === 1;
  
  let description = `Attack roll: ${result.description}`;
  if (isCritical) description += ' (CRITICAL HIT!)';
  if (isCriticalMiss) description += ' (Critical Miss)';
  
  return {
    ...result,
    description,
  };
}

export function rollAttackWithAdvantage(attackBonus: number): DiceRollResult {
  const roll1 = rollD20(attackBonus);
  const roll2 = rollD20(attackBonus);
  
  const higherRoll = roll1.total > roll2.total ? roll1 : roll2;
  const isCritical = Math.max(roll1.rolls[0]!, roll2.rolls[0]!) === 20;
  
  let description = `Attack roll (Advantage): ${higherRoll.description}`;
  if (isCritical) description += ' (CRITICAL HIT!)';
  
  return {
    ...higherRoll,
    description,
  };
}

export function rollAttackWithDisadvantage(attackBonus: number): DiceRollResult {
  const roll1 = rollD20(attackBonus);
  const roll2 = rollD20(attackBonus);
  
  const lowerRoll = roll1.total < roll2.total ? roll1 : roll2;
  const isCriticalMiss = Math.min(roll1.rolls[0]!, roll2.rolls[0]!) === 1;
  
  let description = `Attack roll (Disadvantage): ${lowerRoll.description}`;
  if (isCriticalMiss) description += ' (Critical Miss)';
  
  return {
    ...lowerRoll,
    description,
  };
}

// Saving throws
export function rollSavingThrow(abilityScore: number, proficient: boolean = false, level: number = 1): DiceRollResult {
  const modifier = getModifier(abilityScore);
  const proficiencyBonus = proficient ? getProficiencyBonus(level) : 0;
  const result = rollD20(modifier + proficiencyBonus);
  
  return {
    ...result,
    description: `Saving throw: ${result.description}`,
  };
}

export function rollDeathSave(): DiceRollResult {
  const result = rollD20();
  const isSuccess = result.total >= 10;
  const isCritical = result.total === 20;
  const isCriticalFailure = result.total === 1;
  
  let description = 'Death Save: ';
  if (isCritical) {
    description += 'Critical Success - Regain 1 HP!';
  } else if (isCriticalFailure) {
    description += 'Critical Failure - 2 failures!';
  } else if (isSuccess) {
    description += 'Success';
  } else {
    description += 'Failure';
  }
  
  return {
    ...result,
    description,
  };
}

// Skill checks
export function rollSkillCheck(abilityScore: number, proficient: boolean = false, level: number = 1, skillName: string = 'Skill'): DiceRollResult {
  const modifier = getModifier(abilityScore);
  const proficiencyBonus = proficient ? getProficiencyBonus(level) : 0;
  const result = rollD20(modifier + proficiencyBonus);
  
  return {
    ...result,
    description: `${skillName} check: ${result.description}`,
  };
}

export function rollSkillCheckWithAdvantage(abilityScore: number, proficient: boolean = false, level: number = 1, skillName: string = 'Skill'): DiceRollResult {
  const modifier = getModifier(abilityScore);
  const proficiencyBonus = proficient ? getProficiencyBonus(level) : 0;
  const totalModifier = modifier + proficiencyBonus;
  
  const roll1 = rollD20(totalModifier);
  const roll2 = rollD20(totalModifier);
  
  const higherRoll = roll1.total > roll2.total ? roll1 : roll2;
  
  return {
    ...higherRoll,
    description: `${skillName} check (Advantage): ${higherRoll.description}`,
  };
}

// Initiative
export function rollInitiative(dexterity: number): DiceRollResult {
  const result = rollD20(getModifier(dexterity));
  return {
    ...result,
    description: `Initiative: ${result.description}`,
  };
}

// Concentration saves
export function rollConcentrationSave(constitutionScore: number, damage: number, proficient: boolean = false, level: number = 1): DiceRollResult {
  const dc = Math.max(10, Math.floor(damage / 2));
  const save = rollSavingThrow(constitutionScore, proficient, level);
  
  return {
    ...save,
    description: `Concentration Save (DC ${dc}): ${save.total >= dc ? 'Success' : 'Failure'} - ${save.total}`,
  };
}

// Ability checks
export function rollAbilityCheck(abilityScore: number, abilityName: string): DiceRollResult {
  const result = rollD20(getModifier(abilityScore));
  return {
    ...result,
    description: `${abilityName} check: ${result.description}`,
  };
}

// Inspiration and luck
export function rollWithInspiration(baseRoll: DiceRollResult): DiceRollResult {
  const inspirationRoll = rollD20();
  const betterRoll = baseRoll.total > inspirationRoll.total ? baseRoll : inspirationRoll;
  
  return {
    ...betterRoll,
    description: `${betterRoll.description} (with Inspiration)`,
  };
}

// Random tables using d20
export function rollRandomEvent(): DiceRollResult {
  const result = rollD20();
  let eventType = 'Normal Day';
  
  if (result.total <= 5) eventType = 'Peaceful';
  else if (result.total <= 10) eventType = 'Normal';
  else if (result.total <= 15) eventType = 'Interesting';
  else if (result.total <= 18) eventType = 'Exciting';
  else if (result.total === 19) eventType = 'Dangerous';
  else eventType = 'Legendary';
  
  return {
    ...result,
    description: `Random Event: ${eventType}`,
  };
}

export function rollCriticalHitLocation(): DiceRollResult {
  const result = rollD20();
  const locations = [
    'Head', 'Head', 'Neck', 'Left Shoulder', 'Right Shoulder',
    'Left Arm', 'Right Arm', 'Chest', 'Chest', 'Chest',
    'Abdomen', 'Abdomen', 'Left Hip', 'Right Hip', 'Left Leg',
    'Right Leg', 'Left Foot', 'Right Foot', 'Vitals', 'Heart'
  ];
  
  return {
    ...result,
    description: `Critical Hit Location: ${locations[result.total - 1]}`,
  };
}

// Spell attack rolls
export function rollSpellAttack(spellAttackBonus: number, spellName: string = 'Spell'): DiceRollResult {
  const result = rollD20(spellAttackBonus);
  const isCritical = result.rolls[0] === 20;
  
  let description = `${spellName} attack: ${result.description}`;
  if (isCritical) description += ' (CRITICAL HIT!)';
  
  return {
    ...result,
    description,
  };
}

// Helper functions
function getModifier(abilityScore: number): number {
  return Math.floor((abilityScore - 10) / 2);
}

function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
} 