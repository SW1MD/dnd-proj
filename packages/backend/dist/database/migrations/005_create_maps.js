"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('maps', (table) => {
        table.uuid('id').primary();
        table.string('name', 200).notNullable();
        table.text('description').nullable();
        table.enum('type', ['dungeon', 'overworld', 'building', 'cave', 'forest', 'city']).notNullable();
        table.integer('width').notNullable();
        table.integer('height').notNullable();
        table.string('theme', 100).notNullable();
        table.enum('difficulty', ['easy', 'medium', 'hard', 'deadly']).notNullable();
        table.integer('recommended_level').notNullable();
        table.json('tiles').notNullable();
        table.json('rooms').defaultTo('[]').notNullable();
        table.json('npcs').defaultTo('[]').notNullable();
        table.json('starting_position').notNullable();
        table.text('ai_generation_prompt').nullable();
        table.json('ai_metadata').defaultTo('{}').notNullable();
        table.boolean('is_public').defaultTo(true).notNullable();
        table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL').nullable();
        table.string('thumbnail_url').nullable();
        table.string('full_image_url').nullable();
        table.timestamps(true, true);
        table.index('type');
        table.index('difficulty');
        table.index('recommended_level');
        table.index('is_public');
        table.index('created_by');
        table.index('theme');
    });
}
async function down(knex) {
    return knex.schema.dropTable('maps');
}
//# sourceMappingURL=005_create_maps.js.map