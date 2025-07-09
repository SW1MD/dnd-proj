"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('users', (table) => {
        table.uuid('id').primary();
        table.string('email', 255).unique().notNullable();
        table.string('username', 50).unique().notNullable();
        table.string('display_name', 100).notNullable();
        table.string('password_hash', 255).notNullable();
        table.enum('role', ['player', 'dm', 'admin']).defaultTo('player').notNullable();
        table.boolean('is_verified').defaultTo(false).notNullable();
        table.boolean('is_online').defaultTo(false).notNullable();
        table.timestamp('last_login_at').nullable();
        table.json('preferences').defaultTo(JSON.stringify({
            theme: 'dark',
            notifications: true,
            soundEnabled: true,
            autoRollDice: false,
            showCombatAnimations: true,
        })).notNullable();
        table.json('stats').defaultTo(JSON.stringify({
            gamesPlayed: 0,
            totalPlayTime: 0,
            charactersCreated: 0,
            achievementsUnlocked: [],
        })).notNullable();
        table.timestamps(true, true);
        table.index('email');
        table.index('username');
        table.index('is_online');
    });
}
async function down(knex) {
    return knex.schema.dropTable('users');
}
//# sourceMappingURL=001_create_users.js.map