import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('auth_tokens', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('token', 500).notNullable();
    table.enum('type', ['access', 'refresh', 'reset_password', 'verify_email']).notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_revoked').defaultTo(false).notNullable();
    table.timestamp('revoked_at').nullable();
    table.string('device_info', 500).nullable(); // User agent, IP, etc.
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('token');
    table.index('type');
    table.index('expires_at');
    table.index('is_revoked');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('auth_tokens');
} 