import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('characters', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('name', 100).notNullable();
    table.enum('class', [
      'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk',
      'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'
    ]).notNullable();
    table.enum('race', [
      'human', 'elf', 'dwarf', 'halfling', 'dragonborn', 'gnome',
      'half-elf', 'half-orc', 'tiefling'
    ]).notNullable();
    table.integer('level').defaultTo(1).notNullable();
    table.integer('experience').defaultTo(0).notNullable();
    
    // Hit Points
    table.integer('hp_current').notNullable();
    table.integer('hp_maximum').notNullable();
    table.integer('hp_temporary').defaultTo(0).notNullable();
    
    // Core stats
    table.integer('armor_class').notNullable();
    table.integer('proficiency_bonus').notNullable();
    table.integer('speed').notNullable();
    
    // Ability Scores
    table.integer('strength').notNullable();
    table.integer('dexterity').notNullable();
    table.integer('constitution').notNullable();
    table.integer('intelligence').notNullable();
    table.integer('wisdom').notNullable();
    table.integer('charisma').notNullable();
    
    // Skills (stored as JSON)
    table.json('skills').defaultTo('{}').notNullable();
    
    // Inventory (stored as JSON array)
    table.json('inventory').defaultTo('[]').notNullable();
    
    // Spells (stored as JSON array)
    table.json('spells').defaultTo('[]').notNullable();
    
    // Character details
    table.string('background', 100).notNullable();
    table.string('alignment', 50).notNullable();
    table.text('personality_traits').nullable();
    table.text('ideals').nullable();
    table.text('bonds').nullable();
    table.text('flaws').nullable();
    
    // Avatar/image
    table.string('avatar_url').nullable();
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('class');
    table.index('race');
    table.index('level');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('characters');
} 