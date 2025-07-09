import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add new profile fields to users table
  await knex.schema.alterTable('users', (table) => {
    table.text('bio').nullable(); // User biography/description
    table.string('avatar_url').nullable(); // Profile picture URL
    table.string('banner_url').nullable(); // Profile banner image URL
    table.string('location', 100).nullable(); // User location
    table.json('interests').defaultTo('[]').notNullable(); // Array of interests/hobbies
    table.json('social_links').defaultTo('{}').notNullable(); // Discord, Twitter, etc.
    table.enum('privacy_level', ['public', 'friends', 'private']).defaultTo('public').notNullable();
    table.timestamp('profile_updated_at').nullable();
  });

  // Create posts table for user posts/updates
  await knex.schema.createTable('user_posts', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.text('content').notNullable();
    table.json('media_urls').defaultTo('[]').notNullable(); // Array of image/video URLs
    table.enum('post_type', ['text', 'achievement', 'game_highlight', 'character_showcase']).defaultTo('text').notNullable();
    table.json('metadata').defaultTo('{}').notNullable(); // Achievement data, game stats, etc.
    table.boolean('is_public').defaultTo(true).notNullable();
    table.integer('likes_count').defaultTo(0).notNullable();
    table.integer('comments_count').defaultTo(0).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    
    // Indexes
    table.index(['user_id', 'created_at']);
    table.index(['post_type', 'is_public']);
    table.index('created_at');
  });

  // Create notifications table
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.enum('type', [
      'friend_request', 'friend_accepted', 'message_received', 
      'game_invitation', 'game_started', 'post_liked', 
      'post_commented', 'achievement_unlocked'
    ]).notNullable();
    table.string('title', 200).notNullable();
    table.text('message').notNullable();
    table.json('data').defaultTo('{}').notNullable(); // Related IDs, URLs, etc.
    table.boolean('is_read').defaultTo(false).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('read_at').nullable();
    
    // Indexes
    table.index(['user_id', 'is_read']);
    table.index(['user_id', 'created_at']);
    table.index('type');
  });

  // Create post likes table
  await knex.schema.createTable('post_likes', (table) => {
    table.uuid('id').primary();
    table.uuid('post_id').references('id').inTable('user_posts').onDelete('CASCADE').notNullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    
    // Unique constraint - one like per user per post
    table.unique(['post_id', 'user_id']);
    
    // Indexes
    table.index('post_id');
    table.index('user_id');
  });

  // Create post comments table
  await knex.schema.createTable('post_comments', (table) => {
    table.uuid('id').primary();
    table.uuid('post_id').references('id').inTable('user_posts').onDelete('CASCADE').notNullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.text('content').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    
    // Indexes
    table.index(['post_id', 'created_at']);
    table.index('user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('post_comments');
  await knex.schema.dropTableIfExists('post_likes');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('user_posts');
  
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('bio');
    table.dropColumn('avatar_url');
    table.dropColumn('banner_url');
    table.dropColumn('location');
    table.dropColumn('interests');
    table.dropColumn('social_links');
    table.dropColumn('privacy_level');
    table.dropColumn('profile_updated_at');
  });
} 