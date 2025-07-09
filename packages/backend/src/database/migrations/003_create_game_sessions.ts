import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('game_sessions', (table) => {
    table.uuid('id').primary();
    table.string('name', 200).notNullable();
    table.text('description').nullable();
    table.uuid('dm_user_id').references('id').inTable('users').onDelete('SET NULL').nullable();
    table.integer('max_players').defaultTo(6).notNullable();
    table.enum('status', ['waiting', 'active', 'paused', 'completed']).defaultTo('waiting').notNullable();
    table.uuid('current_map_id').nullable(); // Will reference maps table
    
    // Game state stored as JSON
    table.json('game_state').defaultTo('{}').notNullable();
    
    // Session settings
    table.boolean('is_public').defaultTo(true).notNullable();
    table.string('password_hash').nullable(); // For private games
    table.integer('session_duration').nullable(); // In minutes
    
    // AI settings
    table.json('ai_settings').defaultTo(JSON.stringify({
      difficultyLevel: 'medium',
      aiPersonality: 'helpful',
      autoGeneration: true,
      voiceEnabled: false,
    })).notNullable();
    
    table.timestamps(true, true);
    table.timestamp('last_active_at').defaultTo(knex.fn.now()).notNullable();
    
    // Indexes
    table.index('dm_user_id');
    table.index('status');
    table.index('is_public');
    table.index('last_active_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('game_sessions');
} 