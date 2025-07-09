"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
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
        table.integer('hp_current').notNullable();
        table.integer('hp_maximum').notNullable();
        table.integer('hp_temporary').defaultTo(0).notNullable();
        table.integer('armor_class').notNullable();
        table.integer('proficiency_bonus').notNullable();
        table.integer('speed').notNullable();
        table.integer('strength').notNullable();
        table.integer('dexterity').notNullable();
        table.integer('constitution').notNullable();
        table.integer('intelligence').notNullable();
        table.integer('wisdom').notNullable();
        table.integer('charisma').notNullable();
        table.json('skills').defaultTo('{}').notNullable();
        table.json('inventory').defaultTo('[]').notNullable();
        table.json('spells').defaultTo('[]').notNullable();
        table.string('background', 100).notNullable();
        table.string('alignment', 50).notNullable();
        table.text('personality_traits').nullable();
        table.text('ideals').nullable();
        table.text('bonds').nullable();
        table.text('flaws').nullable();
        table.string('avatar_url').nullable();
        table.timestamps(true, true);
        table.index('user_id');
        table.index('class');
        table.index('race');
        table.index('level');
    });
}
async function down(knex) {
    return knex.schema.dropTable('characters');
}
//# sourceMappingURL=002_create_characters.js.map