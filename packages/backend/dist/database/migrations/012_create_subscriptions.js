"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('subscription_plans', (table) => {
        table.uuid('id').primary();
        table.string('name', 100).notNullable();
        table.string('slug', 50).notNullable().unique();
        table.text('description').nullable();
        table.decimal('price', 10, 2).notNullable();
        table.string('currency', 3).defaultTo('USD');
        table.enum('billing_period', ['monthly', 'yearly']).defaultTo('monthly');
        table.integer('max_characters').nullable();
        table.integer('max_simultaneous_games').nullable();
        table.integer('max_players_per_game').nullable();
        table.boolean('ai_dm_access').defaultTo(false);
        table.boolean('ai_map_generation').defaultTo(false);
        table.boolean('premium_character_options').defaultTo(false);
        table.boolean('voice_chat').defaultTo(false);
        table.boolean('custom_campaigns').defaultTo(false);
        table.boolean('priority_support').defaultTo(false);
        table.integer('storage_gb').defaultTo(1);
        table.json('features').nullable();
        table.boolean('is_active').defaultTo(true);
        table.integer('sort_order').defaultTo(0);
        table.timestamps(true, true);
        table.index(['is_active', 'sort_order']);
    });
    await knex.schema.createTable('user_subscriptions', (table) => {
        table.uuid('id').primary();
        table.uuid('user_id').notNullable();
        table.uuid('plan_id').notNullable();
        table.string('stripe_subscription_id', 100).nullable();
        table.string('stripe_customer_id', 100).nullable();
        table.enum('status', ['active', 'canceled', 'past_due', 'unpaid', 'incomplete']).defaultTo('active');
        table.timestamp('current_period_start').nullable();
        table.timestamp('current_period_end').nullable();
        table.timestamp('trial_start').nullable();
        table.timestamp('trial_end').nullable();
        table.timestamp('canceled_at').nullable();
        table.timestamp('ended_at').nullable();
        table.decimal('amount', 10, 2).notNullable();
        table.string('currency', 3).defaultTo('USD');
        table.string('billing_period', 20).defaultTo('monthly');
        table.json('metadata').nullable();
        table.timestamps(true, true);
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.foreign('plan_id').references('id').inTable('subscription_plans').onDelete('RESTRICT');
        table.index(['user_id', 'status']);
        table.index(['stripe_subscription_id']);
        table.index(['current_period_end']);
    });
    await knex.schema.createTable('subscription_usage', (table) => {
        table.uuid('id').primary();
        table.uuid('user_id').notNullable();
        table.uuid('subscription_id').notNullable();
        table.string('metric', 50).notNullable();
        table.integer('count').defaultTo(0);
        table.date('date').notNullable();
        table.json('details').nullable();
        table.timestamps(true, true);
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.foreign('subscription_id').references('id').inTable('user_subscriptions').onDelete('CASCADE');
        table.unique(['user_id', 'subscription_id', 'metric', 'date']);
        table.index(['date', 'metric']);
    });
    await knex.schema.createTable('payment_history', (table) => {
        table.uuid('id').primary();
        table.uuid('user_id').notNullable();
        table.uuid('subscription_id').notNullable();
        table.string('stripe_payment_intent_id', 100).nullable();
        table.string('stripe_invoice_id', 100).nullable();
        table.decimal('amount', 10, 2).notNullable();
        table.string('currency', 3).defaultTo('USD');
        table.enum('status', ['succeeded', 'pending', 'failed', 'canceled', 'refunded']).notNullable();
        table.string('payment_method', 50).nullable();
        table.text('failure_reason').nullable();
        table.json('metadata').nullable();
        table.timestamp('processed_at').nullable();
        table.timestamps(true, true);
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.foreign('subscription_id').references('id').inTable('user_subscriptions').onDelete('CASCADE');
        table.index(['user_id', 'status']);
        table.index(['stripe_payment_intent_id']);
        table.index(['processed_at']);
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('payment_history');
    await knex.schema.dropTableIfExists('subscription_usage');
    await knex.schema.dropTableIfExists('user_subscriptions');
    await knex.schema.dropTableIfExists('subscription_plans');
}
//# sourceMappingURL=012_create_subscriptions.js.map