"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('game_sessions', (table) => {
        table.uuid('id').primary();
        table.string('name', 200).notNullable();
        table.text('description').nullable();
        table.uuid('dm_user_id').references('id').inTable('users').onDelete('SET NULL').nullable();
        table.integer('max_players').defaultTo(6).notNullable();
        table.enum('status', ['waiting', 'active', 'paused', 'completed']).defaultTo('waiting').notNullable();
        table.uuid('current_map_id').nullable();
        table.json('game_state').defaultTo('{}').notNullable();
        table.boolean('is_public').defaultTo(true).notNullable();
        table.string('password_hash').nullable();
        table.integer('session_duration').nullable();
        table.json('ai_settings').defaultTo(JSON.stringify({
            difficultyLevel: 'medium',
            aiPersonality: 'helpful',
            autoGeneration: true,
            voiceEnabled: false,
        })).notNullable();
        table.timestamps(true, true);
        table.timestamp('last_active_at').defaultTo(knex.fn.now()).notNullable();
        table.index('dm_user_id');
        table.index('status');
        table.index('is_public');
        table.index('last_active_at');
    });
}
async function down(knex) {
    return knex.schema.dropTable('game_sessions');
}
//# sourceMappingURL=003_create_game_sessions.js.map