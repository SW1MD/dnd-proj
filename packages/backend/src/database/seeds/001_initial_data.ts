import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('chat_messages').del();
  await knex('dice_rolls').del();
  await knex('game_events').del();
  await knex('game_actions').del();
  await knex('game_players').del();
  await knex('game_sessions').del();
  await knex('maps').del();
  await knex('characters').del();
  await knex('auth_tokens').del();
  await knex('users').del();

  // Create demo users
  const passwordHash = await bcrypt.hash('password123', 12);
  
  const users = [
    {
      id: uuidv4(),
      email: 'admin@dndaigame.com',
      username: 'admin',
      display_name: 'Admin',
      password_hash: passwordHash,
      role: 'admin',
      is_verified: true,
      preferences: JSON.stringify({
        theme: 'dark',
        notifications: true,
        soundEnabled: true,
        autoRollDice: false,
        showCombatAnimations: true,
      }),
      stats: JSON.stringify({
        gamesPlayed: 0,
        totalPlayTime: 0,
        charactersCreated: 0,
        achievementsUnlocked: [],
      }),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      email: 'dm@dndaigame.com',
      username: 'dungeon_master',
      display_name: 'Dungeon Master',
      password_hash: passwordHash,
      role: 'dm',
      is_verified: true,
      preferences: JSON.stringify({
        theme: 'dark',
        notifications: true,
        soundEnabled: true,
        autoRollDice: false,
        showCombatAnimations: true,
      }),
      stats: JSON.stringify({
        gamesPlayed: 5,
        totalPlayTime: 1200,
        charactersCreated: 0,
        achievementsUnlocked: ['first_session', 'experienced_dm'],
      }),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      email: 'player1@dndaigame.com',
      username: 'aragorn_ranger',
      display_name: 'Aragorn',
      password_hash: passwordHash,
      role: 'player',
      is_verified: true,
      preferences: JSON.stringify({
        theme: 'light',
        notifications: true,
        soundEnabled: true,
        autoRollDice: true,
        showCombatAnimations: true,
      }),
      stats: JSON.stringify({
        gamesPlayed: 3,
        totalPlayTime: 600,
        charactersCreated: 2,
        achievementsUnlocked: ['first_character', 'first_level_up'],
      }),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      email: 'player2@dndaigame.com',
      username: 'gandalf_wizard',
      display_name: 'Gandalf',
      password_hash: passwordHash,
      role: 'player',
      is_verified: true,
      preferences: JSON.stringify({
        theme: 'dark',
        notifications: true,
        soundEnabled: false,
        autoRollDice: false,
        showCombatAnimations: false,
      }),
      stats: JSON.stringify({
        gamesPlayed: 8,
        totalPlayTime: 1800,
        charactersCreated: 3,
        achievementsUnlocked: ['first_character', 'first_level_up', 'spell_master', 'veteran_player'],
      }),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('users').insert(users);

  // Create demo characters
  const characters = [
    {
      id: uuidv4(),
      user_id: users[2]!.id, // Aragorn
      name: 'Strider',
      class: 'ranger',
      race: 'human',
      level: 5,
      experience: 6500,
      hp_current: 45,
      hp_maximum: 45,
      hp_temporary: 0,
      armor_class: 16,
      proficiency_bonus: 3,
      speed: 30,
      strength: 14,
      dexterity: 18,
      constitution: 16,
      intelligence: 12,
      wisdom: 15,
      charisma: 10,
      skills: JSON.stringify({
        athletics: 5,
        perception: 8,
        survival: 8,
        stealth: 7,
      }),
      inventory: JSON.stringify([
        { id: uuidv4(), name: 'Longbow', type: 'weapon', quantity: 1 },
        { id: uuidv4(), name: 'Leather Armor', type: 'armor', quantity: 1 },
        { id: uuidv4(), name: 'Health Potion', type: 'consumable', quantity: 3 },
      ]),
      spells: JSON.stringify([]),
      background: 'Outlander',
      alignment: 'Lawful Good',
      personality_traits: 'I am always polite and respectful.',
      ideals: 'People deserve to be treated with dignity and respect.',
      bonds: 'I will face any challenge to win the approval of my family.',
      flaws: 'I have a weakness for the vices of the city.',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      user_id: users[3]!.id, // Gandalf
      name: 'Gandalf the Grey',
      class: 'wizard',
      race: 'human',
      level: 10,
      experience: 64000,
      hp_current: 60,
      hp_maximum: 60,
      hp_temporary: 0,
      armor_class: 12,
      proficiency_bonus: 4,
      speed: 30,
      strength: 10,
      dexterity: 12,
      constitution: 14,
      intelligence: 20,
      wisdom: 18,
      charisma: 16,
      skills: JSON.stringify({
        arcana: 15,
        history: 10,
        investigation: 10,
        insight: 9,
      }),
      inventory: JSON.stringify([
        { id: uuidv4(), name: 'Staff of Power', type: 'weapon', quantity: 1 },
        { id: uuidv4(), name: 'Robes of the Archmagi', type: 'armor', quantity: 1 },
        { id: uuidv4(), name: 'Spell Component Pouch', type: 'tool', quantity: 1 },
      ]),
      spells: JSON.stringify([
        { id: uuidv4(), name: 'Fireball', level: 3, school: 'evocation' },
        { id: uuidv4(), name: 'Magic Missile', level: 1, school: 'evocation' },
        { id: uuidv4(), name: 'Shield', level: 1, school: 'abjuration' },
      ]),
      background: 'Sage',
      alignment: 'Chaotic Good',
      personality_traits: 'I am horribly, horribly awkward in social situations.',
      ideals: 'Knowledge is power, and the key to all other forms of power.',
      bonds: 'The workshop where I learned my trade is the most important place in the world to me.',
      flaws: 'I speak without really thinking through my words, invariably insulting others.',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('characters').insert(characters);

  // Create demo map
  const maps = [
    {
      id: uuidv4(),
      name: 'Goblin Cave',
      description: 'A dark cave system infested with goblins and their wolf companions.',
      type: 'cave',
      width: 20,
      height: 20,
      theme: 'goblin lair',
      difficulty: 'easy',
      recommended_level: 3,
      tiles: JSON.stringify([]), // Would contain 2D array of tile data
      rooms: JSON.stringify([
        {
          id: uuidv4(),
          name: 'Cave Entrance',
          type: 'entrance',
          bounds: { x: 0, y: 0, width: 5, height: 5 },
        },
        {
          id: uuidv4(),
          name: 'Goblin Warren',
          type: 'chamber',
          bounds: { x: 10, y: 10, width: 8, height: 8 },
        },
      ]),
      npcs: JSON.stringify([
        {
          id: uuidv4(),
          name: 'Goblin Chief',
          race: 'goblin',
          level: 3,
          disposition: 'hostile',
        },
      ]),
      starting_position: JSON.stringify({ x: 1, y: 1 }),
      is_public: true,
      created_by: users[1]!.id, // DM
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('maps').insert(maps);

  // Create demo game session
  const gameSessions = [
    {
      id: uuidv4(),
      name: 'The Lost Mines of Phandelver',
      description: 'A classic D&D adventure for new players.',
      dm_user_id: users[1]!.id, // DM
      max_players: 4,
      status: 'waiting',
      current_map_id: maps[0]!.id,
      game_state: JSON.stringify({
        currentTurn: 0,
        roundNumber: 1,
        initiative: [],
      }),
      is_public: true,
      ai_settings: JSON.stringify({
        difficultyLevel: 'medium',
        aiPersonality: 'helpful',
        autoGeneration: true,
        voiceEnabled: false,
      }),
      created_at: new Date(),
      updated_at: new Date(),
      last_active_at: new Date(),
    },
  ];

  await knex('game_sessions').insert(gameSessions);

  console.log('✅ Database seeded successfully with demo data');
} 