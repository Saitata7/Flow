/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('plan_participants', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('plan_id').references('id').inTable('plans').onDelete('CASCADE').notNullable();
    table.uuid('user_id').notNullable(); // References auth user ID
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.timestamp('left_at');
    table.enum('status', ['active', 'left', 'removed']).defaultTo('active');

    // Indexes
    table.index(['plan_id', 'status']);
    table.index(['user_id', 'status']);
    table.unique(['plan_id', 'user_id'], { 
      indexName: 'unique_plan_user',
      where: 'status = \'active\''
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('plan_participants');
};
