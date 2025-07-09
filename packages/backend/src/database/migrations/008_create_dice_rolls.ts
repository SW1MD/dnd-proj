import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('dice_rolls', (table) => {
    table.uuid('id').primary();
    table.uuid('game_id').references('id').inTable('game_sessions').onDelete('CASCADE').notNullable();
    table.uuid('player_id').references('id').inTable('game_players').onDelete('CASCADE').notNullable();
    table.string('type', 50).notNullable(); // e.g., "d20", "2d6", "damage", "attack"
    table.integer('result').notNullable(); // Final result after modifiers
    table.json('rolls').notNullable(); // Array of individual dice results
    table.integer('modifier').defaultTo(0).notNullable();
    table.string('description', 200).notNullable();
    table.timestamp('timestamp').defaultTo(knex.fn.now()).notNullable();
    
    // Context for the roll
    table.string('context', 100).nullable(); // e.g., "initiative", "attack_roll", "skill_check"
    table.uuid('related_action_id').references('id').inTable('game_actions').onDelete('SET NULL').nullable();
    
    // Roll metadata
    table.boolean('is_critical').defaultTo(false).notNullable(); // Natural 20 or 1
    table.boolean('has_advantage').defaultTo(false).notNullable();
    table.boolean('has_disadvantage').defaultTo(false).notNullable();
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('game_id');
    table.index('player_id');
    table.index('type');
    table.index('timestamp');
    table.index('context');
    table.index('is_critical');
    table.index('related_action_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('dice_rolls');
} 