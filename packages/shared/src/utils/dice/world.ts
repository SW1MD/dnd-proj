import { rollDice, rollD20, rollD100, DiceRollResult } from './base';

export function rollTreasure(challengeRating: number): DiceRollResult {
  // Simplified treasure rolling based on CR
  const baseValue = challengeRating * 50;
  const variance = rollDice(6, 2).total * 10;
  const total = baseValue + variance;
  
  return {
    total,
    rolls: [baseValue, variance],
    modifier: 0,
    description: `Treasure (CR ${challengeRating})`,
  };
}

export function rollWeather(): DiceRollResult {
  const result = rollD20();
  let description = 'Weather: ';
  
  if (result.total <= 4) {
    description += 'Stormy';
  } else if (result.total <= 8) {
    description += 'Overcast';
  } else if (result.total <= 12) {
    description += 'Partly Cloudy';
  } else if (result.total <= 16) {
    description += 'Clear';
  } else {
    description += 'Perfect';
  }
  
  return {
    ...result,
    description,
  };
}

export function rollDirection(): DiceRollResult {
  const result = rollDice(8);
  const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
  
  return {
    ...result,
    description: `Direction: ${directions[result.total - 1]}`,
  };
}

export function rollDistance(): DiceRollResult {
  const result = rollDice(10, 2);
  return {
    ...result,
    description: `Distance: ${result.total} miles`,
  };
}

export function rollDungeonRoom(): DiceRollResult {
  const result = rollD20();
  let description = 'Room Type: ';
  
  if (result.total <= 4) {
    description += 'Empty';
  } else if (result.total <= 8) {
    description += 'Monster';
  } else if (result.total <= 12) {
    description += 'Trap';
  } else if (result.total <= 16) {
    description += 'Treasure';
  } else {
    description += 'Special';
  }
  
  return {
    ...result,
    description,
  };
}

export function rollDungeonSize(): DiceRollResult {
  const width = rollDice(6, 2).total * 5;
  const height = rollDice(6, 2).total * 5;
  
  return {
    total: width * height,
    rolls: [width, height],
    modifier: 0,
    description: `Room Size: ${width}x${height} feet`,
  };
}

export function rollRandomEncounterType(): DiceRollResult {
  const result = rollD100();
  let description = 'Encounter: ';
  
  if (result.total <= 20) {
    description += 'Combat';
  } else if (result.total <= 40) {
    description += 'Social';
  } else if (result.total <= 60) {
    description += 'Exploration';
  } else if (result.total <= 80) {
    description += 'Puzzle';
  } else {
    description += 'Environmental';
  }
  
  return {
    ...result,
    description,
  };
}

export function rollLootQuality(): DiceRollResult {
  const result = rollD100();
  let description = 'Loot Quality: ';
  
  if (result.total <= 50) {
    description += 'Common';
  } else if (result.total <= 75) {
    description += 'Uncommon';
  } else if (result.total <= 90) {
    description += 'Rare';
  } else if (result.total <= 98) {
    description += 'Very Rare';
  } else {
    description += 'Legendary';
  }
  
  return {
    ...result,
    description,
  };
}

export function rollTrapDifficulty(): DiceRollResult {
  const result = rollDice(4);
  const difficulties = ['Easy (DC 10)', 'Medium (DC 15)', 'Hard (DC 20)', 'Deadly (DC 25)'];
  
  return {
    ...result,
    description: `Trap Difficulty: ${difficulties[result.total - 1]}`,
  };
}

export function rollNPCMood(): DiceRollResult {
  const result = rollDice(6);
  const moods = ['Angry', 'Sad', 'Neutral', 'Happy', 'Excited', 'Mysterious'];
  
  return {
    ...result,
    description: `NPC Mood: ${moods[result.total - 1]}`,
  };
}

export function rollRandomMagicItem(): DiceRollResult {
  const result = rollD100();
  let description = 'Magic Item Type: ';
  
  if (result.total <= 20) {
    description += 'Weapon';
  } else if (result.total <= 40) {
    description += 'Armor';
  } else if (result.total <= 60) {
    description += 'Accessory';
  } else if (result.total <= 80) {
    description += 'Consumable';
  } else {
    description += 'Wondrous Item';
  }
  
  return {
    ...result,
    description,
  };
}

export function rollWildMagic(): DiceRollResult {
  const result = rollD100();
  return {
    ...result,
    description: `Wild Magic Surge: Effect ${result.total}`,
  };
}

export function rollPortent(): DiceRollResult {
  const result = rollD20();
  return {
    ...result,
    description: `Portent Die: ${result.total}`,
  };
}

export function rollInspiration(): DiceRollResult {
  const result = rollDice(6);
  return {
    ...result,
    description: `Inspiration Die: d${result.total}`,
  };
} 