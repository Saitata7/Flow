/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('plans', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 100).notNullable();
    table.string('category', 50);
    table.enum('plan_kind', ['Challenge', 'Template', 'CoachPlan']).notNullable();
    table.enum('type', ['Public', 'Private', 'Group']).notNullable();
    table.enum('visibility', ['private', 'friends', 'public']).defaultTo('private');
    table.json('participants'); // Array of user IDs
    table.date('start_date');
    table.date('end_date');
    table.enum('status', ['draft', 'active', 'archived']).defaultTo('draft');
    table.json('rules'); // { frequency, scoring, cheatModePolicy }
    table.json('tags'); // Array of strings
    table.uuid('owner_id').notNullable(); // References user ID
    table.integer('schema_version').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Indexes
    table.index(['owner_id', 'deleted_at']);
    table.index(['visibility', 'status', 'deleted_at']);
    table.index(['plan_kind', 'deleted_at']);
    table.index(['type', 'status', 'deleted_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('plans');
};
