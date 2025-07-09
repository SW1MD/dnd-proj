"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('game_actions', (table) => {
        table.uuid('id').primary();
        table.uuid('game_id').references('id').inTable('game_sessions').onDelete('CASCADE').notNullable();
        table.uuid('player_id').references('id').inTable('game_players').onDelete('CASCADE').notNullable();
        table.enum('type', ['attack', 'cast_spell', 'move', 'interact', 'dialogue', 'inventory', 'skill_check', 'saving_throw']).notNullable();
        table.string('description', 500).notNullable();
        table.json('data').defaultTo('{}').notNullable();
        table.boolean('resolved').defaultTo(false).notNullable();
        table.json('result').nullable();
        table.timestamp('timestamp').defaultTo(knex.fn.now()).notNullable();
        table.boolean('ai_processed').defaultTo(false).notNullable();
        table.text('ai_response').nullable();
        table.timestamps(true, true);
        table.index('game_id');
        table.index('player_id');
        table.index('type');
        table.index('resolved');
        table.index('timestamp');
        table.index('ai_processed');
    });
}
async function down(knex) {
    return knex.schema.dropTable('game_actions');
}
//# sourceMappingURL=006_create_game_actions.js.map