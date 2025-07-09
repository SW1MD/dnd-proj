"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('game_events', (table) => {
        table.uuid('id').primary();
        table.uuid('game_id').references('id').inTable('game_sessions').onDelete('CASCADE').notNullable();
        table.enum('type', ['combat_start', 'combat_end', 'level_up', 'item_found', 'npc_interaction', 'story_event', 'player_death', 'quest_complete']).notNullable();
        table.string('description', 500).notNullable();
        table.json('data').defaultTo('{}').notNullable();
        table.timestamp('timestamp').defaultTo(knex.fn.now()).notNullable();
        table.json('players_involved').defaultTo('[]').notNullable();
        table.boolean('is_public').defaultTo(true).notNullable();
        table.json('visible_to_players').defaultTo('[]').notNullable();
        table.text('ai_narrative').nullable();
        table.json('ai_metadata').defaultTo('{}').notNullable();
        table.timestamps(true, true);
        table.index('game_id');
        table.index('type');
        table.index('timestamp');
        table.index('is_public');
    });
}
async function down(knex) {
    return knex.schema.dropTable('game_events');
}
//# sourceMappingURL=007_create_game_events.js.map