# Dice Utilities

This folder contains all dice-related utilities for the D&D AI game, organized by functionality.

## File Structure

### `base.ts`
Core dice rolling functions and interfaces:
- `DiceRollResult` interface
- `rollDice()` - Basic dice rolling function
- `rollD4()`, `rollD6()`, `rollD8()`, `rollD10()`, `rollD12()`, `rollD20()`, `rollD100()` - Standard dice
- `rollPercentile()` - Percentile dice (00-99)

### `character.ts`
Character generation and progression:
- `rollAbilityScore()` - Roll 4d6, drop lowest
- `rollAbilityScoreArray()` - Generate full ability score array
- `rollHitPoints()` - Calculate HP for character level
- `rollHitPointsAtLevel()` - Roll HP gain on level up
- `rollStartingGold()` - Starting wealth by class
- `getModifier()` - Calculate ability modifier
- `getProficiencyBonus()` - Get proficiency bonus by level

### `combat.ts`
Combat mechanics and rolls:
- `rollInitiative()` - Initiative with dexterity modifier
- `rollAttack()` - Attack rolls with modifiers
- `rollAttackWithAdvantage()` / `rollAttackWithDisadvantage()` - Advantage/disadvantage mechanics
- `rollDamage()` - Damage rolls from dice strings
- `rollCriticalDamage()` - Critical hit damage (double dice)
- `rollSavingThrow()` - Saving throws with proficiency
- `rollSkillCheck()` - Skill checks with proficiency
- `rollDeathSave()` - Death saving throws
- `rollConcentrationSave()` - Concentration saves with DC calculation

### `world.ts`
World generation and random tables:
- `rollTreasure()` - Treasure generation by CR
- `rollWeather()` - Weather conditions
- `rollDirection()` - Random directions
- `rollDungeonRoom()` - Room types and contents
- `rollRandomEncounter()` - Encounter types
- `rollLootQuality()` - Magic item rarity
- `rollWildMagic()` - Wild magic surge table
- `rollReaction()` - NPC reaction rolls

## Usage

Import specific functions from the dice folder:
```typescript
import { rollD20, rollDamage } from '@dnd/shared/utils/dice';
```

Or import everything:
```typescript
import * as dice from '@dnd/shared/utils/dice';
```

## Design Philosophy

Each file contains logically related functions:
- **Base**: Core mechanics that everything else builds on
- **Character**: Character creation and progression
- **Combat**: Active gameplay mechanics
- **World**: Environmental and story generation

All functions return consistent `DiceRollResult` objects with:
- `total`: Final result after modifiers
- `rolls`: Array of individual die results
- `modifier`: Applied modifier
- `description`: Human-readable description of the roll 