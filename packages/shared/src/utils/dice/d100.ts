import { rollDice, DiceRollResult } from './base';

/**
 * Roll a 100-sided die (percentile)
 */
export function rollD100(): DiceRollResult {
  return rollDice(100, 1, 0);
}

/**
 * Roll percentile dice (00-99) using traditional method
 */
export function rollPercentile(): DiceRollResult {
  // Roll two d10s - one for tens, one for ones
  const tens = rollDice(10, 1, 0).total;
  const ones = rollDice(10, 1, 0).total;
  
  // Convert to percentile (00-99)
  const tensValue = (tens === 10) ? 0 : tens;
  const onesValue = (ones === 10) ? 0 : ones;
  const total = (tensValue * 10) + onesValue;
  
  return {
    total,
    rolls: [tens, ones],
    modifier: 0,
    description: `Percentile: ${total.toString().padStart(2, '0')}`,
  };
}

/**
 * Common d100 use cases in D&D
 */

// Wild Magic Surge table
export function rollWildMagicSurge(): DiceRollResult {
  const result = rollD100();
  return {
    ...result,
    description: `Wild Magic Surge: Effect ${result.total}`,
  };
}

// Magic item generation
export function rollMagicItemTable(): DiceRollResult {
  const result = rollD100();
  let itemType = 'Common';
  
  if (result.total <= 50) itemType = 'Common';
  else if (result.total <= 75) itemType = 'Uncommon';
  else if (result.total <= 90) itemType = 'Rare';
  else if (result.total <= 98) itemType = 'Very Rare';
  else itemType = 'Legendary';
  
  return {
    ...result,
    description: `Magic Item: ${itemType} (${result.total})`,
  };
}

// Treasure hoard tables
export function rollTreasureHoard(challengeRating: number): DiceRollResult {
  const result = rollD100();
  let treasureType = 'Coins';
  
  if (challengeRating <= 4) {
    if (result.total <= 30) treasureType = 'Coins only';
    else if (result.total <= 60) treasureType = 'Coins + Gems';
    else if (result.total <= 90) treasureType = 'Coins + Art Objects';
    else treasureType = 'Coins + Magic Item';
  } else if (challengeRating <= 10) {
    if (result.total <= 20) treasureType = 'Coins only';
    else if (result.total <= 50) treasureType = 'Coins + Gems';
    else if (result.total <= 80) treasureType = 'Coins + Art Objects';
    else treasureType = 'Coins + Magic Items';
  } else {
    if (result.total <= 15) treasureType = 'Coins + Gems';
    else if (result.total <= 55) treasureType = 'Coins + Art Objects';
    else treasureType = 'Coins + Magic Items';
  }
  
  return {
    ...result,
    description: `Treasure (CR ${challengeRating}): ${treasureType} (${result.total})`,
  };
}

// Random encounters
export function rollRandomEncounterTable(): DiceRollResult {
  const result = rollD100();
  let encounterType = 'Peaceful';
  
  if (result.total <= 20) encounterType = 'No encounter';
  else if (result.total <= 40) encounterType = 'Peaceful travelers';
  else if (result.total <= 60) encounterType = 'Wildlife';
  else if (result.total <= 80) encounterType = 'Bandits';
  else if (result.total <= 95) encounterType = 'Monsters';
  else encounterType = 'Legendary creature';
  
  return {
    ...result,
    description: `Random Encounter: ${encounterType} (${result.total})`,
  };
}

// Weather generation
export function rollWeatherTable(): DiceRollResult {
  const result = rollD100();
  let weather = 'Clear';
  
  if (result.total <= 30) weather = 'Clear skies';
  else if (result.total <= 50) weather = 'Partly cloudy';
  else if (result.total <= 70) weather = 'Overcast';
  else if (result.total <= 85) weather = 'Light rain';
  else if (result.total <= 95) weather = 'Heavy rain';
  else weather = 'Storm';
  
  return {
    ...result,
    description: `Weather: ${weather} (${result.total})`,
  };
}

// Dungeon generation tables
export function rollDungeonRoomPurpose(): DiceRollResult {
  const result = rollD100();
  let purpose = 'Empty';
  
  if (result.total <= 20) purpose = 'Barracks/Quarters';
  else if (result.total <= 30) purpose = 'Armory';
  else if (result.total <= 40) purpose = 'Storage';
  else if (result.total <= 50) purpose = 'Laboratory';
  else if (result.total <= 60) purpose = 'Library';
  else if (result.total <= 70) purpose = 'Throne Room';
  else if (result.total <= 80) purpose = 'Treasury';
  else if (result.total <= 90) purpose = 'Temple/Shrine';
  else purpose = 'Ritual Chamber';
  
  return {
    ...result,
    description: `Room Purpose: ${purpose} (${result.total})`,
  };
}

// Settlement generation
export function rollSettlementEvent(): DiceRollResult {
  const result = rollD100();
  let event = 'Normal day';
  
  if (result.total <= 30) event = 'Market day - increased trade';
  else if (result.total <= 50) event = 'Festival or celebration';
  else if (result.total <= 60) event = 'Traveling merchant arrives';
  else if (result.total <= 70) event = 'Political tension';
  else if (result.total <= 80) event = 'Strange rumors circulate';
  else if (result.total <= 90) event = 'Criminal activity';
  else if (result.total <= 95) event = 'Natural disaster threat';
  else event = 'Supernatural occurrence';
  
  return {
    ...result,
    description: `Settlement Event: ${event} (${result.total})`,
  };
}

// NPC generation
export function rollNPCQuirk(): DiceRollResult {
  const result = rollD100();
  const quirks = [
    'Prone to singing', 'Rhymes when speaking', 'Extremely paranoid', 'Collects something odd',
    'Speaks in whispers', 'Laughs at inappropriate times', 'Constantly eating', 'Has unusual pet',
    'Speaks multiple languages randomly', 'Superstitious about everything', 'Never removes gloves',
    'Obsessed with cleanliness', 'Tells long, pointless stories', 'Refers to self in third person',
    'Constantly fidgets', 'Has distinctive laugh', 'Speaks very slowly', 'Uses big words incorrectly',
    'Extremely literal', 'Constantly apologizes', 'Makes up words', 'Quotes famous people',
    'Has speech impediment', 'Extremely loud', 'Whispers secrets to strangers', 'Always hungry',
    'Forgets names constantly', 'Overly dramatic', 'Makes sound effects', 'Constantly counting',
    'Talks to imaginary friend', 'Extremely unlucky', 'Predicts the weather incorrectly', 'Hums constantly'
  ];
  
  const quirkIndex = Math.min(quirks.length - 1, Math.floor((result.total - 1) / 3));
  
  return {
    ...result,
    description: `NPC Quirk: ${quirks[quirkIndex]} (${result.total})`,
  };
}

// Magical phenomena
export function rollMagicalEffect(): DiceRollResult {
  const result = rollD100();
  let effect = 'Faint magical aura';
  
  if (result.total <= 20) effect = 'Colors shift and change';
  else if (result.total <= 30) effect = 'Temperature drops 10 degrees';
  else if (result.total <= 40) effect = 'Faint music plays';
  else if (result.total <= 50) effect = 'Sweet scent fills the air';
  else if (result.total <= 60) effect = 'Objects levitate briefly';
  else if (result.total <= 70) effect = 'Sparks of light dance around';
  else if (result.total <= 80) effect = 'Whispers in unknown language';
  else if (result.total <= 90) effect = 'Brief glimpse of another realm';
  else effect = 'Reality briefly shifts';
  
  return {
    ...result,
    description: `Magical Effect: ${effect} (${result.total})`,
  };
}

// Trap generation
export function rollTrapType(): DiceRollResult {
  const result = rollD100();
  let trapType = 'Pit trap';
  
  if (result.total <= 20) trapType = 'Dart trap';
  else if (result.total <= 30) trapType = 'Pit trap';
  else if (result.total <= 40) trapType = 'Poison needle';
  else if (result.total <= 50) trapType = 'Crossbow bolt';
  else if (result.total <= 60) trapType = 'Net trap';
  else if (result.total <= 70) trapType = 'Gas trap';
  else if (result.total <= 80) trapType = 'Blade trap';
  else if (result.total <= 90) trapType = 'Magic trap';
  else trapType = 'Complex mechanical trap';
  
  return {
    ...result,
    description: `Trap Type: ${trapType} (${result.total})`,
  };
}

// Potion effects
export function rollPotionEffect(): DiceRollResult {
  const result = rollD100();
  let effect = 'Healing';
  
  if (result.total <= 25) effect = 'Healing';
  else if (result.total <= 35) effect = 'Strength enhancement';
  else if (result.total <= 45) effect = 'Speed boost';
  else if (result.total <= 55) effect = 'Invisibility';
  else if (result.total <= 65) effect = 'Fire resistance';
  else if (result.total <= 75) effect = 'Water breathing';
  else if (result.total <= 85) effect = 'Poison';
  else if (result.total <= 95) effect = 'Confusion';
  else effect = 'Polymorph';
  
  return {
    ...result,
    description: `Potion Effect: ${effect} (${result.total})`,
  };
} 