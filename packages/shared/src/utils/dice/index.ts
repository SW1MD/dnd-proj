// Base dice rolling functions and types
export { DiceRollResult, rollDice } from './base';

// Basic dice functions from base (use these for simple rolls)
export { 
  rollD4 as basicD4,
  rollD6 as basicD6, 
  rollD8 as basicD8,
  rollD10 as basicD10,
  rollD12 as basicD12,
  rollD20 as basicD20,
  rollD100 as basicD100,
  rollPercentile as basicPercentile
} from './base';

// Enhanced dice functions organized by number of faces
// These provide specialized use cases and enhanced functionality
export * from './d4';
export * from './d6';
export * from './d8';
export * from './d10';
export * from './d12';
export * from './d20';
export * from './d100'; 