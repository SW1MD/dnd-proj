import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_posts', (table) => {
    table.uuid('attached_game_id').references('id').inTable('game_sessions').onDelete('SET NULL').nullable();
    table.index('attached_game_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_posts', (table) => {
    table.dropColumn('attached_game_id');
  });
} 