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

export function rollD4(count: number = 1, modifier: number = 0): DiceRollResult {
  return rollDice(4, count, modifier);
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

export function rollD20(modifier: number = 0): DiceRollResult {
  return rollDice(20, 1, modifier);
}

export function rollD100(): DiceRollResult {
  return rollDice(100, 1, 0);
}

export function rollPercentile(): DiceRollResult {
  // Roll percentile dice (00-99)
  const tens = rollDice(10, 1, 0).total - 1; // 0-9
  const ones = rollDice(10, 1, 0).total - 1; // 0-9
  const total = tens * 10 + ones;
  
  return {
    total,
    rolls: [tens, ones],
    modifier: 0,
    description: 'd%',
  };
} 