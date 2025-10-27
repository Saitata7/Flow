/**
 * Migration: Create sessions table for session-based authentication
 * This table stores session tokens for JWT/session authentication
 */

exports.up = async function(knex) {
  console.log('🔐 Creating sessions table for authentication...');

  // Check if sessions table already exists
  const tableExists = await knex.schema.hasTable('sessions');
  
  if (tableExists) {
    console.log('✅ Sessions table already exists');
    return;
  }

  await knex.schema.createTable('sessions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.string('session_token', 128).unique().notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('revoked').defaultTo(false);
    table.string('device_id', 256).nullable(); // Optional device binding
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign key to users table
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

    // Indexes for performance
    table.index('user_id', 'idx_sessions_user_id');
    table.index('session_token', 'idx_sessions_token');
    table.index('expires_at', 'idx_sessions_expires');
    table.index('revoked');
    table.index('device_id');
  });

  console.log('✅ Sessions table created successfully');
};

exports.down = async function(knex) {
  console.log('🗑️  Dropping sessions table...');
  await knex.schema.dropTableIfExists('sessions');
  console.log('✅ Sessions table dropped');
};

