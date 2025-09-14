/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('flow_entries', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('flow_id').references('id').inTable('flows').onDelete('CASCADE').notNullable();
    table.date('date').notNullable();
    table.enum('symbol', ['✓', '✗', '+']).notNullable();
    table.string('emotion', 50);
    table.integer('mood_score').checkBetween([1, 5]);
    table.text('note');
    table.json('quantitative'); // { unitText, count }
    table.json('timebased'); // { totalDuration, segments }
    table.enum('device', ['mobile', 'web', 'api']).defaultTo('api');
    table.json('geo'); // { lat, lng, accuracy }
    table.integer('streak_count').defaultTo(0);
    table.boolean('edited').defaultTo(false);
    table.uuid('edited_by');
    table.timestamp('edited_at');
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.integer('schema_version').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Indexes
    table.index(['flow_id', 'date', 'deleted_at']);
    table.index(['flow_id', 'symbol', 'deleted_at']);
    table.index(['date', 'deleted_at']);
    table.unique(['flow_id', 'date'], { 
      indexName: 'unique_flow_date',
      where: 'deleted_at IS NULL'
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('flow_entries');
};
