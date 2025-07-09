"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.alterTable('game_sessions', (table) => {
        table.foreign('current_map_id').references('id').inTable('maps').onDelete('SET NULL');
    });
}
async function down(knex) {
    return knex.schema.alterTable('game_sessions', (table) => {
        table.dropForeign(['current_map_id']);
    });
}
//# sourceMappingURL=011_add_foreign_keys.js.map