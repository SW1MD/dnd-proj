import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create friendships table for friend relationships
  await knex.schema.createTable('friendships', (table) => {
    table.uuid('id').primary();
    table.uuid('requester_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('receiver_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.enum('status', ['pending', 'accepted', 'blocked']).defaultTo('pending').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    
    // Ensure unique friendship pairs
    table.unique(['requester_id', 'receiver_id']);
    // Prevent self-friendship
    table.check('requester_id != receiver_id');
  });

  // Create direct_messages table for private messaging
  await knex.schema.createTable('direct_messages', (table) => {
    table.uuid('id').primary();
    table.uuid('sender_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('receiver_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.text('content').notNullable();
    table.boolean('is_read').defaultTo(false).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('read_at').nullable();
    
    // Index for efficient querying
    table.index(['sender_id', 'receiver_id', 'created_at']);
    table.index(['receiver_id', 'is_read']);
  });

  // Create game_invitations table for inviting friends to games
  await knex.schema.createTable('game_invitations', (table) => {
    table.uuid('id').primary();
    table.uuid('game_id').references('id').inTable('game_sessions').onDelete('CASCADE').notNullable();
    table.uuid('inviter_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('invitee_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.enum('status', ['pending', 'accepted', 'declined', 'expired']).defaultTo('pending').notNullable();
    table.text('message').nullable(); // Optional invitation message
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('responded_at').nullable();
    table.timestamp('expires_at').nullable(); // Optional expiration
    
    // Ensure unique invitations per game/user pair
    table.unique(['game_id', 'invitee_id']);
    // Index for efficient querying
    table.index(['invitee_id', 'status']);
    table.index(['game_id', 'status']);
  });

  // Add indexes for performance
  await knex.schema.alterTable('friendships', (table) => {
    table.index(['requester_id', 'status']);
    table.index(['receiver_id', 'status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('game_invitations');
  await knex.schema.dropTableIfExists('direct_messages');
  await knex.schema.dropTableIfExists('friendships');
} 