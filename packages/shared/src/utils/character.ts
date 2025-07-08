import { Character, CharacterClass, CharacterRace } from '../types/character';
import { rollAbilityScore, rollHitPoints, getModifier, getProficiencyBonus } from './dice';

export function createCharacter(
  userId: string,
  name: string,
  characterClass: CharacterClass,
  race: CharacterRace,
  background: string,
  alignment: string
): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> {
  const abilities = {
    strength: rollAbilityScore(),
    dexterity: rollAbilityScore(),
    constitution: rollAbilityScore(),
    intelligence: rollAbilityScore(),
    wisdom: rollAbilityScore(),
    charisma: rollAbilityScore(),
  };

  const hitDie = getHitDieForClass(characterClass);
  const maxHitPoints = rollHitPoints(hitDie, abilities.constitution, 1);

  return {
    userId,
    name,
    class: characterClass,
    race,
    level: 1,
    experience: 0,
    hitPoints: {
      current: maxHitPoints,
      maximum: maxHitPoints,
      temporary: 0,
    },
    armorClass: 10 + getModifier(abilities.dexterity),
    proficiencyBonus: getProficiencyBonus(1),
    speed: getSpeedForRace(race),
    abilities,
    skills: {},
    inventory: [],
    spells: [],
    background,
    alignment,
  };
}

export function getHitDieForClass(characterClass: CharacterClass): number {
  const hitDice: Record<CharacterClass, number> = {
    barbarian: 12,
    bard: 8,
    cleric: 8,
    druid: 8,
    fighter: 10,
    monk: 8,
    paladin: 10,
    ranger: 10,
    rogue: 8,
    sorcerer: 6,
    warlock: 8,
    wizard: 6,
  };

  return hitDice[characterClass];
}

export function getSpeedForRace(race: CharacterRace): number {
  const speeds: Record<CharacterRace, number> = {
    human: 30,
    elf: 30,
    dwarf: 25,
    halfling: 25,
    dragonborn: 30,
    gnome: 25,
    'half-elf': 30,
    'half-orc': 30,
    tiefling: 30,
  };

  return speeds[race];
}

export function calculateExperienceForLevel(level: number): number {
  const experienceThresholds = [
    0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
    85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
  ];

  return experienceThresholds[level - 1] || 0;
}

export function getNextLevelExperience(currentLevel: number): number {
  return calculateExperienceForLevel(currentLevel + 1);
}

export function canLevelUp(character: Character): boolean {
  if (character.level >= 20) return false;
  return character.experience >= getNextLevelExperience(character.level);
}

export function levelUpCharacter(character: Character): Character {
  if (!canLevelUp(character)) {
    throw new Error('Character cannot level up');
  }

  const newLevel = character.level + 1;
  const hitDie = getHitDieForClass(character.class);
  const additionalHP = rollHitPoints(hitDie, character.abilities.constitution, 1);

  return {
    ...character,
    level: newLevel,
    hitPoints: {
      ...character.hitPoints,
      maximum: character.hitPoints.maximum + additionalHP,
      current: character.hitPoints.current + additionalHP,
    },
    proficiencyBonus: getProficiencyBonus(newLevel),
    updatedAt: new Date(),
  };
}

export function applyDamage(character: Character, damage: number): Character {
  const newHP = Math.max(0, character.hitPoints.current - damage);
  
  return {
    ...character,
    hitPoints: {
      ...character.hitPoints,
      current: newHP,
    },
    updatedAt: new Date(),
  };
}

export function healCharacter(character: Character, healing: number): Character {
  const newHP = Math.min(
    character.hitPoints.maximum + character.hitPoints.temporary,
    character.hitPoints.current + healing
  );

  return {
    ...character,
    hitPoints: {
      ...character.hitPoints,
      current: newHP,
    },
    updatedAt: new Date(),
  };
}

export function isCharacterDead(character: Character): boolean {
  return character.hitPoints.current <= 0;
}

export function addExperience(character: Character, experience: number): Character {
  return {
    ...character,
    experience: character.experience + experience,
    updatedAt: new Date(),
  };
}

export function getAbilityModifier(character: Character, ability: keyof Character['abilities']): number {
  return getModifier(character.abilities[ability]);
}

export function getSkillModifier(character: Character, skill: keyof Character['skills']): number {
  // This is a simplified implementation - in a full game, you'd need to map skills to abilities
  const skillValue = character.skills[skill] || 0;
  return skillValue + character.proficiencyBonus;
} 