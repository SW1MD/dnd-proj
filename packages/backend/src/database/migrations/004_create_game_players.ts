import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('game_players', (table) => {
    table.uuid('id').primary();
    table.uuid('game_id').references('id').inTable('game_sessions').onDelete('CASCADE').notNullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('character_id').references('id').inTable('characters').onDelete('CASCADE').notNullable();
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
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('game_players');
} 