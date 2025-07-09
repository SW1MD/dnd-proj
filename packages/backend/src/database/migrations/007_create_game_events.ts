import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('game_events', (table) => {
    table.uuid('id').primary();
    table.uuid('game_id').references('id').inTable('game_sessions').onDelete('CASCADE').notNullable();
    table.enum('type', ['combat_start', 'combat_end', 'level_up', 'item_found', 'npc_interaction', 'story_event', 'player_death', 'quest_complete']).notNullable();
    table.string('description', 500).notNullable();
    table.json('data').defaultTo('{}').notNullable(); // Event-specific data
    table.timestamp('timestamp').defaultTo(knex.fn.now()).notNullable();
    
    // Players involved in this event
    table.json('players_involved').defaultTo('[]').notNullable(); // Array of player IDs
    
    // Event visibility
    table.boolean('is_public').defaultTo(true).notNullable(); // Whether all players can see this event
    table.json('visible_to_players').defaultTo('[]').notNullable(); // Specific player IDs who can see private events
    
    // AI generated content
    table.text('ai_narrative').nullable(); // AI-generated narrative description
    table.json('ai_metadata').defaultTo('{}').notNullable();
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('game_id');
    table.index('type');
    table.index('timestamp');
    table.index('is_public');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('game_events');
} 