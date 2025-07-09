"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('chat_messages', (table) => {
        table.uuid('id').primary();
        table.uuid('game_id').references('id').inTable('game_sessions').onDelete('CASCADE').notNullable();
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.text('message').notNullable();
        table.enum('type', ['player', 'dm', 'system', 'ai', 'whisper', 'ooc']).defaultTo('player').notNullable();
        table.timestamp('timestamp').defaultTo(knex.fn.now()).notNullable();
        table.json('metadata').defaultTo('{}').notNullable();
        table.boolean('is_deleted').defaultTo(false).notNullable();
        table.timestamp('deleted_at').nullable();
        table.uuid('whisper_to_user_id').references('id').inTable('users').onDelete('CASCADE').nullable();
        table.boolean('is_private').defaultTo(false).notNullable();
        table.boolean('trigger_ai_response').defaultTo(false).notNullable();
        table.text('ai_response').nullable();
        table.timestamps(true, true);
        table.index('game_id');
        table.index('user_id');
        table.index('type');
        table.index('timestamp');
        table.index('is_deleted');
        table.index('whisper_to_user_id');
        table.index('is_private');
    });
}
async function down(knex) {
    return knex.schema.dropTable('chat_messages');
}
//# sourceMappingURL=009_create_chat_messages.js.map