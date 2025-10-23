// migrations/20241023000000_add_jwt_auth_columns.js
// Add JWT authentication columns to users table

exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Add JWT authentication columns
    table.string('password_hash').nullable();
    table.string('email_verification_token').nullable();
    table.timestamp('email_verification_expires').nullable();
    table.string('password_reset_token').nullable();
    table.timestamp('password_reset_expires').nullable();
    table.string('role').defaultTo('user');
    table.string('status').defaultTo('active');
    table.timestamp('last_login_at').nullable();
    
    // Add indexes for performance
    table.index('email_verification_token');
    table.index('password_reset_token');
    table.index('status');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Remove JWT authentication columns
    table.dropColumn('password_hash');
    table.dropColumn('email_verification_token');
    table.dropColumn('email_verification_expires');
    table.dropColumn('password_reset_token');
    table.dropColumn('password_reset_expires');
    table.dropColumn('role');
    table.dropColumn('status');
    table.dropColumn('last_login_at');
  });
};
