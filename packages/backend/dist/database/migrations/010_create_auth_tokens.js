"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('auth_tokens', (table) => {
        table.uuid('id').primary();
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.string('token', 500).notNullable();
        table.enum('type', ['access', 'refresh', 'reset_password', 'verify_email']).notNullable();
        table.timestamp('expires_at').notNullable();
        table.boolean('is_revoked').defaultTo(false).notNullable();
        table.timestamp('revoked_at').nullable();
        table.string('device_info', 500).nullable();
        table.timestamps(true, true);
        table.index('user_id');
        table.index('token');
        table.index('type');
        table.index('expires_at');
        table.index('is_revoked');
    });
}
async function down(knex) {
    return knex.schema.dropTable('auth_tokens');
}
//# sourceMappingURL=010_create_auth_tokens.js.map