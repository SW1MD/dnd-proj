import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
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
    
    // User preferences (stored as JSON)
    table.json('preferences').defaultTo(JSON.stringify({
      theme: 'dark',
      notifications: true,
      soundEnabled: true,
      autoRollDice: false,
      showCombatAnimations: true,
    })).notNullable();
    
    // User statistics (stored as JSON)
    table.json('stats').defaultTo(JSON.stringify({
      gamesPlayed: 0,
      totalPlayTime: 0,
      charactersCreated: 0,
      achievementsUnlocked: [],
    })).notNullable();
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('email');
    table.index('username');
    table.index('is_online');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
} 