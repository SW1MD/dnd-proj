export interface DiceRollResult {
  total: number;
  rolls: number[];
  modifier: number;
  description: string;
}

export function rollDice(sides: number, count: number = 1, modifier: number = 0): DiceRollResult {
  const rolls: number[] = [];
  
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }
  
  const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
  
  return {
    total,
    rolls,
    modifier,
    description: `${count}d${sides}${modifier !== 0 ? (modifier > 0 ? '+' : '') + modifier : ''}`,
  };
}

export function rollD20(modifier: number = 0): DiceRollResult {
  return rollDice(20, 1, modifier);
}

export function rollD6(count: number = 1, modifier: number = 0): DiceRollResult {
  return rollDice(6, count, modifier);
}

export function rollD8(count: number = 1, modifier: number = 0): DiceRollResult {
  return rollDice(8, count, modifier);
}

export function rollD10(count: number = 1, modifier: number = 0): DiceRollResult {
  return rollDice(10, count, modifier);
}

export function rollD12(count: number = 1, modifier: number = 0): DiceRollResult {
  return rollDice(12, count, modifier);
}

export function rollAbilityScore(): number {
  // Roll 4d6, drop lowest
  const rolls = [rollDice(6).total, rollDice(6).total, rollDice(6).total, rollDice(6).total];
  rolls.sort((a, b) => b - a);
  return rolls[0] + rolls[1] + rolls[2];
}

export function rollHitPoints(hitDie: number, constitution: number, level: number): number {
  let hp = hitDie; // First level gets max HP
  
  for (let i = 2; i <= level; i++) {
    hp += rollDice(hitDie).total;
  }
  
  hp += getModifier(constitution) * level;
  return Math.max(1, hp);
}

export function getModifier(abilityScore: number): number {
  return Math.floor((abilityScore - 10) / 2);
}

export function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function rollInitiative(dexterity: number): DiceRollResult {
  return rollD20(getModifier(dexterity));
}

export function rollAttack(attackBonus: number): DiceRollResult {
  return rollD20(attackBonus);
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