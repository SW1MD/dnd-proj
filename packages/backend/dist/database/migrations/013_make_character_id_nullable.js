"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('game_players_new', (table) => {
        table.uuid('id').primary();
        table.uuid('game_id').references('id').inTable('game_sessions').onDelete('CASCADE').notNullable();
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.uuid('character_id').references('id').inTable('characters').onDelete('CASCADE').nullable();
        table.boolean('is_online').defaultTo(true).notNullable();
        table.timestamp('joined_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('last_active_at').defaultTo(knex.fn.now()).notNullable();
        table.enum('role', ['player', 'co_dm', 'observer']).defaultTo('player').notNullable();
        table.json('game_settings').defaultTo('{}').notNullable();
        table.timestamps(true, true);
        table.unique(['game_id', 'user_id']);
        table.index('game_id');
        table.index('user_id');
        table.index('character_id');
        table.index('is_online');
        table.index('joined_at');
    });
    await knex.raw(`
    INSERT INTO game_players_new 
    SELECT * FROM game_players
  `);
    await knex.schema.dropTable('game_players');
    await knex.schema.renameTable('game_players_new', 'game_players');
}
async function down(knex) {
    await knex.schema.createTable('game_players_old', (table) => {
        table.uuid('id').primary();
        table.uuid('game_id').references('id').inTable('game_sessions').onDelete('CASCADE').notNullable();
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.uuid('character_id').references('id').inTable('characters').onDelete('CASCADE').notNullable();
        table.boolean('is_online').defaultTo(true).notNullable();
        table.timestamp('joined_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('last_active_at').defaultTo(knex.fn.now()).notNullable();
        table.enum('role', ['player', 'co_dm', 'observer']).defaultTo('player').notNullable();
        table.json('game_settings').defaultTo('{}').notNullable();
        table.timestamps(true, true);
        table.unique(['game_id', 'user_id']);
        table.index('game_id');
        table.index('user_id');
        table.index('character_id');
        table.index('is_online');
        table.index('joined_at');
    });
    await knex.raw(`
    INSERT INTO game_players_old 
    SELECT * FROM game_players WHERE character_id IS NOT NULL
  `);
    await knex.schema.dropTable('game_players');
    await knex.schema.renameTable('game_players_old', 'game_players');
}
//# sourceMappingURL=013_make_character_id_nullable.js.map