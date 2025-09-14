/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('flows', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 100).notNullable();
    table.text('description');
    table.enum('tracking_type', ['Binary', 'Quantitative', 'Time-based']).notNullable();
    table.enum('frequency', ['Daily', 'Weekly', 'Monthly']).notNullable();
    table.boolean('every_day').defaultTo(false);
    table.json('days_of_week'); // Array of day names
    table.timestamp('reminder_time');
    table.enum('reminder_level', ['1', '2', '3']);
    table.boolean('cheat_mode').defaultTo(false);
    table.uuid('plan_id').references('id').inTable('plans').onDelete('SET NULL');
    table.json('goal'); // { type, value, unit }
    table.enum('progress_mode', ['sum', 'average', 'latest']).defaultTo('sum');
    table.json('tags'); // Array of strings
    table.boolean('archived').defaultTo(false);
    table.enum('visibility', ['private', 'friends', 'public']).defaultTo('private');
    table.uuid('owner_id').notNullable(); // References user ID
    table.integer('schema_version').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Indexes
    table.index(['owner_id', 'deleted_at']);
    table.index(['visibility', 'archived', 'deleted_at']);
    table.index(['tracking_type', 'deleted_at']);
    table.index(['plan_id', 'deleted_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('flows');
};
