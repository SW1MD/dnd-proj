import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add foreign key constraint for current_map_id in game_sessions
  return knex.schema.alterTable('game_sessions', (table) => {
    table.foreign('current_map_id').references('id').inTable('maps').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('game_sessions', (table) => {
    table.dropForeign(['current_map_id']);
  });
} 