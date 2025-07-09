import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('maps', (table) => {
    table.uuid('id').primary();
    table.string('name', 200).notNullable();
    table.text('description').nullable();
    table.enum('type', ['dungeon', 'overworld', 'building', 'cave', 'forest', 'city']).notNullable();
    table.integer('width').notNullable();
    table.integer('height').notNullable();
    table.string('theme', 100).notNullable(); // e.g., "ancient tomb", "goblin lair"
    table.enum('difficulty', ['easy', 'medium', 'hard', 'deadly']).notNullable();
    table.integer('recommended_level').notNullable();
    
    // Map data stored as JSON
    table.json('tiles').notNullable(); // 2D array of tile data
    table.json('rooms').defaultTo('[]').notNullable(); // Array of room objects
    table.json('npcs').defaultTo('[]').notNullable(); // Array of NPC objects
    table.json('starting_position').notNullable(); // {x, y} coordinates
    
    // AI generation data
    table.text('ai_generation_prompt').nullable();
    table.json('ai_metadata').defaultTo('{}').notNullable();
    
    // Map settings
    table.boolean('is_public').defaultTo(true).notNullable();
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL').nullable();
    
    // Image/visual data
    table.string('thumbnail_url').nullable();
    table.string('full_image_url').nullable();
    
    table.timestamps(true, true);
    
    // Indexes
    table.index('type');
    table.index('difficulty');
    table.index('recommended_level');
    table.index('is_public');
    table.index('created_by');
    table.index('theme');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('maps');
} 