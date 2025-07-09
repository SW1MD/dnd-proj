import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('chat_messages', (table) => {
    table.uuid('id').primary();
    table.uuid('game_id').references('id').inTable('game_sessions').onDelete('CASCADE').notNullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.text('message').notNullable();
    table.enum('type', ['player', 'dm', 'system', 'ai', 'whisper', 'ooc']).defaultTo('player').notNullable();
    table.timestamp('timestamp').defaultTo(knex.fn.now()).notNullable();
    
    // Message metadata
    table.json('metadata').defaultTo('{}').notNullable(); // Additional message data
    table.boolean('is_deleted').defaultTo(false).notNullable();
    table.timestamp('deleted_at').nullable();
    
    // Whisper/private message handling
    table.uuid('whisper_to_user_id').references('id').inTable('users').onDelete('CASCADE').nullable();
    table.boolean('is_private').defaultTo(false).notNullable();
    
    // AI context
    table.boolean('trigger_ai_response').defaultTo(false).notNullable();
    table.text('ai_response').nullable();
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('game_id');
    table.index('user_id');
    table.index('type');
    table.index('timestamp');
    table.index('is_deleted');
    table.index('whisper_to_user_id');
    table.index('is_private');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('chat_messages');
} 