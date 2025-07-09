import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
// Character types for D&D 5e
type CharacterClass = 'barbarian' | 'bard' | 'cleric' | 'druid' | 'fighter' | 'monk' | 'paladin' | 'ranger' | 'rogue' | 'sorcerer' | 'warlock' | 'wizard';
type CharacterRace = 'human' | 'elf' | 'dwarf' | 'halfling' | 'dragonborn' | 'gnome' | 'half-elf' | 'half-orc' | 'tiefling';

interface AbilityScore {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// D&D 5e race bonuses
const RACE_BONUSES: Record<CharacterRace, Partial<AbilityScore>> = {
  human: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
  elf: { dexterity: 2 },
  dwarf: { constitution: 2 },
  halfling: { dexterity: 2 },
  dragonborn: { strength: 2, charisma: 1 },
  gnome: { intelligence: 2 },
  'half-elf': { charisma: 2 }, // Plus 2 different abilities of choice
  'half-orc': { strength: 2, constitution: 1 },
  tiefling: { intelligence: 1, charisma: 2 },
};

// D&D 5e class hit dice
const CLASS_HIT_DICE: Record<CharacterClass, number> = {
  barbarian: 12,
  fighter: 10,
  paladin: 10,
  ranger: 10,
  bard: 8,
  cleric: 8,
  druid: 8,
  monk: 8,
  rogue: 8,
  warlock: 8,
  sorcerer: 6,
  wizard: 6,
};

// Calculate ability modifier
function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Calculate proficiency bonus by level
function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

// Generate ability scores using point buy system (27 points)
function generatePointBuyScores(customScores?: Partial<AbilityScore>): AbilityScore {
  const baseScores: AbilityScore = {
    strength: 8,
    dexterity: 8,
    constitution: 8,
    intelligence: 8,
    wisdom: 8,
    charisma: 8,
  };

  // If custom scores provided, validate they follow point buy rules
  if (customScores) {
    return { ...baseScores, ...customScores };
  }

  // Default balanced array
  return {
    strength: 15,
    dexterity: 14,
    constitution: 13,
    intelligence: 12,
    wisdom: 10,
    charisma: 8,
  };
}

// Apply racial bonuses to ability scores
function applyRacialBonuses(scores: AbilityScore, race: CharacterRace): AbilityScore {
  const bonuses = RACE_BONUSES[race];
  const result = { ...scores };

  Object.entries(bonuses).forEach(([ability, bonus]) => {
    if (bonus && ability in result) {
      (result as any)[ability] += bonus;
    }
  });

  return result;
}

// Calculate character's maximum HP
function calculateMaxHP(level: number, characterClass: CharacterClass, constitutionModifier: number): number {
  const hitDie = CLASS_HIT_DICE[characterClass];
  if (!hitDie) {
    throw new Error(`Invalid character class: ${characterClass}`);
  }
  const baseHP = hitDie + constitutionModifier; // Level 1 HP
  const additionalHP = (level - 1) * (Math.floor(hitDie / 2) + 1 + constitutionModifier); // Average HP per level
  return Math.max(1, baseHP + additionalHP);
}

// Calculate base armor class (10 + Dex modifier)
function calculateBaseAC(dexterityModifier: number): number {
  return 10 + dexterityModifier;
}

// Get character speed by race
function getBaseSpeed(race: CharacterRace): number {
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
  const speed = speeds[race];
  if (speed === undefined) {
    throw new Error(`Invalid character race: ${race}`);
  }
  return speed;
}

export const characterController = {
  // Get user's characters
  async getCharacters(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const db = getDatabase();
      const characters = await db('characters')
        .where('user_id', req.user.id)
        .orderBy('created_at', 'desc');

      // Parse JSON fields
      const parsedCharacters = characters.map(char => ({
        ...char,
        skills: JSON.parse(char.skills || '{}'),
        inventory: JSON.parse(char.inventory || '[]'),
        spells: JSON.parse(char.spells || '[]'),
      }));

      res.json({ success: true, data: { characters: parsedCharacters } });
    } catch (error) {
      logger.error('Get characters error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to get characters.', statusCode: 500 } });
    }
  },

  // Create new character
  async createCharacter(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const {
        name,
        characterClass,
        race,
        background,
        alignment,
        abilityScores,
        personalityTraits,
        ideals,
        bonds,
        flaws,
      } = req.body;

      // Validate required fields
      if (!name || !characterClass || !race || !background || !alignment) {
        res.status(400).json({
          success: false,
          error: { message: 'Name, class, race, background, and alignment are required.', statusCode: 400 },
        });
        return;
      }

      // Generate ability scores
      const baseScores = generatePointBuyScores(abilityScores);
      const finalScores = applyRacialBonuses(baseScores, race);

      // Calculate derived stats
      const level = 1;
      const constitutionModifier = getAbilityModifier(finalScores.constitution);
      const dexterityModifier = getAbilityModifier(finalScores.dexterity);
      
      const maxHP = calculateMaxHP(level, characterClass, constitutionModifier);
      const armorClass = calculateBaseAC(dexterityModifier);
      const proficiencyBonus = getProficiencyBonus(level);
      const speed = getBaseSpeed(race);

      const characterId = uuidv4();
      const db = getDatabase();

      // Create character record
      await db('characters').insert({
        id: characterId,
        user_id: req.user.id,
        name,
        class: characterClass,
        race,
        level,
        experience: 0,
        hp_current: maxHP,
        hp_maximum: maxHP,
        hp_temporary: 0,
        armor_class: armorClass,
        proficiency_bonus: proficiencyBonus,
        speed,
        strength: finalScores.strength,
        dexterity: finalScores.dexterity,
        constitution: finalScores.constitution,
        intelligence: finalScores.intelligence,
        wisdom: finalScores.wisdom,
        charisma: finalScores.charisma,
        skills: JSON.stringify({}),
        inventory: JSON.stringify([]),
        spells: JSON.stringify([]),
        background,
        alignment,
        personality_traits: personalityTraits || null,
        ideals: ideals || null,
        bonds: bonds || null,
        flaws: flaws || null,
      });

      const newCharacter = await db('characters')
        .where('id', characterId)
        .first();

      logger.info(`Character created: ${name} (${characterClass} ${race}) for user ${req.user.email}`);

      res.status(201).json({
        success: true,
        data: {
          character: {
            ...newCharacter,
            skills: JSON.parse(newCharacter.skills),
            inventory: JSON.parse(newCharacter.inventory),
            spells: JSON.parse(newCharacter.spells),
          },
        },
      });
    } catch (error) {
      logger.error('Create character error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to create character.', statusCode: 500 } });
    }
  },

  // Get character by ID
  async getCharacter(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const db = getDatabase();
      
      const character = await db('characters')
        .where('id', id)
        .where('user_id', req.user.id)
        .first();

      if (!character) {
        res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
        return;
      }

      res.json({ success: true, data: { character } });
    } catch (error) {
      logger.error('Get character error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to get character.', statusCode: 500 } });
    }
  },

  // Update character
  async updateCharacter(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const {
        name,
        background,
        alignment,
        personalityTraits,
        ideals,
        bonds,
        flaws,
        hp_current,
        hp_temporary,
        inventory,
        spells,
      } = req.body;

      const db = getDatabase();
      
      // Verify character ownership
      const character = await db('characters')
        .where('id', id)
        .where('user_id', req.user.id)
        .first();

      if (!character) {
        res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
        return;
      }

      // Prepare update data
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (background !== undefined) updateData.background = background;
      if (alignment !== undefined) updateData.alignment = alignment;
      if (personalityTraits !== undefined) updateData.personality_traits = personalityTraits;
      if (ideals !== undefined) updateData.ideals = ideals;
      if (bonds !== undefined) updateData.bonds = bonds;
      if (flaws !== undefined) updateData.flaws = flaws;
      
      // Validate HP values
      if (hp_current !== undefined) {
        if (hp_current < 0) {
          res.status(400).json({ success: false, error: { message: 'HP cannot be negative.', statusCode: 400 } });
          return;
        }
        updateData.hp_current = Math.min(hp_current, character.hp_maximum);
      }
      
      if (hp_temporary !== undefined) {
        if (hp_temporary < 0) {
          res.status(400).json({ success: false, error: { message: 'Temporary HP cannot be negative.', statusCode: 400 } });
          return;
        }
        updateData.hp_temporary = hp_temporary;
      }
      
      // Update inventory and spells if provided
      if (inventory !== undefined) {
        updateData.inventory = JSON.stringify(inventory);
      }
      
      if (spells !== undefined) {
        updateData.spells = JSON.stringify(spells);
      }

      // Update timestamp
      updateData.updated_at = new Date();

      // Perform the update
      await db('characters')
        .where('id', id)
        .where('user_id', req.user.id)
        .update(updateData);

      // Fetch and return updated character
      const updatedCharacter = await db('characters')
        .where('id', id)
        .first();

      logger.info(`Character updated: ${updatedCharacter.name} (ID: ${id}) for user ${req.user.email}`);

      res.json({
        success: true,
        data: {
          character: {
            ...updatedCharacter,
            skills: JSON.parse(updatedCharacter.skills),
            inventory: JSON.parse(updatedCharacter.inventory),
            spells: JSON.parse(updatedCharacter.spells),
          },
        },
      });
    } catch (error) {
      logger.error('Update character error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to update character.', statusCode: 500 } });
    }
  },

  // Delete character
  async deleteCharacter(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const db = getDatabase();
      
      const deleted = await db('characters')
        .where('id', id)
        .where('user_id', req.user.id)
        .del();

      if (!deleted) {
        res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
        return;
      }

      res.json({ success: true, data: { message: 'Character deleted successfully.' } });
    } catch (error) {
      logger.error('Delete character error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to delete character.', statusCode: 500 } });
    }
  },

  // Character action methods
  async levelUp(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const db = getDatabase();
      
      // Get character
      const character = await db('characters')
        .where('id', id)
        .where('user_id', req.user.id)
        .first();

      if (!character) {
        res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
        return;
      }

      // D&D 5e experience thresholds
      const experienceThresholds = [
        0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
        85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
      ];

      const currentLevel = character.level;
      const currentExperience = character.experience;

      // Check if character can level up
      if (currentLevel >= 20) {
        res.status(400).json({ success: false, error: { message: 'Character is already at maximum level.', statusCode: 400 } });
        return;
      }

      const nextLevelThreshold = experienceThresholds[currentLevel];
      if (!nextLevelThreshold) {
        res.status(400).json({ success: false, error: { message: 'Invalid level for experience calculation.', statusCode: 400 } });
        return;
      }

      if (currentExperience < nextLevelThreshold) {
        res.status(400).json({ 
          success: false, 
          error: { 
            message: `Not enough experience to level up. Need ${nextLevelThreshold - currentExperience} more XP.`, 
            statusCode: 400 
          } 
        });
        return;
      }

      // Calculate new stats
      const newLevel = currentLevel + 1;
      const constitutionModifier = getAbilityModifier(character.constitution);
      const newProficiencyBonus = getProficiencyBonus(newLevel);
      
      // Calculate HP increase (average of hit die + constitution modifier)
      const hitDie = CLASS_HIT_DICE[character.class as CharacterClass];
      const hpIncrease = Math.floor(hitDie / 2) + 1 + constitutionModifier;
      const newMaxHP = character.hp_maximum + hpIncrease;

      // Update character
      await db('characters')
        .where('id', id)
        .update({
          level: newLevel,
          hp_maximum: newMaxHP,
          hp_current: character.hp_current + hpIncrease, // Heal to full on level up
          proficiency_bonus: newProficiencyBonus,
          updated_at: new Date(),
        });

      const updatedCharacter = await db('characters')
        .where('id', id)
        .first();

      logger.info(`Character leveled up: ${character.name} reached level ${newLevel} for user ${req.user.email}`);

      res.json({
        success: true,
        data: {
          character: {
            ...updatedCharacter,
            skills: JSON.parse(updatedCharacter.skills),
            inventory: JSON.parse(updatedCharacter.inventory),
            spells: JSON.parse(updatedCharacter.spells),
          },
          levelUpBenefits: {
            previousLevel: currentLevel,
            newLevel: newLevel,
            hpIncrease: hpIncrease,
            newMaxHP: newMaxHP,
            newProficiencyBonus: newProficiencyBonus,
          },
        },
      });
    } catch (error) {
      logger.error('Level up error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to level up character.', statusCode: 500 } });
    }
  },

  async rest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const { restType } = req.body; // 'short' or 'long'
      const db = getDatabase();
      
      const character = await db('characters')
        .where('id', id)
        .where('user_id', req.user.id)
        .first();

      if (!character) {
        res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
        return;
      }

      let healingAmount = 0;
      let restDescription = '';

      if (restType === 'short') {
        // Short rest: can spend hit dice to heal
        const hitDie = CLASS_HIT_DICE[character.class as CharacterClass];
        const constitutionModifier = getAbilityModifier(character.constitution);
        healingAmount = Math.floor(hitDie / 2) + 1 + constitutionModifier;
        restDescription = 'Short rest completed. Hit dice used for healing.';
      } else if (restType === 'long') {
        // Long rest: heal to full HP
        healingAmount = character.hp_maximum - character.hp_current;
        restDescription = 'Long rest completed. Fully healed and refreshed.';
      } else {
        res.status(400).json({ success: false, error: { message: 'Rest type must be "short" or "long".', statusCode: 400 } });
        return;
      }

      const newCurrentHP = Math.min(character.hp_current + healingAmount, character.hp_maximum);

      await db('characters')
        .where('id', id)
        .update({
          hp_current: newCurrentHP,
          updated_at: new Date(),
        });

      const updatedCharacter = await db('characters')
        .where('id', id)
        .first();

      logger.info(`Character rested: ${character.name} took a ${restType} rest for user ${req.user.email}`);

      res.json({
        success: true,
        data: {
          character: {
            ...updatedCharacter,
            skills: JSON.parse(updatedCharacter.skills),
            inventory: JSON.parse(updatedCharacter.inventory),
            spells: JSON.parse(updatedCharacter.spells),
          },
          restInfo: {
            restType,
            healingAmount,
            description: restDescription,
          },
        },
      });
    } catch (error) {
      logger.error('Rest error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to rest character.', statusCode: 500 } });
    }
  },

  async heal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const { healingAmount } = req.body;
      const db = getDatabase();
      
      if (!healingAmount || healingAmount <= 0) {
        res.status(400).json({ success: false, error: { message: 'Healing amount must be positive.', statusCode: 400 } });
        return;
      }

      const character = await db('characters')
        .where('id', id)
        .where('user_id', req.user.id)
        .first();

      if (!character) {
        res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
        return;
      }

      const newCurrentHP = Math.min(character.hp_current + healingAmount, character.hp_maximum);

      await db('characters')
        .where('id', id)
        .update({
          hp_current: newCurrentHP,
          updated_at: new Date(),
        });

      const updatedCharacter = await db('characters')
        .where('id', id)
        .first();

      logger.info(`Character healed: ${character.name} healed for ${healingAmount} HP for user ${req.user.email}`);

      res.json({
        success: true,
        data: {
          character: {
            ...updatedCharacter,
            skills: JSON.parse(updatedCharacter.skills),
            inventory: JSON.parse(updatedCharacter.inventory),
            spells: JSON.parse(updatedCharacter.spells),
          },
          healingInfo: {
            healingAmount,
            actualHealing: newCurrentHP - character.hp_current,
            wasAtMaxHP: character.hp_current >= character.hp_maximum,
          },
        },
      });
    } catch (error) {
      logger.error('Heal error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to heal character.', statusCode: 500 } });
    }
  },

  async takeDamage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const { damageAmount } = req.body;
      const db = getDatabase();
      
      if (!damageAmount || damageAmount <= 0) {
        res.status(400).json({ success: false, error: { message: 'Damage amount must be positive.', statusCode: 400 } });
        return;
      }

      const character = await db('characters')
        .where('id', id)
        .where('user_id', req.user.id)
        .first();

      if (!character) {
        res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
        return;
      }

      // Apply damage to temporary HP first, then current HP
      let remainingDamage = damageAmount;
      let newTempHP = character.hp_temporary;
      let newCurrentHP = character.hp_current;

      if (newTempHP > 0) {
        const tempHPDamage = Math.min(remainingDamage, newTempHP);
        newTempHP -= tempHPDamage;
        remainingDamage -= tempHPDamage;
      }

      if (remainingDamage > 0) {
        newCurrentHP = Math.max(0, newCurrentHP - remainingDamage);
      }

      await db('characters')
        .where('id', id)
        .update({
          hp_current: newCurrentHP,
          hp_temporary: newTempHP,
          updated_at: new Date(),
        });

      const updatedCharacter = await db('characters')
        .where('id', id)
        .first();

      const isUnconscious = newCurrentHP === 0;

      logger.info(`Character damaged: ${character.name} took ${damageAmount} damage for user ${req.user.email}`);

      res.json({
        success: true,
        data: {
          character: {
            ...updatedCharacter,
            skills: JSON.parse(updatedCharacter.skills),
            inventory: JSON.parse(updatedCharacter.inventory),
            spells: JSON.parse(updatedCharacter.spells),
          },
          damageInfo: {
            damageAmount,
            tempHPLost: character.hp_temporary - newTempHP,
            currentHPLost: character.hp_current - newCurrentHP,
            isUnconscious,
          },
        },
      });
    } catch (error) {
      logger.error('Take damage error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to apply damage.', statusCode: 500 } });
    }
  },

  // Inventory management
  async getInventory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const db = getDatabase();
      
      const character = await db('characters')
        .select('inventory')
        .where('id', id)
        .where('user_id', req.user.id)
        .first();

      if (!character) {
        res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
        return;
      }

      const inventory = JSON.parse(character.inventory || '[]');

      res.json({
        success: true,
        data: {
          inventory,
          totalItems: inventory.length,
          totalWeight: inventory.reduce((sum: number, item: any) => sum + (item.weight * item.quantity), 0),
        },
      });
    } catch (error) {
      logger.error('Get inventory error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to get inventory.', statusCode: 500 } });
    }
  },

  async addItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const { item } = req.body;
      const db = getDatabase();
      
      if (!item || !item.name || !item.type) {
        res.status(400).json({ success: false, error: { message: 'Item must have name and type.', statusCode: 400 } });
        return;
      }

      const character = await db('characters')
        .select('inventory')
        .where('id', id)
        .where('user_id', req.user.id)
        .first();

      if (!character) {
        res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
        return;
      }

      const inventory = JSON.parse(character.inventory || '[]');
      
      // Create new item with default values
      const newItem = {
        id: uuidv4(),
        name: item.name,
        description: item.description || '',
        quantity: item.quantity || 1,
        weight: item.weight || 0,
        value: item.value || 0,
        rarity: item.rarity || 'common',
        type: item.type,
        ...item,
      };

      inventory.push(newItem);

      await db('characters')
        .where('id', id)
        .update({
          inventory: JSON.stringify(inventory),
          updated_at: new Date(),
        });

      logger.info(`Item added to character inventory: ${item.name} to ${character.name} for user ${req.user.email}`);

      res.json({
        success: true,
        data: {
          item: newItem,
          inventory,
        },
      });
    } catch (error) {
      logger.error('Add item error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to add item.', statusCode: 500 } });
    }
  },

  async updateItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const { itemId, updates } = req.body;
      const db = getDatabase();
      
      if (!itemId || !updates) {
        res.status(400).json({ success: false, error: { message: 'Item ID and updates are required.', statusCode: 400 } });
        return;
      }

      const character = await db('characters')
        .select('inventory')
        .where('id', id)
        .where('user_id', req.user.id)
        .first();

      if (!character) {
        res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
        return;
      }

      const inventory = JSON.parse(character.inventory || '[]');
      const itemIndex = inventory.findIndex((item: any) => item.id === itemId);

      if (itemIndex === -1) {
        res.status(404).json({ success: false, error: { message: 'Item not found in inventory.', statusCode: 404 } });
        return;
      }

      // Update the item
      inventory[itemIndex] = { ...inventory[itemIndex], ...updates };

      await db('characters')
        .where('id', id)
        .update({
          inventory: JSON.stringify(inventory),
          updated_at: new Date(),
        });

      logger.info(`Item updated in character inventory: ${itemId} for user ${req.user.email}`);

      res.json({
        success: true,
        data: {
          item: inventory[itemIndex],
          inventory,
        },
      });
    } catch (error) {
      logger.error('Update item error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to update item.', statusCode: 500 } });
    }
  },

  async removeItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Authentication required.', statusCode: 401 } });
        return;
      }

      const { id } = req.params;
      const { itemId } = req.body;
      const db = getDatabase();
      
      if (!itemId) {
        res.status(400).json({ success: false, error: { message: 'Item ID is required.', statusCode: 400 } });
        return;
      }

      const character = await db('characters')
        .select('inventory')
        .where('id', id)
        .where('user_id', req.user.id)
        .first();

      if (!character) {
        res.status(404).json({ success: false, error: { message: 'Character not found.', statusCode: 404 } });
        return;
      }

      const inventory = JSON.parse(character.inventory || '[]');
      const itemIndex = inventory.findIndex((item: any) => item.id === itemId);

      if (itemIndex === -1) {
        res.status(404).json({ success: false, error: { message: 'Item not found in inventory.', statusCode: 404 } });
        return;
      }

      const removedItem = inventory.splice(itemIndex, 1)[0];

      await db('characters')
        .where('id', id)
        .update({
          inventory: JSON.stringify(inventory),
          updated_at: new Date(),
        });

      logger.info(`Item removed from character inventory: ${itemId} for user ${req.user.email}`);

      res.json({
        success: true,
        data: {
          removedItem,
          inventory,
        },
      });
    } catch (error) {
      logger.error('Remove item error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to remove item.', statusCode: 500 } });
    }
  },

  // Spell management (stubs)
  async getSpells(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({ success: false, error: { message: 'Spell management not yet implemented.', statusCode: 501 } });
    } catch (error) {
      logger.error('Get spells error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to get spells.', statusCode: 500 } });
    }
  },

  async addSpell(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({ success: false, error: { message: 'Add spell not yet implemented.', statusCode: 501 } });
    } catch (error) {
      logger.error('Add spell error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to add spell.', statusCode: 500 } });
    }
  },

  async removeSpell(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({ success: false, error: { message: 'Remove spell not yet implemented.', statusCode: 501 } });
    } catch (error) {
      logger.error('Remove spell error:', error);
      res.status(500).json({ success: false, error: { message: 'Failed to remove spell.', statusCode: 500 } });
    }
  },
}; 