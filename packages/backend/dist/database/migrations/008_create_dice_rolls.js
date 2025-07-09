"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('dice_rolls', (table) => {
        table.uuid('id').primary();
        table.uuid('game_id').references('id').inTable('game_sessions').onDelete('CASCADE').notNullable();
        table.uuid('player_id').references('id').inTable('game_players').onDelete('CASCADE').notNullable();
        table.string('type', 50).notNullable();
        table.integer('result').notNullable();
        table.json('rolls').notNullable();
        table.integer('modifier').defaultTo(0).notNullable();
        table.string('description', 200).notNullable();
        table.timestamp('timestamp').defaultTo(knex.fn.now()).notNullable();
        table.string('context', 100).nullable();
        table.uuid('related_action_id').references('id').inTable('game_actions').onDelete('SET NULL').nullable();
        table.boolean('is_critical').defaultTo(false).notNullable();
        table.boolean('has_advantage').defaultTo(false).notNullable();
        table.boolean('has_disadvantage').defaultTo(false).notNullable();
        table.timestamps(true, true);
        table.index('game_id');
        table.index('player_id');
        table.index('type');
        table.index('timestamp');
        table.index('context');
        table.index('is_critical');
        table.index('related_action_id');
    });
}
async function down(knex) {
    return knex.schema.dropTable('dice_rolls');
}
//# sourceMappingURL=008_create_dice_rolls.js.map