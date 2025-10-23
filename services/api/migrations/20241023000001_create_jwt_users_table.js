// migrations/20241023000001_create_jwt_users_table.js
// Create jwt_users table for JWT authentication data

exports.up = function(knex) {
  return knex.schema.createTable('jwt_users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.string('password_hash').notNullable();
    table.string('username', 50);
    table.string('first_name', 50);
    table.string('last_name', 50);
    table.string('phone_number', 20);
    table.date('date_of_birth');
    table.string('gender', 20);
    table.string('email_verification_token', 100);
    table.timestamp('email_verification_expires');
    table.string('password_reset_token', 100);
    table.timestamp('password_reset_expires');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign key constraint
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

    // Indexes
    table.index('user_id');
    table.index('username');
    table.index('email_verification_token');
    table.index('password_reset_token');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('jwt_users');
};
