import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // First, create a new table with the correct schema
  await knex.schema.createTable('game_players_new', (table) => {
    table.uuid('id').primary();
    table.uuid('game_id').references('id').inTable('game_sessions').onDelete('CASCADE').notNullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('character_id').references('id').inTable('characters').onDelete('CASCADE').nullable(); // Made nullable
    table.boolean('is_online').defaultTo(true).notNullable();
    table.timestamp('joined_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('last_active_at').defaultTo(knex.fn.now()).notNullable();
    
    // Player role in this specific game
    table.enum('role', ['player', 'co_dm', 'observer']).defaultTo('player').notNullable();
    
    // Player-specific game settings
    table.json('game_settings').defaultTo('{}').notNullable();
    
    table.timestamps(true, true);
    
    // Unique constraint - each user can only be in a game once
    table.unique(['game_id', 'user_id']);
    
    // Indexes
    table.index('game_id');
    table.index('user_id');
    table.index('character_id');
    table.index('is_online');
    table.index('joined_at');
  });

  // Copy data from old table to new table
  await knex.raw(`
    INSERT INTO game_players_new 
    SELECT * FROM game_players
  `);

  // Drop old table
  await knex.schema.dropTable('game_players');

  // Rename new table to original name
  await knex.schema.renameTable('game_players_new', 'game_players');
}

export async function down(knex: Knex): Promise<void> {
  // Create the old table structure
  await knex.schema.createTable('game_players_old', (table) => {
    table.uuid('id').primary();
    table.uuid('game_id').references('id').inTable('game_sessions').onDelete('CASCADE').notNullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('character_id').references('id').inTable('characters').onDelete('CASCADE').notNullable(); // NOT NULL again
    table.boolean('is_online').defaultTo(true).notNullable();
    table.timestamp('joined_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('last_active_at').defaultTo(knex.fn.now()).notNullable();
    
    // Player role in this specific game
    table.enum('role', ['player', 'co_dm', 'observer']).defaultTo('player').notNullable();
    
    // Player-specific game settings
    table.json('game_settings').defaultTo('{}').notNullable();
    
    table.timestamps(true, true);
    
    // Unique constraint - each user can only be in a game once
    table.unique(['game_id', 'user_id']);
    
    // Indexes
    table.index('game_id');
    table.index('user_id');
    table.index('character_id');
    table.index('is_online');
    table.index('joined_at');
  });

  // Copy data (only rows with non-null character_id)
  await knex.raw(`
    INSERT INTO game_players_old 
    SELECT * FROM game_players WHERE character_id IS NOT NULL
  `);

  // Drop current table
  await knex.schema.dropTable('game_players');

  // Rename old table back
  await knex.schema.renameTable('game_players_old', 'game_players');
} 