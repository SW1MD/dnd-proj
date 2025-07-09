"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('friendships', (table) => {
        table.uuid('id').primary();
        table.uuid('requester_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.uuid('receiver_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.enum('status', ['pending', 'accepted', 'blocked']).defaultTo('pending').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
        table.unique(['requester_id', 'receiver_id']);
        table.check('requester_id != receiver_id');
    });
    await knex.schema.createTable('direct_messages', (table) => {
        table.uuid('id').primary();
        table.uuid('sender_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.uuid('receiver_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.text('content').notNullable();
        table.boolean('is_read').defaultTo(false).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('read_at').nullable();
        table.index(['sender_id', 'receiver_id', 'created_at']);
        table.index(['receiver_id', 'is_read']);
    });
    await knex.schema.createTable('game_invitations', (table) => {
        table.uuid('id').primary();
        table.uuid('game_id').references('id').inTable('game_sessions').onDelete('CASCADE').notNullable();
        table.uuid('inviter_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.uuid('invitee_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.enum('status', ['pending', 'accepted', 'declined', 'expired']).defaultTo('pending').notNullable();
        table.text('message').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('responded_at').nullable();
        table.timestamp('expires_at').nullable();
        table.unique(['game_id', 'invitee_id']);
        table.index(['invitee_id', 'status']);
        table.index(['game_id', 'status']);
    });
    await knex.schema.alterTable('friendships', (table) => {
        table.index(['requester_id', 'status']);
        table.index(['receiver_id', 'status']);
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('game_invitations');
    await knex.schema.dropTableIfExists('direct_messages');
    await knex.schema.dropTableIfExists('friendships');
}
//# sourceMappingURL=014_create_social_features.js.map