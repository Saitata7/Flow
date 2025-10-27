/**
 * Migration: Create sync_log table for idempotency tracking
 * This table stores sync operations to prevent duplicates and enable audit trails
 */

exports.up = async function(knex) {
  console.log('🔄 Creating sync_log table for idempotency tracking...');

  // Check if sync_log table already exists
  const tableExists = await knex.schema.hasTable('sync_log');
  
  if (tableExists) {
    console.log('✅ Sync_log table already exists');
    return;
  }

  await knex.schema.createTable('sync_log', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.string('idempotency_key', 256).unique().notNullable(); // Unique key for idempotency
    table.string('operation_type', 64).notNullable(); // e.g., 'CREATE_FLOW', 'UPDATE_FLOW', 'DELETE_FLOW'
    table.jsonb('request_payload').nullable(); // Original request data
    table.jsonb('response_payload').nullable(); // Response data
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Foreign key to users table
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

    // Indexes for performance
    table.index('user_id');
    table.index('idempotency_key', 'idx_sync_log_idempotency');
    table.index('operation_type');
    table.index('created_at');
  });

  console.log('✅ Sync_log table created successfully');
};

exports.down = async function(knex) {
  console.log('🗑️  Dropping sync_log table...');
  await knex.schema.dropTableIfExists('sync_log');
  console.log('✅ Sync_log table dropped');
};

