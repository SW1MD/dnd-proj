"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('game_players', (table) => {
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
}
async function down(knex) {
    return knex.schema.dropTable('game_players');
}
//# sourceMappingURL=004_create_game_players.js.map